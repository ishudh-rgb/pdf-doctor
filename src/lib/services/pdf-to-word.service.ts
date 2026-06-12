import fs from "fs/promises";
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

function estimateTimeoutMs(byteLength: number): number {
  const sizeMb = byteLength / (1024 * 1024);
  // Large PDFs (8000+ pages) need 15–25 min for chunked conversion.
  return Math.min(1_800_000, Math.max(900_000, 120_000 + Math.ceil(sizeMb) * 120_000));
}

export function mapPdfToWordError(message: string): string {
  if (message === "PASSWORD_REQUIRED" || message.includes("PASSWORD_REQUIRED")) {
    return "PASSWORD_REQUIRED";
  }
  if (message === "WRONG_PASSWORD" || /incorrect password/i.test(message)) {
    return "WRONG_PASSWORD";
  }
  if (/document closed or encrypted/i.test(message)) {
    return "This PDF is locked. Use Unlock PDF first, or enter the correct password.";
  }
  return message.replace(/^ERROR PASSWORD_REQUIRED\s*/i, "").replace(/^ERROR\s*/i, "").trim();
}

export type PdfToWordResult = {
  buffer?: Buffer;
  outputPath?: string;
  engine: PdfToWordEngine;
};

/**
 * PDF → Word with engine priority:
 * 1. ConvertAPI (commercial Smallpdf-class, if CONVERTAPI_SECRET set)
 * 2. pdf2docx raw layout + Smallpdf transform (tables/images preserved)
 * 3. Node extractor (fallback only)
 *
 * Pass outputPath to keep the DOCX on disk and avoid loading it into Node heap.
 */
export async function pdfToWord(
  options: {
    fileName?: string;
    onProgress?: (percent: number) => void;
    inputPath?: string;
    outputPath?: string;
    pdfPassword?: string;
    /** In-memory PDF; omit when inputPath is set (job mode). */
    buffer?: Buffer;
  }
): Promise<PdfToWordResult> {
  const fileName = options.fileName ?? "document.pdf";
  const onProgress = options.onProgress;
  const diskOnly = Boolean(options.outputPath);

  let byteLength = options.buffer?.length ?? 0;
  if (options.inputPath) {
    const stat = await fs.stat(options.inputPath);
    byteLength = stat.size;
  }
  if (byteLength === 0) {
    throw new Error("PDF input is empty");
  }

  const timeoutMs = estimateTimeoutMs(byteLength);
  const largePdf = byteLength > 8 * 1024 * 1024;
  if (pdf2docxReadyCache === null) {
    pdf2docxReadyCache = await isPdf2docxAvailable();
  }
  const pdf2docxReady = pdf2docxReadyCache;

  async function loadBuffer(): Promise<Buffer> {
    if (options.buffer?.length) return options.buffer;
    if (options.inputPath) return fs.readFile(options.inputPath);
    throw new Error("PDF input is required");
  }

  if (isConvertApiAvailable()) {
    try {
      onProgress?.(5);
      const buffer = await loadBuffer();
      const apiBuffer = await pdfToWordConvertApi(buffer, fileName);
      onProgress?.(99);
      if (diskOnly && options.outputPath) {
        await fs.writeFile(options.outputPath, apiBuffer);
        return { outputPath: options.outputPath, engine: "convertapi" };
      }
      return { buffer: apiBuffer, engine: "convertapi" };
    } catch (err) {
      console.warn("[pdf-to-word] ConvertAPI failed, trying pdf2docx:", err);
    }
  }

  if (pdf2docxReady) {
    try {
      const buffer = options.inputPath ? Buffer.alloc(0) : await loadBuffer();
      const result = await pdfToWordPdf2docx(buffer, {
        timeoutMs,
        onProgress,
        inputPath: options.inputPath,
        outputPath: options.outputPath,
        pdfPassword: options.pdfPassword,
      });
      if (diskOnly && options.outputPath) {
        return { outputPath: options.outputPath, engine: "pdf2docx" };
      }
      return { buffer: result as Buffer, engine: "pdf2docx" };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn("[pdf-to-word] pdf2docx failed:", message);
      await logError({
        tool_name: "pdf-to-word",
        error_type: "PDF2DOCX_FAILED",
        error_message: message,
        stack_trace: err instanceof Error ? err.stack : undefined,
      });
      if (largePdf || diskOnly) {
        throw new Error(
          message.includes("invalid DOCX")
            ? "Conversion failed for this large PDF. Try splitting it into smaller parts first."
            : message.replace(/^PROGRESS pct=\d+\s*/g, "").trim() ||
                "Conversion failed. Try splitting the PDF into smaller parts."
        );
      }
    }
  }

  if (largePdf) {
    throw new Error(
      "This PDF is too large for the basic converter. Install pdf2docx: run scripts/setup-pdf2docx.ps1"
    );
  }

  try {
    console.warn("[pdf-to-word] pdf2docx unavailable — using basic Node extractor");
    const buffer = await loadBuffer();
    const nodeBuffer = await pdfToWordNode(buffer);
    if (diskOnly && options.outputPath) {
      await fs.writeFile(options.outputPath, nodeBuffer);
      return { outputPath: options.outputPath, engine: "node" };
    }
    return { buffer: nodeBuffer, engine: "node" };
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
