import { PDFDocument } from "pdf-lib";
import { safePdfLoad } from "@/lib/pdf/pdf-safe-load";
import { logError } from "@/lib/db/queries";

export async function mergePDFs(fileBuffers: Buffer[]): Promise<Buffer> {
  if (fileBuffers.length === 0) {
    throw new Error("At least one PDF file is required to merge.");
  }

  if (fileBuffers.length === 1) {
    return fileBuffers[0];
  }

  try {
    const mergedPdf = await PDFDocument.create();

    for (const buffer of fileBuffers) {
      const pdf = await safePdfLoad(buffer, "merge-pdf");
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      for (const page of pages) {
        mergedPdf.addPage(page);
      }
    }

    const mergedBytes = await mergedPdf.save();
    return Buffer.from(mergedBytes);
  } catch (err) {
    await logError({
      tool_name: "merge-pdf",
      error_type: "MERGE_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
    throw new Error(
      `Failed to merge PDFs: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}
