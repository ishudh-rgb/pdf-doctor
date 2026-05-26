import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { logError } from "@/lib/db/queries";

interface TextAnnotation {
  text: string;
  x: number;
  y: number;
  page: number;
  fontSize?: number;
  color?: string;
}

interface ImagePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

function hexToRgb(hex: string) {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16) / 255;
  const g = parseInt(cleaned.substring(2, 4), 16) / 255;
  const b = parseInt(cleaned.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

export async function addTextToPDF(
  fileBuffer: Buffer,
  texts: TextAnnotation[]
): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.load(fileBuffer, {
      ignoreEncryption: true,
    });
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    for (const t of texts) {
      const pageIndex = t.page - 1;
      if (pageIndex < 0 || pageIndex >= pages.length) {
        throw new Error(
          `Page ${t.page} does not exist. Document has ${pages.length} pages.`
        );
      }

      const page = pages[pageIndex];
      page.drawText(t.text, {
        x: t.x,
        y: t.y,
        size: t.fontSize ?? 14,
        font,
        color: t.color ? hexToRgb(t.color) : rgb(0, 0, 0),
      });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (err) {
    await logError({
      tool_name: "edit-pdf",
      error_type: "ADD_TEXT_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
    throw new Error(
      `Failed to add text to PDF: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}

export async function addImageToPDF(
  fileBuffer: Buffer,
  imageBuffer: Buffer,
  position: ImagePosition
): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.load(fileBuffer, {
      ignoreEncryption: true,
    });
    const pages = pdfDoc.getPages();

    const pageIndex = position.page - 1;
    if (pageIndex < 0 || pageIndex >= pages.length) {
      throw new Error(
        `Page ${position.page} does not exist. Document has ${pages.length} pages.`
      );
    }

    // Detect image format from magic bytes
    let image;
    if (imageBuffer[0] === 0xff && imageBuffer[1] === 0xd8) {
      image = await pdfDoc.embedJpg(imageBuffer);
    } else {
      image = await pdfDoc.embedPng(imageBuffer);
    }

    const page = pages[pageIndex];
    page.drawImage(image, {
      x: position.x,
      y: position.y,
      width: position.width,
      height: position.height,
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (err) {
    await logError({
      tool_name: "edit-pdf",
      error_type: "ADD_IMAGE_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
    throw new Error(
      `Failed to add image to PDF: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}
