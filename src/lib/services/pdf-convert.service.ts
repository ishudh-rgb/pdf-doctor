import { PDFDocument, PageSizes } from "pdf-lib";
import sharp from "sharp";
import { logError } from "@/lib/db/queries";
import { wordToPdf } from "@/lib/services/word-to-pdf.service";
import { pdfToWord } from "@/lib/services/pdf-to-word.service";

export { wordToPdf, pdfToWord };

// ---------------------------------------------------------------------------
// Word → PDF is implemented in word-to-pdf.service.ts (HTML layout preserved)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// JPG/Images → PDF
// ---------------------------------------------------------------------------

interface JpgToPdfOptions {
  pageSize?: string;
  orientation?: "portrait" | "landscape";
  margin?: string;
}

const PAGE_SIZE_MAP: Record<string, [number, number]> = {
  a4: PageSizes.A4 as unknown as [number, number],
  letter: PageSizes.Letter as unknown as [number, number],
  legal: PageSizes.Legal as unknown as [number, number],
};

const MARGIN_MAP: Record<string, number> = {
  none: 0,
  small: 20,
  normal: 40,
  medium: 40,
  large: 60,
};

export async function jpgToPdf(
  imageBuffers: Buffer[],
  options: JpgToPdfOptions = {}
): Promise<Buffer> {
  if (imageBuffers.length === 0) {
    throw new Error("At least one image is required.");
  }

  try {
    const pdfDoc = await PDFDocument.create();
    const pageSizeKey = (options.pageSize ?? "a4").toLowerCase();
    let [pageWDefault, pageHDefault] = PAGE_SIZE_MAP[pageSizeKey] ?? PageSizes.A4;

    if (options.orientation === "landscape") {
      [pageWDefault, pageHDefault] = [pageHDefault, pageWDefault];
    }

    const margin = MARGIN_MAP[options.margin ?? "normal"] ?? 40;

    for (const imgBuf of imageBuffers) {
      const metadata = await sharp(imgBuf).metadata();
      const format = metadata.format;

      let pageW = pageWDefault;
      let pageH = pageHDefault;
      if (pageSizeKey === "auto" && metadata.width && metadata.height) {
        pageW = metadata.width;
        pageH = metadata.height;
        if (options.orientation === "landscape" && pageW < pageH) {
          [pageW, pageH] = [pageH, pageW];
        }
      }

      // Convert to PNG if not JPEG/PNG (pdf-lib only embeds jpg/png natively)
      let processedBuf = imgBuf;
      if (format !== "jpeg" && format !== "png") {
        processedBuf = await sharp(imgBuf).png().toBuffer();
      }

      const image =
        format === "jpeg"
          ? await pdfDoc.embedJpg(processedBuf)
          : await pdfDoc.embedPng(processedBuf);

      const availW = pageW - margin * 2;
      const availH = pageH - margin * 2;
      const scale = Math.min(
        availW / image.width,
        availH / image.height,
        1
      );
      const drawW = image.width * scale;
      const drawH = image.height * scale;

      const page = pdfDoc.addPage([pageW, pageH]);
      page.drawImage(image, {
        x: margin + (availW - drawW) / 2,
        y: margin + (availH - drawH) / 2,
        width: drawW,
        height: drawH,
      });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (err) {
    await logError({
      tool_name: "jpg-to-pdf",
      error_type: "JPG_TO_PDF_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
    throw new Error(
      `Failed to convert images to PDF: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}

