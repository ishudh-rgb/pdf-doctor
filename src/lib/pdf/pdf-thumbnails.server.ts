import { createCanvas } from "@napi-rs/canvas";
import { PDFParse } from "pdf-parse";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { getPdfjsAssetDirs } from "@/lib/pdf/pdfjs-paths";

const THUMBNAIL_SCALE = 0.52;
const THUMBNAIL_WIDTH = 300;
const MAX_RENDER_WIDTH = 1200;
const JPEG_QUALITY = 82;

type PdfDoc = Awaited<ReturnType<typeof loadPdfDocument>>;

function pdfDocumentOptions(data: Uint8Array, password?: string) {
  const { standardFontDataUrl, cMapUrl } = getPdfjsAssetDirs();
  return {
    data,
    password,
    verbosity: pdfjs.VerbosityLevel.ERRORS,
    standardFontDataUrl,
    cMapUrl,
    cMapPacked: true,
    useSystemFonts: true,
  };
}

export async function loadPdfDocument(buffer: Buffer, password?: string) {
  const data = new Uint8Array(buffer);
  try {
    return await pdfjs.getDocument(pdfDocumentOptions(data, password)).promise;
  } catch (first) {
    console.warn("[pdf-thumbnails] load retry disableFontFace:", first);
    return pdfjs.getDocument({
      ...pdfDocumentOptions(data, password),
      disableFontFace: true,
    }).promise;
  }
}

async function renderPageWithPdfJs(doc: PdfDoc, pageNum: number): Promise<string> {
  const page = await doc.getPage(pageNum);
  try {
    const viewport = page.getViewport({ scale: THUMBNAIL_SCALE });
    const width = Math.max(1, Math.ceil(viewport.width));
    const height = Math.max(1, Math.ceil(viewport.height));
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const jpeg = await canvas.encode("jpeg", JPEG_QUALITY);
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } finally {
    page.cleanup();
  }
}

/** Primary renderer — same engine as compress-pdf, works on most real-world PDFs. */
export async function renderPageThumb(
  buffer: Buffer,
  pageNum: number,
  desiredWidth = THUMBNAIL_WIDTH
): Promise<string> {
  const width = Math.min(Math.max(40, desiredWidth), MAX_RENDER_WIDTH);
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getScreenshot({
      partial: [pageNum],
      desiredWidth: width,
      imageDataUrl: true,
      imageBuffer: false,
    });

    const page = result.pages.find((p) => p.pageNumber === pageNum);
    if (page?.dataUrl) return page.dataUrl;
  } catch (err) {
    console.warn(`[pdf-thumbnails] pdf-parse page ${pageNum}:`, err);
  } finally {
    await parser.destroy();
  }

  const doc = await loadPdfDocument(buffer);
  try {
    return await renderPageWithPdfJs(doc, pageNum);
  } finally {
    await doc.destroy();
  }
}

export async function renderPdfThumbnailsServer(
  buffer: Buffer,
  options: { startPage?: number; endPage?: number; maxPages?: number } = {}
): Promise<{
  thumbnails: string[];
  totalPages: number;
  truncated: boolean;
  startPage: number;
  endPage: number;
}> {
  const totalPages = await getTotalPages(buffer);
  const maxPages = options.maxPages ?? 500;
  const cappedTotal = Math.min(totalPages, maxPages);

  const startPage = Math.max(1, options.startPage ?? 1);
  const endPage = Math.min(cappedTotal, options.endPage ?? cappedTotal);

  if (startPage > endPage || totalPages === 0) {
    return {
      thumbnails: [],
      totalPages,
      truncated: totalPages > maxPages,
      startPage,
      endPage,
    };
  }

  const pageNums = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  const parser = new PDFParse({ data: buffer });
  let thumbnails: string[] = [];

  try {
    const result = await parser.getScreenshot({
      partial: pageNums,
      desiredWidth: THUMBNAIL_WIDTH,
      imageDataUrl: true,
      imageBuffer: false,
    });

    const byPage = new Map(result.pages.map((p) => [p.pageNumber, p.dataUrl]));
    thumbnails = pageNums.map((n) => byPage.get(n) ?? "");
  } catch (err) {
    console.warn("[pdf-thumbnails] batch pdf-parse failed:", err);
    thumbnails = pageNums.map(() => "");
  } finally {
    await parser.destroy();
  }

  if (!thumbnails.some(Boolean)) {
    const doc = await loadPdfDocument(buffer);
    try {
      thumbnails = [];
      for (const pageNum of pageNums) {
        try {
          thumbnails.push(await renderPageWithPdfJs(doc, pageNum));
        } catch (err) {
          console.error(`[pdf-thumbnails] pdfjs page ${pageNum}:`, err);
          thumbnails.push("");
        }
      }
    } finally {
      await doc.destroy();
    }
  }

  return {
    thumbnails,
    totalPages,
    truncated: totalPages > maxPages,
    startPage,
    endPage,
  };
}

export async function getTotalPages(buffer: Buffer, password?: string): Promise<number> {
  const parser = new PDFParse({ data: buffer, password });
  try {
    const info = await parser.getInfo();
    if (info.total > 0) return info.total;
  } catch {
    /* fallback */
  } finally {
    await parser.destroy();
  }

  const doc = await loadPdfDocument(buffer, password);
  try {
    return doc.numPages;
  } finally {
    await doc.destroy();
  }
}
