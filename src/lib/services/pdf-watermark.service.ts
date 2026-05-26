import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import { logError } from "@/lib/db/queries";

export interface TextWatermarkOptions {
  type: "text";
  text: string;
  opacity?: number;
  fontSize?: number;
  rotation?: number;
  color?: string;
  pages?: "all" | number[];
}

export interface ImageWatermarkOptions {
  type: "image";
  opacity?: number;
  rotation?: number;
  pages?: "all" | number[];
}

export type WatermarkOptions = TextWatermarkOptions | ImageWatermarkOptions;

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized.padEnd(6, "0").slice(0, 6);

  return rgb(
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255
  );
}

function shouldApplyWatermark(pageIndex: number, pages: "all" | number[] | undefined): boolean {
  if (!pages || pages === "all") return true;
  return pages.includes(pageIndex + 1);
}

export async function addWatermarkToPDF(
  fileBuffer: Buffer,
  options: WatermarkOptions,
  imageBuffer?: Buffer
): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    const opacity = options.opacity ?? 0.25;
    const rotation = options.rotation ?? -35;

    if (options.type === "text") {
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontSize = options.fontSize ?? 48;
      const color = hexToRgb(options.color ?? "#64748b");
      const text = options.text.trim();

      if (!text) {
        throw new Error("Watermark text is required.");
      }

      const textWidth = font.widthOfTextAtSize(text, fontSize);

      pages.forEach((page, index) => {
        if (!shouldApplyWatermark(index, options.pages)) return;

        const { width, height } = page.getSize();
        page.drawText(text, {
          x: width / 2 - textWidth / 2,
          y: height / 2,
          size: fontSize,
          font,
          color,
          opacity,
          rotate: degrees(rotation),
        });
      });
    } else {
      if (!imageBuffer) {
        throw new Error("Watermark image is required.");
      }

      const image =
        imageBuffer[0] === 0xff && imageBuffer[1] === 0xd8
          ? await pdfDoc.embedJpg(imageBuffer)
          : await pdfDoc.embedPng(imageBuffer);

      pages.forEach((page, index) => {
        if (!shouldApplyWatermark(index, options.pages)) return;

        const { width, height } = page.getSize();
        const targetWidth = width * 0.35;
        const scale = targetWidth / image.width;
        const targetHeight = image.height * scale;

        page.drawImage(image, {
          x: width / 2 - targetWidth / 2,
          y: height / 2 - targetHeight / 2,
          width: targetWidth,
          height: targetHeight,
          opacity,
          rotate: degrees(rotation),
        });
      });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (err) {
    await logError({
      tool_name: "add-watermark",
      error_type: "ADD_WATERMARK_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
    throw new Error(
      `Failed to add watermark: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}
