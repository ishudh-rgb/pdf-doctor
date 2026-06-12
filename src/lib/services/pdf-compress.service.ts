import { PDFDocument } from "pdf-lib";
import { PDFParse } from "pdf-parse";
import sharp from "sharp";
import { logError } from "@/lib/db/queries";

type RasterOptions = { scale: number; quality: number };

const RASTER_PRESETS: Record<"basic" | "strong", RasterOptions[]> = {
  basic: [
    { scale: 1.0, quality: 70 },
    { scale: 0.92, quality: 62 },
  ],
  strong: [
    { scale: 0.88, quality: 48 },
    { scale: 0.75, quality: 38 },
    { scale: 0.65, quality: 30 },
  ],
};

function pickSmallestBuffer(
  originalSize: number,
  candidates: (Buffer | null | undefined)[]
): Buffer | null {
  const valid = candidates.filter(
    (b): b is Buffer => b !== null && b !== undefined && b.length > 0 && b.length < originalSize
  );
  if (valid.length === 0) return null;
  return valid.reduce((best, current) => (current.length < best.length ? current : best));
}

export async function compressPDF(
  fileBuffer: Buffer,
  level: "basic" | "strong" = "basic",
  password?: string
): Promise<{ buffer: Buffer; originalSize: number; compressedSize: number }> {
  const originalSize = fileBuffer.length;

  try {
    const structural = await compressStructurally(fileBuffer, level);
    const rasterAttempts: Buffer[] = [];

    for (const preset of RASTER_PRESETS[level]) {
      try {
        const rasterized = await compressByRasterizing(fileBuffer, preset, password);
        if (rasterized.length < originalSize) {
          rasterAttempts.push(rasterized);
        }
      } catch (rasterErr) {
        await logError({
          tool_name: "compress-pdf",
          error_type: "RASTERIZE_ATTEMPT",
          error_message: rasterErr instanceof Error ? rasterErr.message : String(rasterErr),
        }).catch(() => {});
      }
    }

    const best = pickSmallestBuffer(originalSize, [structural, ...rasterAttempts]);

    if (best) {
      return { buffer: best, originalSize, compressedSize: best.length };
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
  pdfDoc.setProducer("Only4PDF");
  pdfDoc.setCreator("Only4PDF");

  const compressedBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: level === "strong" ? 35 : 50,
  });

  return Buffer.from(compressedBytes);
}

async function compressByRasterizing(
  fileBuffer: Buffer,
  options: RasterOptions,
  password?: string
): Promise<Buffer> {
  const parser = new PDFParse({ data: fileBuffer, password });

  try {
    const info = await parser.getInfo();
    const totalPages = info.total;
    if (totalPages <= 0) {
      throw new Error("Could not read PDF pages for compression.");
    }

    const pdfDoc = await PDFDocument.create();

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const shot = await parser.getScreenshot({
        partial: [pageNum],
        scale: options.scale,
        imageBuffer: true,
      });

      const page = shot.pages.find((p) => p.pageNumber === pageNum) ?? shot.pages[0];
      if (!page?.data || !page.width || !page.height) continue;

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
      throw new Error("Rasterization produced no pages.");
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
