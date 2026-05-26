import { PDFDocument } from "pdf-lib";
import { PDFParse } from "pdf-parse";
import sharp from "sharp";
import { logError } from "@/lib/db/queries";

export async function compressPDF(
  fileBuffer: Buffer,
  level: "basic" | "strong" = "basic"
): Promise<{ buffer: Buffer; originalSize: number; compressedSize: number }> {
  const originalSize = fileBuffer.length;

  try {
    const structural = await compressStructurally(fileBuffer, level);
    if (structural.length < originalSize) {
      const savedEnough =
        level === "strong" ||
        (originalSize - structural.length) / originalSize >= 0.02;

      if (savedEnough) {
        return {
          buffer: structural,
          originalSize,
          compressedSize: structural.length,
        };
      }
    }

    const rasterized = await compressByRasterizing(
      fileBuffer,
      level === "strong"
        ? { scale: 1.25, quality: 45 }
        : { scale: 1.75, quality: 72 }
    );

    if (rasterized.length < originalSize) {
      return {
        buffer: rasterized,
        originalSize,
        compressedSize: rasterized.length,
      };
    }

    const best = structural.length <= rasterized.length ? structural : rasterized;
    if (best.length < originalSize) {
      return {
        buffer: best,
        originalSize,
        compressedSize: best.length,
      };
    }

    return {
      buffer: fileBuffer,
      originalSize,
      compressedSize: originalSize,
    };
  } catch (err) {
    await logError({
      tool_name: "compress-pdf",
      error_type: "COMPRESS_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
    throw new Error(
      `Failed to compress PDF: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}

async function compressStructurally(
  fileBuffer: Buffer,
  level: "basic" | "strong"
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(fileBuffer, {
    ignoreEncryption: true,
  });

  if (level === "strong") {
    try {
      pdfDoc.getForm().flatten();
    } catch {
      // No form fields to flatten
    }
  }

  pdfDoc.setTitle("");
  pdfDoc.setAuthor("");
  pdfDoc.setSubject("");
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer("PDF Doctor");
  pdfDoc.setCreator("PDF Doctor");

  const compressedBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: level === "strong" ? 20 : 50,
  });

  return Buffer.from(compressedBytes);
}

async function compressByRasterizing(
  fileBuffer: Buffer,
  options: { scale: number; quality: number }
): Promise<Buffer> {
  const parser = new PDFParse({ data: fileBuffer });

  try {
    const screenshots = await parser.getScreenshot({
      scale: options.scale,
      imageBuffer: true,
    });

    if (!screenshots.pages.length) {
      return fileBuffer;
    }

    const pdfDoc = await PDFDocument.create();

    for (const page of screenshots.pages) {
      if (!page.data || !page.width || !page.height) continue;

      const jpeg = await sharp(Buffer.from(page.data))
        .jpeg({ quality: options.quality, mozjpeg: true })
        .toBuffer();

      const image = await pdfDoc.embedJpg(jpeg);
      const pdfPage = pdfDoc.addPage([page.width, page.height]);
      pdfPage.drawImage(image, {
        x: 0,
        y: 0,
        width: page.width,
        height: page.height,
      });
    }

    if (pdfDoc.getPageCount() === 0) {
      return fileBuffer;
    }

    return Buffer.from(
      await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      })
    );
  } finally {
    await parser.destroy();
  }
}
