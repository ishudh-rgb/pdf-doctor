import PptxGenJS from "pptxgenjs";
import { PDFParse } from "pdf-parse";
import { logError } from "@/lib/db/queries";
import {
  detectAmountColumns,
  extractPdfTables,
  isHeaderRow,
  isLikelyAmount,
  type ExtractedPageContent,
} from "@/lib/services/pdf-table-extract.service";

const SLIDE_W = 10;
const TABLE_X = 0.35;
const TABLE_W = 9.3;
const ROWS_PER_SLIDE = 9;

interface PdfImage {
  data: Uint8Array;
  dataUrl: string;
  width: number;
  height: number;
}

interface PdfImagePage {
  pageNumber: number;
  images: PdfImage[];
}

interface PdfScreenshot extends PdfImage {
  pageNumber: number;
}

type PptxSlide = ReturnType<PptxGenJS["addSlide"]>;
type TableRow = Parameters<PptxSlide["addTable"]>[0];

function chunkTable(table: string[][], maxDataRows = ROWS_PER_SLIDE): string[][][] {
  if (table.length <= 1) return [table];

  const header = table[0];
  const dataRows = table.slice(1).filter((row) => !isHeaderRow(row));
  if (dataRows.length === 0) return [table];

  const chunks: string[][][] = [];
  for (let i = 0; i < dataRows.length; i += maxDataRows) {
    chunks.push([header, ...dataRows.slice(i, i + maxDataRows)]);
  }
  return chunks;
}

function columnWidths(columnCount: number): number[] {
  if (columnCount === 6) {
    return [0.55, 1.25, 3.35, 1.15, 1.15, 1.15];
  }
  if (columnCount === 5) {
    return [0.6, 1.4, 3.5, 1.4, 1.4];
  }
  const width = TABLE_W / columnCount;
  return Array.from({ length: columnCount }, () => width);
}

function toPptTableRows(table: string[][]): TableRow {
  const amountColumns = detectAmountColumns(table[0] ?? []);

  return table.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      const isHeader = rowIndex === 0;
      const isAmount = !isHeader && amountColumns.includes(colIndex) && isLikelyAmount(cell);

      return {
        text: cell?.trim() || " ",
        options: {
          bold: isHeader,
          fontSize: isHeader ? 11 : 10,
          color: isHeader ? "1E293B" : "111827",
          fill: isHeader ? { color: "E2E8F0" } : undefined,
          align: isHeader ? "center" : isAmount ? "right" : colIndex === 0 ? "center" : "left",
          valign: "middle",
          margin: [0.04, 0.06, 0.04, 0.06],
        },
      };
    })
  );
}

function fitBox(
  widthPx: number,
  heightPx: number,
  maxW: number,
  maxH: number
): { w: number; h: number } {
  if (widthPx <= 0 || heightPx <= 0) {
    return { w: maxW, h: maxH };
  }

  const aspect = widthPx / heightPx;
  let w = maxW;
  let h = w / aspect;

  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }

  return { w, h };
}

function imageDataUri(image: PdfImage): string {
  if (image.dataUrl?.startsWith("data:")) {
    return image.dataUrl;
  }
  return `data:image/png;base64,${Buffer.from(image.data).toString("base64")}`;
}

function isSignificantImage(image: PdfImage): boolean {
  return image.width >= 40 && image.height >= 40;
}

function addSlideTitle(slide: PptxSlide, title: string, subtitle?: string) {
  slide.addText(title, {
    x: 0.4,
    y: 0.15,
    w: 9.2,
    h: 0.45,
    fontSize: 20,
    bold: true,
    color: "1E3A8A",
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.4,
      y: 0.58,
      w: 9.2,
      h: 0.3,
      fontSize: 12,
      color: "64748B",
    });
  }
}

function addTableSlide(
  pptx: PptxGenJS,
  title: string,
  subtitle: string | undefined,
  table: string[][],
  images: PdfImage[]
) {
  const chunks = chunkTable(table);
  const colW = columnWidths(table[0]?.length ?? 1);
  const tableStartY = subtitle ? 1.05 : 0.85;
  const logoCandidates = images.filter(isSignificantImage).slice(0, 1);

  chunks.forEach((chunk, chunkIndex) => {
    const slide = pptx.addSlide();
    const chunkTitle =
      chunks.length > 1 ? `${title}${chunkIndex > 0 ? ` (Part ${chunkIndex + 1})` : ""}` : title;

    addSlideTitle(slide, chunkTitle, chunkIndex === 0 ? subtitle : undefined);

    if (chunkIndex === 0 && logoCandidates.length > 0) {
      const logo = logoCandidates[0];
      const size = fitBox(logo.width, logo.height, 1.2, 0.7);
      slide.addImage({
        data: imageDataUri(logo),
        x: SLIDE_W - size.w - 0.25,
        y: 0.12,
        w: size.w,
        h: size.h,
      });
    }

    slide.addTable(toPptTableRows(chunk), {
      x: TABLE_X,
      y: tableStartY,
      w: TABLE_W,
      colW,
      border: { type: "solid", color: "CBD5E1", pt: 0.75 },
      autoPage: false,
    });
  });
}

function addScreenshotSlide(pptx: PptxGenJS, title: string, screenshot: PdfScreenshot) {
  const slide = pptx.addSlide();
  addSlideTitle(slide, title);

  const size = fitBox(screenshot.width, screenshot.height, 9.2, 4.35);
  slide.addImage({
    data: imageDataUri(screenshot),
    x: (SLIDE_W - size.w) / 2,
    y: 1.0,
    w: size.w,
    h: size.h,
  });
}

function addImageGallerySlide(pptx: PptxGenJS, title: string, images: PdfImage[]) {
  const slide = pptx.addSlide();
  addSlideTitle(slide, title);

  const significant = images.filter(isSignificantImage);
  const count = Math.min(significant.length, 2);
  const slotW = count === 1 ? 8 : 4.2;

  significant.slice(0, count).forEach((image, index) => {
    const size = fitBox(image.width, image.height, slotW, 3.8);
    slide.addImage({
      data: imageDataUri(image),
      x: count === 1 ? (SLIDE_W - size.w) / 2 : 0.45 + index * 4.85,
      y: 1.15,
      w: size.w,
      h: size.h,
    });
  });
}

function addTextSlide(pptx: PptxGenJS, title: string, lines: string[]) {
  const slide = pptx.addSlide();
  addSlideTitle(slide, title);

  slide.addText(
    lines.map((line) => ({ text: line, options: { breakLine: true, bullet: true } })),
    {
      x: 0.6,
      y: 1.1,
      w: 8.8,
      h: 4.2,
      fontSize: 14,
      color: "111827",
    }
  );
}

async function extractEmbeddedImages(fileBuffer: Buffer): Promise<PdfImagePage[]> {
  const parser = new PDFParse({ data: fileBuffer });
  try {
    const result = await parser.getImage({
      imageDataUrl: true,
      imageBuffer: true,
      imageThreshold: 40,
    });
    return result.pages;
  } finally {
    await parser.destroy();
  }
}

async function extractScreenshots(fileBuffer: Buffer): Promise<PdfScreenshot[]> {
  const parser = new PDFParse({ data: fileBuffer });
  try {
    const result = await parser.getScreenshot({
      scale: 1.5,
      imageDataUrl: true,
      imageBuffer: true,
    });
    return result.pages;
  } finally {
    await parser.destroy();
  }
}

function buildPageTitle(page: ExtractedPageContent, infoLines: string[]): string {
  const dedupedInfo = infoLines.filter(Boolean);
  if (page.pageNum === 1 && dedupedInfo.length > 0) {
    return dedupedInfo[0];
  }
  return `Page ${page.pageNum}`;
}

function buildPageSubtitle(page: ExtractedPageContent, infoLines: string[]): string | undefined {
  const parts = [...infoLines, ...page.infoLines].filter(Boolean);
  const unique = parts.filter((line, index) => parts.indexOf(line) === index);
  if (page.pageNum === 1 && unique.length > 1) {
    return unique.slice(1).join(" • ");
  }
  if (page.pageNum > 1 && page.infoLines.length > 0) {
    return page.infoLines.join(" • ");
  }
  return undefined;
}

function buildSlidesFromPages(
  pptx: PptxGenJS,
  pages: ExtractedPageContent[],
  infoLines: string[],
  imagePages: PdfImagePage[],
  screenshots: PdfScreenshot[]
) {
  let slideCount = 0;

  pages.forEach((page) => {
    const pageImages = imagePages.find((entry) => entry.pageNumber === page.pageNum)?.images ?? [];
    const screenshot = screenshots.find((entry) => entry.pageNumber === page.pageNum);
    const title = buildPageTitle(page, infoLines);
    const subtitle = buildPageSubtitle(page, infoLines);
    if (page.table && page.table.length > 1) {
      addTableSlide(pptx, title, subtitle, page.table, pageImages);
      slideCount += chunkTable(page.table).length;
      return;
    }

    const textLines = page.infoLines.filter(Boolean);
    if (textLines.length > 0) {
      addTextSlide(pptx, title, textLines);
      slideCount += 1;
    }

    if (pageImages.some(isSignificantImage)) {
      addImageGallerySlide(pptx, `${title} — Images`, pageImages);
      slideCount += 1;
    } else if (screenshot) {
      addScreenshotSlide(pptx, title, screenshot);
      slideCount += 1;
    }
  });

  return slideCount;
}

export async function pdfToPpt(fileBuffer: Buffer): Promise<Buffer> {
  try {
    const [extracted, imagePages, screenshots] = await Promise.all([
      extractPdfTables(fileBuffer),
      extractEmbeddedImages(fileBuffer),
      extractScreenshots(fileBuffer),
    ]);

    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_16x9";
    pptx.author = "PDF Doctor";
    pptx.title = extracted.infoLines[0] || "PDF Export";

    let slideCount = buildSlidesFromPages(
      pptx,
      extracted.pages,
      extracted.infoLines,
      imagePages,
      screenshots
    );

    if (slideCount === 0 && extracted.primaryTable && extracted.primaryTable.length > 1) {
      addTableSlide(
        pptx,
        extracted.infoLines[0] || "Statement",
        extracted.infoLines.slice(1).join(" • ") || undefined,
        extracted.primaryTable,
        imagePages.flatMap((page) => page.images)
      );
      slideCount = chunkTable(extracted.primaryTable).length;
    }

    if (slideCount === 0) {
      const slide = pptx.addSlide();
      slide.addText("No extractable content found in this PDF.", {
        x: 0.5,
        y: 1.2,
        w: 9,
        h: 1,
        fontSize: 20,
        color: "333333",
      });
    }

    const output = await pptx.write({ outputType: "nodebuffer" });
    return Buffer.from(output as ArrayBuffer);
  } catch (err) {
    await logError({
      tool_name: "pdf-to-ppt",
      error_type: "PDF_TO_PPT_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
    throw new Error(
      `Failed to convert PDF to PowerPoint: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}
