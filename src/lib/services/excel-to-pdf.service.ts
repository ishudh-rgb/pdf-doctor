import * as XLSX from "xlsx";
import { PDFDocument, PDFName, PDFNull } from "pdf-lib";
import { logError } from "@/lib/db/queries";
import { tryExportWithExcel } from "@/lib/services/excel-com-export.service";
import {
  buildHtmlDocument,
  renderHtmlToPdf,
  type HtmlPdfOptions,
} from "@/lib/services/html-to-pdf.service";
import { tryConvertWithLibreOffice } from "@/lib/services/libreoffice-convert.service";

const MAX_HEADER_SCAN_ROWS = 5;
const ROWS_PER_HTML_CHUNK = 500;

function isBoldCell(sheet: XLSX.WorkSheet, row: number, col: number): boolean {
  const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
  const style = cell?.s as { font?: { bold?: boolean } } | undefined;
  return Boolean(style?.font?.bold);
}

/** Detect header band: consecutive top rows where most non-empty cells are bold. */
function detectHeaderEndRow(sheet: XLSX.WorkSheet, bounds: SheetBounds): number {
  let headerEnd = bounds.startRow;

  for (
    let r = bounds.startRow;
    r <= Math.min(bounds.startRow + MAX_HEADER_SCAN_ROWS - 1, bounds.endRow);
    r++
  ) {
    let nonEmpty = 0;
    let boldCount = 0;

    for (let c = bounds.startCol; c <= bounds.endCol; c++) {
      const text = getCellDisplay(sheet, r, c);
      if (!text) continue;
      nonEmpty++;
      if (isBoldCell(sheet, r, c)) boldCount++;
    }

    if (nonEmpty === 0) break;
    if (boldCount >= Math.ceil(nonEmpty * 0.5)) {
      headerEnd = r;
      continue;
    }
    break;
  }

  return headerEnd;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface SheetBounds {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

interface MergeInfo {
  s: { r: number; c: number };
  e: { r: number; c: number };
}

function trimSheetBounds(sheet: XLSX.WorkSheet): SheetBounds | null {
  if (!sheet["!ref"]) return null;

  const range = XLSX.utils.decode_range(sheet["!ref"]);
  let endRow = range.s.r;
  let endCol = range.s.c;

  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      const value = cell?.v;
      if (value !== undefined && value !== "") {
        endRow = Math.max(endRow, r);
        endCol = Math.max(endCol, c);
      }
    }
  }

  if (endRow < range.s.r || endCol < range.s.c) return null;

  return {
    startRow: range.s.r,
    endRow,
    startCol: range.s.c,
    endCol,
  };
}

function buildMergeLookup(
  merges: MergeInfo[] | undefined,
  bounds: SheetBounds
): {
  anchorMap: Map<string, { rowspan: number; colspan: number }>;
  coveredSet: Set<string>;
} {
  const anchorMap = new Map<string, { rowspan: number; colspan: number }>();
  const coveredSet = new Set<string>();

  for (const merge of merges ?? []) {
    if (
      merge.e.r < bounds.startRow ||
      merge.s.r > bounds.endRow ||
      merge.e.c < bounds.startCol ||
      merge.s.c > bounds.endCol
    ) {
      continue;
    }

    const rowspan = merge.e.r - merge.s.r + 1;
    const colspan = merge.e.c - merge.s.c + 1;
    anchorMap.set(`${merge.s.r},${merge.s.c}`, { rowspan, colspan });

    for (let r = merge.s.r; r <= merge.e.r; r++) {
      for (let c = merge.s.c; c <= merge.e.c; c++) {
        if (r === merge.s.r && c === merge.s.c) continue;
        coveredSet.add(`${r},${c}`);
      }
    }
  }

  return { anchorMap, coveredSet };
}

function getCellDisplay(sheet: XLSX.WorkSheet, row: number, col: number): string {
  const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
  if (!cell) return "";

  if (cell.w) return String(cell.w);
  if (cell.v instanceof Date) return cell.v.toLocaleDateString();
  if (cell.v === undefined || cell.v === null) return "";
  return String(cell.v);
}

function cellInlineStyles(sheet: XLSX.WorkSheet, row: number, col: number): string[] {
  const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
  const style = cell?.s as
    | {
        font?: { bold?: boolean; italic?: boolean; sz?: number; color?: { rgb?: string } };
        fgColor?: { rgb?: string };
        bgColor?: { rgb?: string };
        patternType?: string;
        alignment?: { horizontal?: string; vertical?: string; wrapText?: boolean };
      }
    | undefined;

  const parts: string[] = [];
  if (style?.font?.bold) parts.push("font-weight:700");
  if (style?.font?.italic) parts.push("font-style:italic");
  if (style?.font?.sz) parts.push(`font-size:${Math.max(7, Math.min(style.font.sz, 14))}pt`);
  if (style?.font?.color?.rgb) parts.push(`color:#${style.font.color.rgb.slice(-6)}`);

  const horizontal = style?.alignment?.horizontal;
  if (horizontal === "center" || horizontal === "right" || horizontal === "left") {
    parts.push(`text-align:${horizontal}`);
  } else if (cell?.t === "n" || cell?.v instanceof Date) {
    parts.push("text-align:right");
  }

  const vertical = style?.alignment?.vertical;
  if (vertical === "center" || vertical === "bottom" || vertical === "top") {
    parts.push(`vertical-align:${vertical}`);
  }

  if (style?.alignment?.wrapText) {
    parts.push("white-space:normal", "word-break:break-word");
  }

  if (!style) return parts;

  const fillRgb =
    style.patternType === "solid" && style.fgColor?.rgb
      ? style.fgColor.rgb
      : style.bgColor?.rgb;

  if (fillRgb && fillRgb !== "FFFFFF") {
    parts.push(`background-color:#${fillRgb.slice(-6)}`);
  }

  return parts;
}

function columnWidthStyle(sheet: XLSX.WorkSheet, col: number): string {
  const colInfo = sheet["!cols"]?.[col];
  const width = colInfo?.wch ?? colInfo?.width ?? 10;
  const clamped = Math.max(4, Math.min(width, 36));
  return `min-width:${clamped}ch`;
}

function rowHeightStyle(sheet: XLSX.WorkSheet, row: number): string {
  const rowInfo = sheet["!rows"]?.[row];
  if (!rowInfo?.hpt) return "";
  return `height:${Math.max(12, Math.min(rowInfo.hpt, 48))}pt`;
}

function computeLandscapeScale(columnCount: number): number {
  if (columnCount > 55) return 0.42;
  if (columnCount > 45) return 0.48;
  if (columnCount > 35) return 0.56;
  if (columnCount > 26) return 0.66;
  if (columnCount > 18) return 0.76;
  if (columnCount > 12) return 0.88;
  return 1;
}

function buildRowHtml(
  sheet: XLSX.WorkSheet,
  bounds: SheetBounds,
  row: number,
  tag: "th" | "td",
  anchorMap: Map<string, { rowspan: number; colspan: number }>,
  coveredSet: Set<string>
): string {
  const cells: string[] = [];

  for (let c = bounds.startCol; c <= bounds.endCol; c++) {
    const key = `${row},${c}`;
    if (coveredSet.has(key)) continue;

    const anchor = anchorMap.get(key);
    let colspan = 1;
    let rowspan = 1;

    if (anchor) {
      colspan = anchor.colspan;
      rowspan = anchor.rowspan;
      if (c + colspan - 1 > bounds.endCol) colspan = bounds.endCol - c + 1;
      if (row + rowspan - 1 > bounds.endRow) rowspan = bounds.endRow - row + 1;
    }

    const text = getCellDisplay(sheet, row, c);
    const styleParts = [
      columnWidthStyle(sheet, c),
      ...cellInlineStyles(sheet, row, c),
    ];
    const span =
      (colspan > 1 ? ` colspan="${colspan}"` : "") +
      (rowspan > 1 ? ` rowspan="${rowspan}"` : "");

    cells.push(
      `<${tag}${span} style="${styleParts.join(";")}">${escapeHtml(text) || "&nbsp;"}</${tag}>`
    );

    c += colspan - 1;
  }

  const rowStyle = rowHeightStyle(sheet, row);
  const rowAttr = rowStyle ? ` style="${rowStyle}"` : "";
  return cells.length > 0 ? `<tr${rowAttr}>${cells.join("")}</tr>` : "";
}

function sheetToFullTableHtml(sheet: XLSX.WorkSheet, sheetName?: string): string {
  const bounds = trimSheetBounds(sheet);
  if (!bounds) return "";

  const { anchorMap, coveredSet } = buildMergeLookup(
    sheet["!merges"] as MergeInfo[] | undefined,
    bounds
  );

  const headerEnd = detectHeaderEndRow(sheet, bounds);
  const headerRows: string[] = [];
  for (let r = bounds.startRow; r <= headerEnd; r++) {
    const rowHtml = buildRowHtml(sheet, bounds, r, "th", anchorMap, coveredSet);
    if (rowHtml) headerRows.push(rowHtml);
  }

  const dataStart = headerEnd + 1;
  const chunks: string[] = [];
  const titleHtml = sheetName
    ? `<h2 class="excel-sheet-title">${escapeHtml(sheetName)}</h2>`
    : "";

  for (let chunkStart = dataStart; chunkStart <= bounds.endRow; chunkStart += ROWS_PER_HTML_CHUNK) {
    const chunkEnd = Math.min(chunkStart + ROWS_PER_HTML_CHUNK - 1, bounds.endRow);
    const bodyRows: string[] = [];
    for (let r = chunkStart; r <= chunkEnd; r++) {
      const rowHtml = buildRowHtml(sheet, bounds, r, "td", anchorMap, coveredSet);
      if (rowHtml) bodyRows.push(rowHtml);
    }
    if (bodyRows.length === 0 && chunkStart > dataStart) continue;

    const thead =
      headerRows.length > 0 ? `<thead>${headerRows.join("")}</thead>` : "";
    const tbody = `<tbody>${bodyRows.join("")}</tbody>`;
    chunks.push(
      `<section class="excel-sheet-chunk"><table>${thead}${tbody}</table></section>`
    );
  }

  if (chunks.length === 0 && headerRows.length > 0) {
    chunks.push(
      `<section class="excel-sheet-chunk"><table><thead>${headerRows.join("")}</thead><tbody></tbody></table></section>`
    );
  }

  if (chunks.length === 0) return "";

  return `<section class="excel-sheet">${titleHtml}${chunks.join("")}</section>`;
}

function maxColumnCount(workbook: XLSX.WorkBook): number {
  let max = 0;
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const bounds = trimSheetBounds(sheet);
    if (bounds) {
      max = Math.max(max, bounds.endCol - bounds.startCol + 1);
    }
  }
  return max;
}

function readWorkbookWithSheetJs(fileBuffer: Buffer): XLSX.WorkBook {
  return XLSX.read(fileBuffer, {
    type: "buffer",
    cellDates: true,
    cellStyles: true,
    cellNF: true,
  });
}

/** Open PDF at 100% zoom instead of viewer "fit page" (~63%). */
async function setPdfDefaultZoom100(pdfBuffer: Buffer): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const firstPage = pdfDoc.getPages()[0];

  pdfDoc.catalog.set(
    PDFName.of("OpenAction"),
    pdfDoc.context.obj({
      Type: PDFName.of("Action"),
      S: PDFName.of("GoTo"),
      D: pdfDoc.context.obj([
        firstPage.ref,
        PDFName.of("XYZ"),
        PDFNull,
        PDFNull,
        1,
      ]),
    })
  );

  return Buffer.from(await pdfDoc.save());
}

async function convertSheetJsWorkbook(workbook: XLSX.WorkBook): Promise<Buffer> {
  if (workbook.SheetNames.length === 0) {
    throw new Error("The Excel file has no worksheets.");
  }

  const sections: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const html = sheetToFullTableHtml(sheet, sheetName);
    if (html) sections.push(html);
  }

  if (sections.length === 0) {
    throw new Error("The Excel file has no readable content.");
  }

  const maxColumns = maxColumnCount(workbook);
  const pdfOptions: HtmlPdfOptions = {
    landscape: true,
    compact: true,
    scale: computeLandscapeScale(maxColumns),
    bodyClass: "excel-export excel-landscape-fit",
    printTimeoutMs: 240_000,
  };

  const body = sections.join("\n");
  const documentHtml = buildHtmlDocument(body, "Excel Export", pdfOptions);
  const pdfBuffer = await renderHtmlToPdf(documentHtml, pdfOptions);
  return setPdfDefaultZoom100(pdfBuffer);
}

export function excelWorkbookToHtml(fileBuffer: Buffer): string {
  const workbook = readWorkbookWithSheetJs(fileBuffer);
  if (workbook.SheetNames.length === 0) {
    throw new Error("The Excel file has no worksheets.");
  }

  const sections: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const html = sheetToFullTableHtml(sheet, sheetName);
    if (html) sections.push(html);
  }

  if (sections.length === 0) {
    throw new Error("The Excel file has no readable content.");
  }

  return sections.join("\n");
}

export async function excelToPdf(fileBuffer: Buffer): Promise<Buffer> {
  try {
    if (process.platform === "win32") {
      const excelPdf = await tryExportWithExcel(fileBuffer);
      if (excelPdf && excelPdf.length > 0) {
        return setPdfDefaultZoom100(excelPdf);
      }
    }

    const librePdf = await tryConvertWithLibreOffice(fileBuffer);
    if (librePdf && librePdf.length > 0) {
      return setPdfDefaultZoom100(librePdf);
    }

    return await convertSheetJsWorkbook(readWorkbookWithSheetJs(fileBuffer));
  } catch (err) {
    await logError({
      tool_name: "excel-to-pdf",
      error_type: "EXCEL_TO_PDF_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });

    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.toLowerCase().includes("zip") || message.toLowerCase().includes("central directory")) {
      throw new Error(
        "Failed to convert Excel to PDF: This .xls file could not be read. Try opening it in Excel and saving as .xlsx, then convert again."
      );
    }

    throw new Error(`Failed to convert Excel to PDF: ${message}`);
  }
}
