import fs from "fs/promises";
import { logError } from "@/lib/db/queries";
import {
  isConvertApiAvailable,
  pdfToWordConvertApi,
} from "@/lib/services/pdf-to-word-convertapi.service";
import {
  isDocxConversionAcceptable,
  postProcessDocx,
} from "@/lib/services/pdf-to-word-docx-post.service";
import {
  isLibreOfficePdfToDocxAvailable,
  pdfToWordLibreOffice,
} from "@/lib/services/pdf-to-word-libreoffice.service";
import {
  isPdf2docxAvailable,
  pdfToWordPdf2docx,
} from "@/lib/services/pdf-to-word-pdf2docx.service";
import { pdfToWordNode } from "@/lib/services/pdf-to-word-node.service";
import { pdfToWordVisual } from "@/lib/services/pdf-to-word-visual.service";
import { pdfToWordWordCom, isWordComPdfImportAvailable } from "@/lib/services/pdf-to-word-word-com.service";

export type PdfToWordEngine =
  | "convertapi"
  | "word-com"
  | "libreoffice"
  | "pdf2docx"
  | "visual"
  | "node";

let pdf2docxReadyCache: boolean | null = null;

function estimateTimeoutMs(byteLength: number): number {
  const sizeMb = byteLength / (1024 * 1024);
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

type PdfToWordOptions = {
  fileName?: string;
  onProgress?: (percent: number) => void;
  inputPath?: string;
  outputPath?: string;
  pdfPassword?: string;
  buffer?: Buffer;
};

type QualityHints = {
  pageCount?: number;
  pdfTextChars?: number;
};

async function finalizeDocxResult(
  engine: PdfToWordEngine,
  raw: Buffer | undefined,
  options: {
    diskOnly: boolean;
    outputPath?: string;
    hints: QualityHints;
  }
): Promise<PdfToWordResult | null> {
  const docx = raw;
  if (!docx?.length) return null;
  if (!(await isDocxConversionAcceptable(docx, options.hints))) {
    console.warn(`[pdf-to-word] ${engine} output failed quality check`);
    return null;
  }

  const processed = await postProcessDocx(docx);
  if (options.diskOnly && options.outputPath) {
    await fs.writeFile(options.outputPath, processed);
    return { outputPath: options.outputPath, engine };
  }
  return { buffer: processed, engine };
}

async function finalizeDiskPathResult(
  engine: PdfToWordEngine,
  outputPath: string,
  hints: QualityHints
): Promise<PdfToWordResult | null> {
  const docx = await fs.readFile(outputPath);
  return finalizeDocxResult(engine, docx, {
    diskOnly: true,
    outputPath,
    hints,
  });
}

async function estimatePdfHints(
  inputPath?: string,
  buffer?: Buffer
): Promise<QualityHints> {
  try {
    const { PDFParse } = await import("pdf-parse");
    const data = inputPath ? await fs.readFile(inputPath) : buffer;
    if (!data?.length) return {};
    const parser = new PDFParse({ data });
    try {
      const info = await parser.getInfo();
      const text = await parser.getText();
      return {
        pageCount: info.total || undefined,
        pdfTextChars: text.text?.replace(/\s+/g, " ").trim().length,
      };
    } finally {
      await parser.destroy();
    }
  } catch {
    return {};
  }
}

/**
 * PDF → Word with engine priority (professional-grade quality):
 * 1. ConvertAPI (commercial, if CONVERTAPI_SECRET set)
 * 2. LibreOffice headless (cross-platform, invoice-grade layout)
 * 3. pdf2docx (Python — fast server fallback)
 * 4. Microsoft Word COM (Windows — optional boost when PDF import works)
 * 5. Visual page render (exact layout, non-editable text)
 * 6. Node text extractor (last resort, small PDFs only)
 */
export async function pdfToWord(options: PdfToWordOptions): Promise<PdfToWordResult> {
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
  const officeTimeoutMs = Math.min(timeoutMs, 120_000);
  const wordComTimeoutMs = Math.min(officeTimeoutMs, 45_000);

  if (pdf2docxReadyCache === null) {
    pdf2docxReadyCache = await isPdf2docxAvailable();
  }
  const pdf2docxReady = pdf2docxReadyCache;
  const libreOfficeReady = isLibreOfficePdfToDocxAvailable();

  async function loadBuffer(): Promise<Buffer> {
    if (options.buffer?.length) return options.buffer;
    if (options.inputPath) return fs.readFile(options.inputPath);
    throw new Error("PDF input is required");
  }

  const hints = await estimatePdfHints(options.inputPath, options.buffer);

  async function tryConvertApi(): Promise<PdfToWordResult | null> {
    if (!isConvertApiAvailable()) return null;
    try {
      onProgress?.(5);
      const buffer = await loadBuffer();
      const apiBuffer = await pdfToWordConvertApi(buffer, fileName);
      onProgress?.(95);
      return finalizeDocxResult("convertapi", apiBuffer, { diskOnly, outputPath: options.outputPath, hints });
    } catch (err) {
      console.warn("[pdf-to-word] ConvertAPI failed:", err);
      return null;
    }
  }

  async function tryWordCom(): Promise<PdfToWordResult | null> {
    if (!(await isWordComPdfImportAvailable())) return null;
    try {
      onProgress?.(8);
      const buffer = options.inputPath ? Buffer.alloc(0) : await loadBuffer();
      const result = await pdfToWordWordCom(buffer, {
        inputPath: options.inputPath,
        outputPath: options.outputPath,
        timeoutMs: wordComTimeoutMs,
      });
      onProgress?.(92);
      if (diskOnly && options.outputPath) {
        return finalizeDiskPathResult("word-com", options.outputPath, hints);
      }
      return finalizeDocxResult("word-com", result as Buffer | undefined, {
        diskOnly,
        outputPath: options.outputPath,
        hints,
      });
    } catch (err) {
      console.warn("[pdf-to-word] Word COM failed:", err);
      return null;
    }
  }

  async function tryLibreOffice(): Promise<PdfToWordResult | null> {
    if (!libreOfficeReady) return null;
    try {
      onProgress?.(10);
      const buffer = options.inputPath ? Buffer.alloc(0) : await loadBuffer();
      const result = await pdfToWordLibreOffice(buffer, {
        inputPath: options.inputPath,
        outputPath: options.outputPath,
        timeoutMs: officeTimeoutMs,
      });
      onProgress?.(92);
      if (diskOnly && options.outputPath) {
        return finalizeDiskPathResult("libreoffice", options.outputPath, hints);
      }
      return finalizeDocxResult("libreoffice", result as Buffer | undefined, {
        diskOnly,
        outputPath: options.outputPath,
        hints,
      });
    } catch (err) {
      console.warn("[pdf-to-word] LibreOffice failed:", err);
      return null;
    }
  }

  async function tryPdf2docx(): Promise<PdfToWordResult | null> {
    if (!pdf2docxReady) return null;
    try {
      onProgress?.(12);
      const buffer = options.inputPath ? Buffer.alloc(0) : await loadBuffer();
      const result = await pdfToWordPdf2docx(buffer, {
        timeoutMs,
        onProgress,
        inputPath: options.inputPath,
        outputPath: options.outputPath,
        pdfPassword: options.pdfPassword,
      });
      onProgress?.(92);
      if (diskOnly && options.outputPath) {
        return finalizeDiskPathResult("pdf2docx", options.outputPath, hints);
      }
      return finalizeDocxResult("pdf2docx", result as Buffer | undefined, {
        diskOnly,
        outputPath: options.outputPath,
        hints,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn("[pdf-to-word] pdf2docx failed:", message);
      await logError({
        tool_name: "pdf-to-word",
        error_type: "PDF2DOCX_FAILED",
        error_message: message,
        stack_trace: err instanceof Error ? err.stack : undefined,
      }).catch(() => {});
      return null;
    }
  }

  async function tryVisual(): Promise<PdfToWordResult | null> {
    if (largePdf) return null;
    try {
      onProgress?.(15);
      console.warn("[pdf-to-word] Using visual page render fallback");
      const buffer = await loadBuffer();
      const visualBuffer = await pdfToWordVisual(buffer);
      onProgress?.(95);
      if (diskOnly && options.outputPath) {
        await fs.writeFile(options.outputPath, visualBuffer);
        return { outputPath: options.outputPath, engine: "visual" };
      }
      return { buffer: visualBuffer, engine: "visual" };
    } catch (err) {
      console.warn("[pdf-to-word] Visual fallback failed:", err);
      return null;
    }
  }

  async function tryNode(): Promise<PdfToWordResult | null> {
    if (largePdf) return null;
    try {
      console.warn("[pdf-to-word] Using basic Node text extractor (last resort)");
      const buffer = await loadBuffer();
      const nodeBuffer = await pdfToWordNode(buffer);
      onProgress?.(95);
      if (diskOnly && options.outputPath) {
        await fs.writeFile(options.outputPath, nodeBuffer);
        return { outputPath: options.outputPath, engine: "node" };
      }
      return { buffer: nodeBuffer, engine: "node" };
    } catch (err) {
      console.warn("[pdf-to-word] Node extractor failed:", err);
      return null;
    }
  }

  const engines = [tryConvertApi, tryLibreOffice, tryPdf2docx, tryWordCom, tryVisual, tryNode];

  for (const attempt of engines) {
    const result = await attempt();
    if (result) {
      onProgress?.(99);
      return result;
    }
  }

  await logError({
    tool_name: "pdf-to-word",
    error_type: "PDF_TO_WORD_FAILED",
    error_message: "All conversion engines failed",
  }).catch(() => {});

  if (largePdf) {
    throw new Error(
      "Conversion failed for this large PDF. Install LibreOffice or pdf2docx on the server, or set CONVERTAPI_SECRET."
    );
  }

  throw new Error(
    "Failed to convert PDF to Word. On Windows install Microsoft Word; on servers install LibreOffice or run scripts/setup-pdf2docx.ps1."
  );
}
