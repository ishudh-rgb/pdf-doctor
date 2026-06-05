import { getPuppeteerBrowser } from "@/lib/services/puppeteer-browser.server";

export interface HtmlPdfOptions {
  landscape?: boolean;
  /** Tighter font/padding for wide spreadsheets (many columns). */
  compact?: boolean;
  bodyClass?: string;
  /** Puppeteer PDF scale (0.1–2). Used to fit very wide tables on one page width. */
  scale?: number;
}

export function buildHtmlDocument(
  body: string,
  title = "Document",
  options: HtmlPdfOptions = {}
): string {
  const pageSize = options.landscape ? "A4 landscape" : "A4";
  const pageMargin = options.landscape ? "5mm 6mm" : "16mm 14mm";
  const baseFont = options.compact ? "7.5pt" : "10pt";
  const cellPad = options.compact ? "2px 4px" : "6px 8px";
  const bodyClass = options.bodyClass ?? "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { size: ${pageSize}; margin: ${pageMargin}; }
    * { box-sizing: border-box; }
    body {
      font-family: Calibri, "Segoe UI", Arial, sans-serif;
      font-size: ${baseFont};
      line-height: 1.25;
      color: #111827;
      margin: 0;
      padding: 0;
    }
    body.excel-export table {
      width: max-content;
      max-width: 100%;
      border-collapse: collapse;
      margin: 0.5em 0 1em;
      table-layout: auto;
      page-break-inside: auto;
    }
    body.excel-export td,
    body.excel-export th {
      border: 1px solid #cbd5e1;
      padding: ${cellPad};
      vertical-align: middle;
      text-align: left;
      white-space: nowrap;
    }
    body.excel-export section.excel-sheet {
      page-break-after: always;
      page-break-inside: avoid;
    }
    body.excel-export section.excel-sheet:last-child {
      page-break-after: auto;
    }
    body.excel-landscape-fit {
      overflow: hidden;
    }
    body.excel-landscape-fit section.excel-sheet {
      width: 100%;
      overflow: hidden;
    }
    body.excel-landscape-fit table {
      width: max-content;
      min-width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
    }
    body.excel-landscape-fit td,
    body.excel-landscape-fit th {
      font-size: 5.5pt;
      padding: 0 1px;
      line-height: 1.05;
      white-space: nowrap;
      vertical-align: middle;
    }
    body.excel-landscape-fit th {
      background: #f3f4f6;
      font-weight: 600;
      text-align: center;
    }
    h1, h2, h3 { margin: 0.8em 0 0.4em; page-break-after: avoid; }
    h1 { font-size: 18pt; }
    h2 { font-size: ${options.compact ? "11pt" : "14pt"}; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.25em; }
    p { margin: 0.35em 0; }
    table { width: 100%; border-collapse: collapse; margin: 0.75em 0 1em; page-break-inside: avoid; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: top; text-align: left; }
    th { background: #f3f4f6; font-weight: 600; }
    tr:nth-child(even) td { background: #fafafa; }
    .slide {
      page-break-after: always;
      min-height: 240mm;
      padding: 12mm 0;
    }
    .slide:last-child { page-break-after: auto; }
    .slide-title { font-size: 22pt; font-weight: 700; margin-bottom: 0.5em; color: #1e3a8a; }
    .slide-body { white-space: pre-wrap; font-size: 12pt; }
  </style>
</head>
<body class="${bodyClass}">${body}</body>
</html>`;
}

export async function renderHtmlToPdf(
  html: string,
  options: HtmlPdfOptions = {}
): Promise<Buffer> {
  const browser = await getPuppeteerBrowser();
  const margin = options.landscape
    ? { top: "5mm", right: "5mm", bottom: "5mm", left: "5mm" }
    : { top: "16mm", right: "14mm", bottom: "16mm", left: "14mm" };

  const page = await browser.newPage();
  try {
    await page.emulateMediaType("print");
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 90_000 });
    const pdfBytes = await page.pdf({
      format: "A4",
      landscape: Boolean(options.landscape),
      printBackground: true,
      preferCSSPageSize: true,
      margin,
      scale: options.scale ?? (options.compact ? 0.92 : 1),
      timeout: 90_000,
    });
    return Buffer.from(pdfBytes);
  } finally {
    await page.close().catch(() => {});
  }
}

export async function renderSlideImagesToPdf(slideImages: Buffer[]): Promise<Buffer> {
  const { PDFDocument } = await import("pdf-lib");
  const sharp = (await import("sharp")).default;
  const pdfDoc = await PDFDocument.create();

  const A4_LANDSCAPE_W = 841.89;
  const A4_LANDSCAPE_H = 595.28;

  for (const imgBuffer of slideImages) {
    const jpegBuffer = await sharp(imgBuffer)
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();

    const jpegImage = await pdfDoc.embedJpg(jpegBuffer);

    const imgAspect = jpegImage.width / jpegImage.height;
    const pageAspect = A4_LANDSCAPE_W / A4_LANDSCAPE_H;

    let drawW: number, drawH: number, drawX: number, drawY: number;

    if (imgAspect > pageAspect) {
      drawW = A4_LANDSCAPE_W;
      drawH = A4_LANDSCAPE_W / imgAspect;
      drawX = 0;
      drawY = (A4_LANDSCAPE_H - drawH) / 2;
    } else {
      drawH = A4_LANDSCAPE_H;
      drawW = A4_LANDSCAPE_H * imgAspect;
      drawX = (A4_LANDSCAPE_W - drawW) / 2;
      drawY = 0;
    }

    const page = pdfDoc.addPage([A4_LANDSCAPE_W, A4_LANDSCAPE_H]);
    page.drawImage(jpegImage, {
      x: drawX,
      y: drawY,
      width: drawW,
      height: drawH,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function renderPresentationToPdf(html: string): Promise<Buffer> {
  const browser = await getPuppeteerBrowser();
  const page = await browser.newPage();

  try {
    await page.emulateMediaType("print");
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 90_000 });
    const pdfBytes = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0.55in", right: "0.55in", bottom: "0.55in", left: "0.55in" },
      scale: 1,
      timeout: 90_000,
    });
    return Buffer.from(pdfBytes);
  } finally {
    await page.close().catch(() => {});
  }
}
