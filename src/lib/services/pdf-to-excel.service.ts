import ExcelJS from "exceljs";
import { execFile } from "node:child_process";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { logError } from "@/lib/db/queries";

const execFileAsync = promisify(execFile);
const EXTRACT_SCRIPT = path.join(process.cwd(), "scripts", "pdf-extract-tables.py");

interface TableData {
  rows: string[][];
  row_count: number;
  col_count: number;
}

interface PageData {
  page: number;
  tables: TableData[];
  width: number;
  height: number;
}

interface ExtractResult {
  pageCount: number;
  pages: PageData[];
  mergedTables: TableData[];
  pagesText: string[];
}

/* ─── helpers ─── */

function isNumericValue(value: string): boolean {
  const cleaned = value.replace(/[$,\s%]/g, "");
  return /^-?\d+(\.\d+)?$/.test(cleaned);
}

function parseNumeric(value: string): number | null {
  const cleaned = value.replace(/[$,\s]/g, "");
  if (/^-?\d+(\.\d+)?%?$/.test(cleaned)) {
    if (value.includes("%")) {
      return parseFloat(cleaned.replace("%", "")) / 100;
    }
    return parseFloat(cleaned);
  }
  return null;
}

function isDateValue(value: string): boolean {
  return /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(value.trim());
}

function parseDate(value: string): Date | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!match) return null;
  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);
  let year = parseInt(match[3], 10);
  if (year < 100) year += year < 50 ? 2000 : 1900;
  // Use UTC to avoid timezone offset issues
  const date = new Date(Date.UTC(year, month - 1, day));
  if (isNaN(date.getTime())) return null;
  return date;
}

function detectColumnTypes(table: TableData): Map<number, "number" | "percent" | "currency" | "date" | "text"> {
  const types = new Map<number, "number" | "percent" | "currency" | "date" | "text">();
  if (table.rows.length < 2) return types;

  const header = table.rows[0];
  const dataRows = table.rows.slice(1, Math.min(21, table.rows.length));

  for (let col = 0; col < (header?.length ?? 0); col++) {
    const headerText = (header[col] ?? "").toLowerCase();
    const values = dataRows
      .map((r) => (r[col] ?? "").trim())
      .filter(Boolean);

    if (values.length === 0) {
      types.set(col, "text");
      continue;
    }

    const dateCount = values.filter(isDateValue).length;
    if (dateCount > values.length * 0.6 || /\bdate\b/i.test(headerText)) {
      types.set(col, "date");
      continue;
    }

    const percentCount = values.filter((v) => v.includes("%")).length;
    if (percentCount > values.length * 0.5 || /bonus\s*%|percent|rate/i.test(headerText)) {
      types.set(col, "percent");
      continue;
    }

    const currencyCount = values.filter((v) => /^\$/.test(v.trim())).length;
    if (currencyCount > values.length * 0.5 || /salary|amount|price|cost|total|pay/i.test(headerText)) {
      types.set(col, "currency");
      continue;
    }

    const numCount = values.filter(isNumericValue).length;
    if (numCount > values.length * 0.7 || /\bage\b|count|qty|quantity|num/i.test(headerText)) {
      types.set(col, "number");
      continue;
    }

    types.set(col, "text");
  }

  return types;
}

function autoFitColumns(sheet: ExcelJS.Worksheet, maxWidth = 48) {
  sheet.columns.forEach((column) => {
    let longest = 8;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      const value = cell.value?.toString() ?? "";
      longest = Math.max(longest, Math.min(value.length + 3, maxWidth));
    });
    column.width = longest;
  });
}

function styleHeaderRow(sheet: ExcelJS.Worksheet, rowNumber: number, columnCount: number) {
  const row = sheet.getRow(rowNumber);
  row.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  row.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  row.height = 24;

  for (let col = 1; col <= columnCount; col++) {
    sheet.getCell(rowNumber, col).border = {
      top: { style: "thin", color: { argb: "FF4472C4" } },
      bottom: { style: "thin", color: { argb: "FF4472C4" } },
      left: { style: "thin", color: { argb: "FFD9E2F3" } },
      right: { style: "thin", color: { argb: "FFD9E2F3" } },
    };
  }
}

function addAlternatingRowStyle(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
  columnCount: number
) {
  for (let r = startRow; r <= endRow; r++) {
    const isEven = (r - startRow) % 2 === 0;
    for (let c = 1; c <= columnCount; c++) {
      const cell = sheet.getCell(r, c);
      if (isEven) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD9E2F3" },
        };
      }
      cell.border = {
        bottom: { style: "hair", color: { argb: "FFBDD0EB" } },
        left: { style: "hair", color: { argb: "FFBDD0EB" } },
        right: { style: "hair", color: { argb: "FFBDD0EB" } },
      };
    }
  }
}

/* ─── main extraction via Python ─── */

async function extractTablesFromPdf(fileBuffer: Buffer): Promise<ExtractResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdf-doctor-excel-"));
  const pdfPath = path.join(tmpDir, "input.pdf");
  const outputDir = path.join(tmpDir, "output");

  try {
    await fs.writeFile(pdfPath, fileBuffer);
    await fs.mkdir(outputDir, { recursive: true });

    const { stdout } = await execFileAsync(
      "python",
      [EXTRACT_SCRIPT, pdfPath, outputDir],
      { timeout: 180_000, maxBuffer: 50 * 1024 * 1024 }
    );

    // PyMuPDF may emit warnings to stdout; find the last JSON line
    const lines = stdout.trim().split("\n");
    let jsonLine = "";
    for (let i = lines.length - 1; i >= 0; i--) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith("{")) {
        jsonLine = trimmed;
        break;
      }
    }
    if (!jsonLine) throw new Error("No JSON output from table extraction script");

    const meta = JSON.parse(jsonLine);
    if (meta.error) throw new Error(meta.error);

    const jsonData = fsSync.readFileSync(meta.outputPath, "utf-8");
    return JSON.parse(jsonData) as ExtractResult;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

/* ─── text fallback for PDFs with no tables ─── */

function textToRows(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.includes("\t")) return line.split("\t").map((c) => c.trim());
      return [line];
    });
}

/* ─── main export ─── */

export async function pdfToExcel(fileBuffer: Buffer): Promise<Buffer> {
  try {
    const extracted = await extractTablesFromPdf(fileBuffer);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "PDF Doctor";
    workbook.created = new Date();

    if (extracted.mergedTables.length > 0) {
      for (let tIdx = 0; tIdx < extracted.mergedTables.length; tIdx++) {
        const table = extracted.mergedTables[tIdx];
        if (table.row_count === 0) continue;

        const sheetName =
          extracted.mergedTables.length === 1
            ? "Table 1"
            : `Table ${tIdx + 1}`;
        const sheet = workbook.addWorksheet(sheetName);

        const colTypes = detectColumnTypes(table);

        for (let rowIdx = 0; rowIdx < table.rows.length; rowIdx++) {
          const rowData = table.rows[rowIdx];
          const excelRow = sheet.getRow(rowIdx + 1);

          for (let colIdx = 0; colIdx < rowData.length; colIdx++) {
            const cell = excelRow.getCell(colIdx + 1);
            const raw = rowData[colIdx] ?? "";
            const colType = colTypes.get(colIdx) ?? "text";

            if (rowIdx === 0) {
              cell.value = raw;
              continue;
            }

            if (!raw) {
              cell.value = "";
              continue;
            }

            switch (colType) {
              case "date": {
                const date = parseDate(raw);
                if (date) {
                  cell.value = date;
                  cell.numFmt = "YYYY-MM-DD";
                } else {
                  cell.value = raw;
                }
                break;
              }
              case "currency": {
                const num = parseNumeric(raw);
                if (num !== null) {
                  cell.value = num;
                  cell.numFmt = "$#,##0";
                } else {
                  cell.value = raw;
                }
                break;
              }
              case "percent": {
                const num = parseNumeric(raw);
                if (num !== null) {
                  cell.value = num;
                  cell.numFmt = "0%";
                } else {
                  cell.value = raw;
                }
                break;
              }
              case "number": {
                const num = parseNumeric(raw);
                if (num !== null) {
                  cell.value = num;
                  cell.numFmt = Number.isInteger(num) ? "#,##0" : "#,##0.00";
                } else {
                  cell.value = raw;
                }
                break;
              }
              default:
                cell.value = raw;
                cell.alignment = { vertical: "top", wrapText: raw.length > 40 };
            }
          }
        }

        styleHeaderRow(sheet, 1, table.col_count);
        if (table.row_count > 2) {
          addAlternatingRowStyle(sheet, 2, table.row_count, table.col_count);
        }
        sheet.views = [{ state: "frozen", ySplit: 1 }];
        autoFitColumns(sheet);
        sheet.autoFilter = {
          from: { row: 1, column: 1 },
          to: { row: 1, column: table.col_count },
        };
      }
    } else {
      const sheet = workbook.addWorksheet("Extracted Content");
      const allText = extracted.pagesText.join("\n");
      const rows = textToRows(allText);

      if (rows.length > 0) {
        const maxCols = rows.reduce((max, r) => Math.max(max, r.length), 1);
        for (const row of rows) {
          while (row.length < maxCols) row.push("");
          sheet.addRow(row);
        }
        autoFitColumns(sheet);
      } else {
        sheet.addRow(["No extractable text found in this PDF."]);
      }
    }

    if (workbook.worksheets.length === 0) {
      const sheet = workbook.addWorksheet("Extracted Content");
      sheet.addRow(["No extractable content found in this PDF."]);
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
