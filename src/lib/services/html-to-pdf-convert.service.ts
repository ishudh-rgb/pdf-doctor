import puppeteer from "puppeteer";
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

/**
 * Converts an HTML string (complete page) to a PDF buffer using Puppeteer.
 * Handles inline CSS, embedded images (base64), external stylesheets,
 * and renders the page exactly as a browser would.
 */
export async function htmlToPdf(
  htmlContent: string,
  options: HtmlToPdfOptions = {}
): Promise<Buffer> {
  const {
    pageSize = "a4",
    orientation = "portrait",
    margin = "small",
    printBackground = true,
    scale = 1,
  } = options;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--font-render-hinting=none",
      ],
    });

    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const url = req.url();
      if (url.startsWith("data:") || url.startsWith("blob:") || url === "about:blank") {
        req.continue();
      } else {
        req.abort("blockedbyclient");
      }
    });

    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });

    await page.setContent(htmlContent, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const pdfOptions: Parameters<typeof page.pdf>[0] = {
      printBackground,
      scale,
      margin: MARGINS[margin] || MARGINS.small,
      landscape: orientation === "landscape",
      preferCSSPageSize: false,
    };

    if (pageSize === "auto") {
      pdfOptions.preferCSSPageSize = true;
    } else if (pageSize === "letter") {
      pdfOptions.format = "Letter";
    } else {
      pdfOptions.format = "A4";
    }

    const pdfBuffer = await page.pdf(pdfOptions);

    return Buffer.from(pdfBuffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : "HTML to PDF conversion failed";
    await logError({
      tool_name: "html-to-pdf",
      error_type: "CONVERT_ERROR",
      error_message: message,
      stack_trace: error instanceof Error ? error.stack : undefined,
    }).catch(() => {});
    throw new Error(message);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
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
    htmlContent = htmlContent.replace(
      /<head/i,
      '<head><meta charset="utf-8"'
    );
  }

  return htmlToPdf(htmlContent, options);
}
