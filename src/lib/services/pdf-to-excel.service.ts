import ExcelJS from "exceljs";
import { PDFParse } from "pdf-parse";
import { logError } from "@/lib/db/queries";
import {
  detectAmountColumns,
  extractPdfTables,
  isNumericCell,
  parseTabularFallback,
} from "@/lib/services/pdf-table-extract.service";

function autoFitColumns(sheet: ExcelJS.Worksheet, maxWidth = 48) {
  sheet.columns.forEach((column) => {
    let longest = 10;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      const value = cell.value?.toString() ?? "";
      longest = Math.max(longest, Math.min(value.length + 2, maxWidth));
    });
    column.width = longest;
  });
}

function styleHeaderRow(sheet: ExcelJS.Worksheet, rowNumber: number, columnCount: number) {
  const row = sheet.getRow(rowNumber);
  row.font = { bold: true, color: { argb: "FF1E293B" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };
  row.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  row.height = 22;

  for (let col = 1; col <= columnCount; col += 1) {
    sheet.getCell(rowNumber, col).border = {
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  }
}

function writeTableToSheet(
  sheet: ExcelJS.Worksheet,
  infoLines: string[],
  table: string[][],
  startRow = 1
): number {
  let rowPointer = startRow;

  const uniqueInfo = infoLines.filter((line, index, arr) => index === 0 || line !== arr[index - 1]);
  for (const line of uniqueInfo) {
    const row = sheet.getRow(rowPointer);
    row.getCell(1).value = line;
    if (rowPointer === startRow) {
      row.getCell(1).font = { bold: true, size: 13 };
    }
    rowPointer += 1;
  }

  if (uniqueInfo.length > 0) {
    rowPointer += 1;
  }

  const headerRowNumber = rowPointer;
  const amountColumns = detectAmountColumns(table[0] ?? []);

  table.forEach((tableRow, rowIndex) => {
    const excelRow = sheet.getRow(rowPointer);
    tableRow.forEach((value, colIndex) => {
      const cell = excelRow.getCell(colIndex + 1);
      if (rowIndex > 0 && amountColumns.includes(colIndex) && isNumericCell(value)) {
        cell.value = Number(value.replace(/,/g, ""));
        cell.numFmt = "#,##0.00";
        cell.alignment = { horizontal: "right" };
      } else {
        cell.value = value;
        cell.alignment = {
          vertical: "top",
          wrapText: colIndex === 2 || value.length > 28,
        };
      }
    });
    rowPointer += 1;
  });

  styleHeaderRow(sheet, headerRowNumber, table[0]?.length ?? 1);
  sheet.views = [{ state: "frozen", ySplit: headerRowNumber }];
  autoFitColumns(sheet);

  return rowPointer;
}

function pickBestTable(candidates: Array<string[][] | null | undefined>): string[][] | null {
  const valid = candidates.filter((table): table is string[][] => !!table && table.length > 1);
  if (valid.length === 0) return null;
  return valid.reduce((best, current) => (current.length > best.length ? current : best));
}

async function tryBorderedTables(fileBuffer: Buffer): Promise<string[][] | null> {
  const parser = new PDFParse({ data: fileBuffer });
  try {
    const result = await parser.getTable();
    const tables = result.pages.flatMap((page) => page.tables).filter((table) => table.length > 1);
    if (tables.length === 0) return null;

    const best = tables.reduce((current, candidate) =>
      candidate.length * (candidate[0]?.length ?? 0) > current.length * (current[0]?.length ?? 0)
        ? candidate
        : current
    );

    return best.every((row) => row.length === best[0].length) ? best : null;
  } catch {
    return null;
  } finally {
    await parser.destroy();
  }
}

async function fallbackTextTable(fileBuffer: Buffer): Promise<string[][]> {
  const parser = new PDFParse({ data: fileBuffer });
  try {
    const parsed = await parser.getText({
      lineEnforce: true,
      cellSeparator: "\t",
      cellThreshold: 5,
      lineThreshold: 6,
    });
    return parseTabularFallback(parsed.text);
  } finally {
    await parser.destroy();
  }
}

export async function pdfToExcel(fileBuffer: Buffer): Promise<Buffer> {
  try {
    const borderedTable = await tryBorderedTables(fileBuffer);
    const extracted = await extractPdfTables(fileBuffer);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "PDF Doctor";
    workbook.created = new Date();

    const mainTable = pickBestTable([
      extracted.primaryTable,
      borderedTable,
      extracted.pages.find((page) => page.table)?.table,
    ]);

    const mainInfo = extracted.infoLines;

    if (mainTable) {
      const sheet = workbook.addWorksheet("Statement");
      writeTableToSheet(sheet, mainInfo, mainTable);

      const expectedRows = extracted.pages.reduce(
        (sum, page) => sum + Math.max((page.table?.length ?? 1) - 1, 0),
        0
      );
      const actualRows = mainTable.length - 1;

      if (actualRows < expectedRows * 0.7 && extracted.pages.length > 1) {
        extracted.pages.forEach((page) => {
          if (!page.table || page.table.length <= 1) return;
          const sheetName = `Page ${page.pageNum}`.slice(0, 31);
          if (workbook.getWorksheet(sheetName)) return;
          const pageSheet = workbook.addWorksheet(sheetName);
          writeTableToSheet(pageSheet, page.infoLines, page.table);
        });
      }
    } else {
      const fallback = await fallbackTextTable(fileBuffer);
      const sheet = workbook.addWorksheet("Extracted Content");
      fallback.forEach((row) => sheet.addRow(row));
      autoFitColumns(sheet);
    }

    if (!mainTable) {
      extracted.pages.forEach((page) => {
        if (!page.table) return;
        const sheet = workbook.addWorksheet(`Page ${page.pageNum}`.slice(0, 31));
        writeTableToSheet(sheet, page.infoLines, page.table);
      });
    }

    if (workbook.worksheets.length === 0) {
      const sheet = workbook.addWorksheet("Extracted Content");
      sheet.addRow(["No extractable text found in this PDF."]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  } catch (err) {
    await logError({
      tool_name: "pdf-to-excel",
      error_type: "PDF_TO_EXCEL_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
    throw new Error(
      `Failed to convert PDF to Excel: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}
