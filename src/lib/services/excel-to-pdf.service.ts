import ExcelJS from "exceljs";
import { logError } from "@/lib/db/queries";
import { buildHtmlDocument, renderHtmlToPdf } from "@/lib/services/html-to-pdf.service";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sheetToHtml(sheet: ExcelJS.Worksheet): string {
  const rows: string[] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const cells = (row.values as ExcelJS.CellValue[])
      .slice(1)
      .map((value) => {
        if (value === null || value === undefined) return "";
        if (typeof value === "object" && "text" in (value as object)) {
          return escapeHtml(String((value as { text: string }).text));
        }
        if (value instanceof Date) return escapeHtml(value.toLocaleString());
        return escapeHtml(String(value));
      });
    if (cells.some(Boolean)) {
      rows.push(`<tr>${cells.map((c) => `<td>${c || "&nbsp;"}</td>`).join("")}</tr>`);
    }
  });

  if (rows.length === 0) {
    return "<p><em>Empty sheet</em></p>";
  }

  return `<table>${rows.join("")}</table>`;
}

export async function excelToPdf(fileBuffer: Buffer): Promise<Buffer> {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as never);

    const sections = workbook.worksheets.map(
      (sheet) => `<section><h2>${escapeHtml(sheet.name)}</h2>${sheetToHtml(sheet)}</section>`
    );

    if (sections.length === 0) {
      throw new Error("The Excel file has no worksheets.");
    }

    const html = buildHtmlDocument(sections.join(""), "Excel Export");
    return await renderHtmlToPdf(html);
  } catch (err) {
    await logError({
      tool_name: "excel-to-pdf",
      error_type: "EXCEL_TO_PDF_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
    throw new Error(
      `Failed to convert Excel to PDF: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}
