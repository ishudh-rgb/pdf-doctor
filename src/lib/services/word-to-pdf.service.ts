import mammoth from "mammoth";
import puppeteer from "puppeteer";
import { logError } from "@/lib/db/queries";

const STYLE_MAP = [
  "p[style-name='Title'] => h1.doc-title:fresh",
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  "p[style-name='Heading 4'] => h4:fresh",
  "p[style-name='Subtitle'] => p.subtitle:fresh",
  "r[style-name='Strong'] => strong",
  "r[style-name='Emphasis'] => em",
];

function buildHtmlDocument(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>
    @page {
      size: A4;
      margin: 20mm 18mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: Calibri, "Segoe UI", Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #111827;
      margin: 0;
      padding: 0;
    }

    h1, h2, h3, h4 {
      margin: 1em 0 0.45em;
      line-height: 1.25;
      page-break-after: avoid;
    }

    h1.doc-title {
      font-size: 20pt;
      text-align: center;
      margin-top: 0;
    }

    p {
      margin: 0.35em 0;
      orphans: 3;
      widows: 3;
    }

    p.subtitle {
      text-align: center;
      color: #4b5563;
    }

    ul, ol {
      margin: 0.35em 0 0.75em;
      padding-left: 1.35em;
    }

    li {
      margin: 0.2em 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.85em 0 1.1em;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      vertical-align: top;
      text-align: left;
    }

    th {
      background: #f3f4f6;
      font-weight: 600;
    }

    tr:nth-child(even) td {
      background: #fafafa;
    }

    strong, b {
      font-weight: 700;
    }

    img {
      max-width: 100%;
      height: auto;
      page-break-inside: avoid;
    }

    a {
      color: #1d4ed8;
      text-decoration: underline;
      word-break: break-word;
    }
  </style>
</head>
<body>${body}</body>
</html>`;
}

async function convertDocxToHtml(fileBuffer: Buffer): Promise<string> {
  const result = await mammoth.convertToHtml(
    { buffer: fileBuffer },
    {
      styleMap: STYLE_MAP,
      includeDefaultStyleMap: true,
      convertImage: mammoth.images.imgElement((image) =>
        image.read("base64").then((imageBuffer) => ({
          src: `data:${image.contentType};base64,${imageBuffer}`,
        }))
      ),
    }
  );

  if (result.messages.length > 0) {
    console.info(
      "word-to-pdf mammoth messages:",
      result.messages.map((m) => m.message).join("; ")
    );
  }

  return result.value;
}

async function renderHtmlToPdf(html: string): Promise<Buffer> {
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
      margin: {
        top: "20mm",
        right: "18mm",
        bottom: "20mm",
        left: "18mm",
      },
    });
    return Buffer.from(pdfBytes);
  } finally {
    await browser.close();
  }
}

export async function wordToPdf(fileBuffer: Buffer): Promise<Buffer> {
  try {
    const htmlBody = await convertDocxToHtml(fileBuffer);
    const html = buildHtmlDocument(htmlBody);
    return await renderHtmlToPdf(html);
  } catch (err) {
    await logError({
      tool_name: "word-to-pdf",
      error_type: "WORD_TO_PDF_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
    throw new Error(
      `Failed to convert Word to PDF: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}
