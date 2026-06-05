import { PDFDocument } from "pdf-lib";
import { safePdfLoad } from "@/lib/pdf/pdf-safe-load";
import { logError } from "@/lib/db/queries";

/**
 * Delete pages from a PDF. Accepts a 1-based array of page numbers to KEEP.
 * Returns a new PDF containing only those pages in order.
 */
export async function deletePdfPages(
  fileBuffer: Buffer,
  pagesToKeep: number[]
): Promise<Buffer> {
  try {
    const srcDoc = await safePdfLoad(fileBuffer, "delete-pdf");
    const totalPages = srcDoc.getPageCount();

    if (pagesToKeep.length === 0) {
      throw new Error("Cannot delete all pages — at least one page must remain.");
    }

    for (const p of pagesToKeep) {
      if (p < 1 || p > totalPages) {
        throw new Error(`Page ${p} does not exist. Document has ${totalPages} pages.`);
      }
    }

    const destDoc = await PDFDocument.create();
    const indices = pagesToKeep.map((p) => p - 1);
    const copiedPages = await destDoc.copyPages(srcDoc, indices);

    for (const page of copiedPages) {
      destDoc.addPage(page);
    }

    const pdfBytes = await destDoc.save();
    return Buffer.from(pdfBytes);
  } catch (err) {
    await logError({
      tool_name: "delete-pdf",
      error_type: "DELETE_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
    throw new Error(
      `Failed to delete PDF pages: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}
