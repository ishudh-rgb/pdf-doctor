import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import { pathToFileURL } from "url";
import { PDFDocument } from "pdf-lib";
import puppeteer, { type Page } from "puppeteer";
import { logError } from "@/lib/db/queries";

interface HtmlToPdfOptions {
  pageSize?: "a4" | "letter" | "auto";
  orientation?: "portrait" | "landscape";
  margin?: "none" | "small" | "medium";
  printBackground?: boolean;
  scale?: number;
}

const MARGINS: Record<string, { top: string; right: string; bottom: string; left: string }> = {
  none: { top: "0", right: "0", bottom: "0", left: "0" },
  small: { top: "0.4in", right: "0.4in", bottom: "0.4in", left: "0.4in" },
  medium: { top: "0.75in", right: "0.75in", bottom: "0.75in", left: "0.75in" },
};

const RENDER_TIMEOUT_MS = 180_000;
/** Above this size Chromium often fails printToPDF — render in chunks instead. */
const CHUNKED_THRESHOLD_BYTES = 1_000_000;
/** Max body characters per Puppeteer pass (keeps memory stable). */
const BODY_CHUNK_CHARS = 400_000;
/** Prefer temp file over setContent for heavy HTML strings. */
const TEMP_FILE_THRESHOLD_CHARS = 600_000;

const BROWSER_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--font-render-hinting=none",
  "--disable-extensions",
  "--disable-background-networking",
  "--js-flags=--max-old-space-size=4096",
];

/** Parallel chunk renders — same output, faster on multi-core hosts. */
const CHUNK_RENDER_CONCURRENCY = 2;

const BREAK_MARKERS = [
  "</section>",
  "</table>",
  "</article>",
  "</div>",
  "</p>",
  "<hr",
  "<h1",
  "<h2",
  "<h3",
];

interface HtmlParts {
  preamble: string;
  head: string;
  bodyOpen: string;
  bodyContent: string;
  bodyClose: string;
}

function isPrintFailure(message: string): boolean {
  return /printtopdf|printing failed|protocol error/i.test(message);
}

function friendlyError(raw: string): string {
  if (/timeout/i.test(raw)) {
    return "Conversion timed out. Very large HTML files can take 3–5 minutes — please try again or use a smaller file.";
  }
  if (isPrintFailure(raw)) {
    return "Could not render this HTML to PDF. The file may be too large or complex — try splitting it into smaller HTML files.";
  }
  return raw;
}

function extractHtmlParts(html: string): HtmlParts {
  const preamble = html.match(/<!DOCTYPE[^>]*>/i)?.[0] ?? "<!DOCTYPE html>";
  const head = html.match(/<head[^>]*>[\s\S]*?<\/head>/i)?.[0] ?? '<head><meta charset="utf-8"></head>';
  const bodyMatch = html.match(/<body([^>]*)>([\s\S]*)<\/body>/i);

  if (!bodyMatch) {
    return {
      preamble,
      head,
      bodyOpen: "<body>",
      bodyContent: html,
      bodyClose: "</body>",
    };
  }

  return {
    preamble,
    head,
    bodyOpen: `<body${bodyMatch[1]}>`,
    bodyContent: bodyMatch[2],
    bodyClose: "</body>",
  };
}

function wrapHtml(parts: HtmlParts, bodyChunk: string): string {
  return `${parts.preamble}<html lang="en">${parts.head}${parts.bodyOpen}${bodyChunk}${parts.bodyClose}</html>`;
}

function chunkBodyContent(body: string, maxChars: number): string[] {
  if (body.length <= maxChars) return [body];

  const chunks: string[] = [];
  let start = 0;

  while (start < body.length) {
    let end = Math.min(start + maxChars, body.length);
    if (end < body.length) {
      const searchFrom = start + Math.floor(maxChars * 0.65);
      let best = -1;
      for (const marker of BREAK_MARKERS) {
        const idx = body.lastIndexOf(marker, end);
        if (idx >= searchFrom && idx + marker.length > best) {
          best = idx + marker.length;
        }
      }
      if (best > start) end = best;
    }
    chunks.push(body.slice(start, end));
    start = end;
  }

  return chunks;
}

async function loadHtmlInPage(page: Page, html: string): Promise<void> {
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const url = req.url();
    if (
      url.startsWith("data:") ||
      url.startsWith("blob:") ||
      url === "about:blank" ||
      url.startsWith("file:")
    ) {
      req.continue();
    } else {
      req.abort("blockedbyclient");
    }
  });

  if (html.length >= TEMP_FILE_THRESHOLD_CHARS) {
    const tmpPath = join(tmpdir(), `o4pdf-${randomUUID()}.html`);
    await writeFile(tmpPath, html, "utf-8");
    try {
      await page.goto(pathToFileURL(tmpPath).href, {
        waitUntil: "domcontentloaded",
        timeout: RENDER_TIMEOUT_MS,
      });
    } finally {
      await unlink(tmpPath).catch(() => {});
    }
  } else {
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: RENDER_TIMEOUT_MS,
    });
  }

  await page.emulateMediaType("print");
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
}

function buildPdfOptions(
  options: HtmlToPdfOptions,
  isLarge: boolean
): Parameters<Page["pdf"]>[0] {
  const {
    pageSize = "a4",
    orientation = "portrait",
    margin = "small",
    printBackground = true,
    scale = 1,
  } = options;

  const pdfOptions: Parameters<Page["pdf"]>[0] = {
    printBackground: isLarge ? false : printBackground,
    scale: isLarge ? Math.min(scale, 0.92) : scale,
    margin: MARGINS[margin] || MARGINS.small,
    landscape: orientation === "landscape",
    preferCSSPageSize: false,
    timeout: RENDER_TIMEOUT_MS,
    tagged: false,
  };

  if (pageSize === "auto") {
    pdfOptions.preferCSSPageSize = true;
  } else if (pageSize === "letter") {
    pdfOptions.format = "Letter";
  } else {
    pdfOptions.format = "A4";
  }

  return pdfOptions;
}

async function renderPageToPdf(
  page: Page,
  html: string,
  options: HtmlToPdfOptions,
  isLarge: boolean
): Promise<Buffer> {
  page.setDefaultTimeout(RENDER_TIMEOUT_MS);
  await page.setViewport({
    width: 1280,
    height: 900,
    deviceScaleFactor: isLarge ? 1 : 2,
  });
  await loadHtmlInPage(page, html);
  const pdfBytes = await page.pdf(buildPdfOptions(options, isLarge));
  return Buffer.from(pdfBytes);
}

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: BROWSER_ARGS,
  });
}

async function mergePdfBuffers(buffers: Buffer[]): Promise<Buffer> {
  if (buffers.length === 0) {
    throw new Error("No PDF output generated.");
  }
  if (buffers.length === 1) return buffers[0];

  const merged = await PDFDocument.create();
  for (const buf of buffers) {
    const doc = await PDFDocument.load(buf);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    for (const page of pages) merged.addPage(page);
  }
  return Buffer.from(await merged.save());
}

async function renderSinglePass(
  htmlContent: string,
  options: HtmlToPdfOptions,
  forceLarge = false
): Promise<Buffer> {
  const isLarge = forceLarge || htmlContent.length >= CHUNKED_THRESHOLD_BYTES;
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    try {
      return await renderPageToPdf(page, htmlContent, options, isLarge);
    } finally {
      await page.close().catch(() => {});
    }
  } finally {
    await browser.close().catch(() => {});
  }
}

async function renderChunked(
  htmlContent: string,
  options: HtmlToPdfOptions
): Promise<Buffer> {
  const parts = extractHtmlParts(htmlContent);
  const bodyChunks = chunkBodyContent(parts.bodyContent, BODY_CHUNK_CHARS);
  const browser = await launchBrowser();

  try {
    const buffers: Buffer[] = new Array(bodyChunks.length);
    let nextIndex = 0;

    async function worker() {
      while (true) {
        const index = nextIndex++;
        if (index >= bodyChunks.length) break;

        const chunkHtml = wrapHtml(parts, bodyChunks[index]);
        const page = await browser.newPage();
        try {
          buffers[index] = await renderPageToPdf(
            page,
            chunkHtml,
            options,
            chunkHtml.length >= CHUNKED_THRESHOLD_BYTES
          );
        } finally {
          await page.close().catch(() => {});
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(CHUNK_RENDER_CONCURRENCY, bodyChunks.length) }, () =>
        worker()
      )
    );

    return mergePdfBuffers(buffers);
  } finally {
    await browser.close().catch(() => {});
  }
}

/**
 * Converts an HTML string (complete page) to a PDF buffer using Puppeteer.
 * Large documents are split into chunks, rendered separately, then merged.
 */
export async function htmlToPdf(
  htmlContent: string,
  options: HtmlToPdfOptions = {}
): Promise<Buffer> {
  try {
    const useChunked = htmlContent.length >= CHUNKED_THRESHOLD_BYTES;

    if (useChunked) {
      return await renderChunked(htmlContent, options);
    }

    try {
      return await renderSinglePass(htmlContent, options);
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error);
      if (!isPrintFailure(raw)) throw error;
      return await renderChunked(htmlContent, options);
    }
  } catch (error) {
    const raw = error instanceof Error ? error.message : "HTML to PDF conversion failed";
    const message = friendlyError(raw);
    await logError({
      tool_name: "html-to-pdf",
      error_type: "CONVERT_ERROR",
      error_message: message,
      stack_trace: error instanceof Error ? error.stack : undefined,
    }).catch(() => {});
    throw new Error(message);
  }
}

/**
 * Converts an HTML file buffer to PDF.
 * Detects charset from meta tags or defaults to UTF-8.
 */
export async function htmlFileToPdf(
  fileBuffer: Buffer,
  fileName: string,
  options: HtmlToPdfOptions = {}
): Promise<Buffer> {
  let htmlContent = fileBuffer.toString("utf-8");

  if (!htmlContent.includes("<html") && !htmlContent.includes("<HTML")) {
    htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${htmlContent}</body></html>`;
  }

  if (!htmlContent.includes("charset")) {
    htmlContent = htmlContent.replace(/<head/i, '<head><meta charset="utf-8"');
  }

  return htmlToPdf(htmlContent, options);
}
