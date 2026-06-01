import { createCanvas } from "@napi-rs/canvas";
import { PDFParse } from "pdf-parse";
import {
  Document,
  ImageRun,
  Packer,
  Paragraph,
} from "docx";
import { loadPdfDocument } from "@/lib/pdf/pdf-thumbnails.server";

const PT_TO_TWIP = 20;
/** High-res render width — keeps text sharp in Word */
const RENDER_WIDTH_PX = 1800;

export interface RenderedPdfPage {
  pageNumber: number;
  png: Buffer;
  widthPt: number;
  heightPt: number;
  renderWidthPx: number;
  renderHeightPx: number;
}

function pointsToTwip(pt: number): number {
  return Math.round(pt * PT_TO_TWIP);
}

async function renderPageWithCanvas(
  buffer: Buffer,
  pageNumber: number
): Promise<RenderedPdfPage | null> {
  const doc = await loadPdfDocument(buffer);
  try {
    const page = await doc.getPage(pageNumber);
    try {
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = RENDER_WIDTH_PX / baseViewport.width;
      const viewport = page.getViewport({ scale });

      const width = Math.max(1, Math.ceil(viewport.width));
      const height = Math.max(1, Math.ceil(viewport.height));
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      await page.render({
        canvasContext: ctx as unknown as CanvasRenderingContext2D,
        viewport,
        canvas: canvas as unknown as HTMLCanvasElement,
      }).promise;
      const png = await canvas.encode("png");

      return {
        pageNumber,
        png,
        widthPt: baseViewport.width,
        heightPt: baseViewport.height,
        renderWidthPx: width,
        renderHeightPx: height,
      };
    } finally {
      page.cleanup();
    }
  } finally {
    await doc.destroy();
  }
}

async function getPageDimensions(
  buffer: Buffer,
  pageNumbers: number[]
): Promise<Map<number, { widthPt: number; heightPt: number }>> {
  const map = new Map<number, { widthPt: number; heightPt: number }>();
  const doc = await loadPdfDocument(buffer);
  try {
    for (const pageNumber of pageNumbers) {
      const page = await doc.getPage(pageNumber);
      try {
        const vp = page.getViewport({ scale: 1 });
        map.set(pageNumber, { widthPt: vp.width, heightPt: vp.height });
      } finally {
        page.cleanup();
      }
    }
  } finally {
    await doc.destroy();
  }
  return map;
}

async function renderAllPages(buffer: Buffer): Promise<RenderedPdfPage[]> {
  const parser = new PDFParse({ data: buffer });
  const pages: RenderedPdfPage[] = [];

  try {
    const info = await parser.getInfo();
    const totalPages = info.total;
    if (totalPages <= 0) return pages;

    try {
      const result = await parser.getScreenshot({
        desiredWidth: RENDER_WIDTH_PX,
        imageBuffer: true,
        imageDataUrl: false,
      });

      if (result.pages.length > 0) {
        const pageNumbers = result.pages.map((p) => p.pageNumber);
        const dimensions = await getPageDimensions(buffer, pageNumbers);

        for (const shot of result.pages) {
          if (!shot.data?.length) continue;
          const dim = dimensions.get(shot.pageNumber) ?? { widthPt: 612, heightPt: 792 };

          pages.push({
            pageNumber: shot.pageNumber,
            png: Buffer.from(shot.data),
            widthPt: dim.widthPt,
            heightPt: dim.heightPt,
            renderWidthPx: shot.width,
            renderHeightPx: shot.height,
          });
        }

        if (pages.length > 0) {
          pages.sort((a, b) => a.pageNumber - b.pageNumber);
          return pages;
        }
      }
    } catch (err) {
      console.warn("[pdf-to-word-visual] pdf-parse screenshot failed:", err);
    }

    for (let pageNum = 1; pageNum <= totalPages; pageNum += 1) {
      const rendered = await renderPageWithCanvas(buffer, pageNum);
      if (rendered) pages.push(rendered);
    }

    return pages;
  } finally {
    await parser.destroy();
  }
}

function pageImageParagraph(page: RenderedPdfPage): Paragraph {
  return new Paragraph({
    spacing: { before: 0, after: 0, line: 0 },
    children: [
      new ImageRun({
        type: "png",
        data: page.png,
        transformation: {
          width: Math.round(page.widthPt),
          height: Math.round(page.heightPt),
        },
      }),
    ],
  });
}

export async function pdfToWordVisual(fileBuffer: Buffer): Promise<Buffer> {
  const pages = await renderAllPages(fileBuffer);

  if (pages.length === 0) {
    throw new Error("No pages could be rendered from this PDF.");
  }

  const sections = pages.map((page, index) => ({
    properties: {
      page: {
        size: {
          width: pointsToTwip(page.widthPt),
          height: pointsToTwip(page.heightPt),
        },
        margin: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          header: 0,
          footer: 0,
          gutter: 0,
        },
      },
      ...(index > 0 ? { pageBreakBefore: true as const } : {}),
    },
    children: [pageImageParagraph(page)],
  }));

  const doc = new Document({ sections });
  return Packer.toBuffer(doc);
}
