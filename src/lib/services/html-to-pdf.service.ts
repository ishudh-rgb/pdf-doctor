import puppeteer from "puppeteer";

export function buildHtmlDocument(body: string, title = "Document"): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 16mm 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: Calibri, "Segoe UI", Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #111827;
      margin: 0;
      padding: 0;
    }
    h1, h2, h3 { margin: 0.8em 0 0.4em; page-break-after: avoid; }
    h1 { font-size: 18pt; }
    h2 { font-size: 14pt; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.25em; }
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
<body>${body}</body>
</html>`;
}

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdfBytes = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "16mm", right: "14mm", bottom: "16mm", left: "14mm" },
    });
    return Buffer.from(pdfBytes);
  } finally {
    await browser.close();
  }
}

export async function renderPresentationToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.setContent(html, { waitUntil: "load" });
    const pdfBytes = await page.pdf({
      width: "10in",
      height: "5.625in",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    return Buffer.from(pdfBytes);
  } finally {
    await browser.close();
  }
}
