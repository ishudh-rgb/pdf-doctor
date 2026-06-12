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

let pdf2docxReadyCache: boolean | null = null;

function estimateTimeoutMs(fileBuffer: Buffer): number {
  const sizeMb = fileBuffer.length / (1024 * 1024);
  return Math.min(900_000, 120_000 + Math.ceil(sizeMb) * 45_000);
}

/**
 * PDF → Word with engine priority:
 * 1. ConvertAPI (commercial Smallpdf-class, if CONVERTAPI_SECRET set)
 * 2. pdf2docx raw layout + Smallpdf transform (tables/images preserved)
 * 3. Node extractor (fallback only)
 */
export async function pdfToWord(
  fileBuffer: Buffer,
  options: {
    fileName?: string;
    onProgress?: (percent: number) => void;
  } = {}
): Promise<{ buffer: Buffer; engine: PdfToWordEngine }> {
  const fileName = options.fileName ?? "document.pdf";
  const onProgress = options.onProgress;
  const timeoutMs = estimateTimeoutMs(fileBuffer);
  if (pdf2docxReadyCache === null) {
    pdf2docxReadyCache = await isPdf2docxAvailable();
  }
  const pdf2docxReady = pdf2docxReadyCache;

  if (isConvertApiAvailable()) {
    try {
      onProgress?.(5);
      const buffer = await pdfToWordConvertApi(fileBuffer, fileName);
      onProgress?.(99);
      return { buffer, engine: "convertapi" };
    } catch (err) {
      console.warn("[pdf-to-word] ConvertAPI failed, trying pdf2docx:", err);
    }
  }

  if (pdf2docxReady) {
    try {
      const buffer = await pdfToWordPdf2docx(fileBuffer, { timeoutMs, onProgress });
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
