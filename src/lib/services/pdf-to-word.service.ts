import { logError } from "@/lib/db/queries";
import {
  isConvertApiAvailable,
  pdfToWordConvertApi,
} from "@/lib/services/pdf-to-word-convertapi.service";
import {
  isPdf2docxAvailable,
  pdfToWordPdf2docx,
} from "@/lib/services/pdf-to-word-pdf2docx.service";
import { pdfToWordNode } from "@/lib/services/pdf-to-word-node.service";

export type PdfToWordEngine = "convertapi" | "pdf2docx" | "node";

function estimateTimeoutMs(fileBuffer: Buffer): number {
  const sizeMb = fileBuffer.length / (1024 * 1024);
  return Math.min(900_000, 90_000 + Math.ceil(sizeMb) * 20_000);
}

/**
 * PDF → Word with engine priority:
 * 1. ConvertAPI (commercial Smallpdf-class, if CONVERTAPI_SECRET set)
 * 2. pdf2docx raw layout + Smallpdf transform (tables/images preserved)
 * 3. Node extractor (fallback only)
 */
export async function pdfToWord(
  fileBuffer: Buffer,
  options: { fileName?: string } = {}
): Promise<{ buffer: Buffer; engine: PdfToWordEngine }> {
  const fileName = options.fileName ?? "document.pdf";
  const timeoutMs = estimateTimeoutMs(fileBuffer);
  const pdf2docxReady = await isPdf2docxAvailable();

  if (isConvertApiAvailable()) {
    try {
      const buffer = await pdfToWordConvertApi(fileBuffer, fileName);
      return { buffer, engine: "convertapi" };
    } catch (err) {
      console.warn("[pdf-to-word] ConvertAPI failed, trying pdf2docx:", err);
    }
  }

  if (pdf2docxReady) {
    try {
      const buffer = await pdfToWordPdf2docx(fileBuffer, { timeoutMs });
      return { buffer, engine: "pdf2docx" };
    } catch (err) {
      console.warn("[pdf-to-word] pdf2docx failed, falling back to Node extractor:", err instanceof Error ? err.message : err);
      await logError({
        tool_name: "pdf-to-word",
        error_type: "PDF2DOCX_FAILED",
        error_message: err instanceof Error ? err.message : String(err),
        stack_trace: err instanceof Error ? err.stack : undefined,
      });
    }
  }

  try {
    console.warn("[pdf-to-word] pdf2docx unavailable — using basic Node extractor");
    const buffer = await pdfToWordNode(fileBuffer);
    return { buffer, engine: "node" };
  } catch (err) {
    await logError({
      tool_name: "pdf-to-word",
      error_type: "PDF_TO_WORD_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
    throw new Error(
      `Failed to convert PDF to Word. Install pdf2docx for best quality: run scripts/setup-pdf2docx.ps1 (${
        err instanceof Error ? err.message : "Unknown error"
      })`
    );
  }
}
