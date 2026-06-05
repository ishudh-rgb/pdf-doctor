import { PDFDocument, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { logError } from "@/lib/db/queries";

interface SignaturePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

export interface SignAnnotationInput {
  type: "image" | "text" | "date" | "check";
  page: number;
  xNorm: number;
  yNorm: number;
  widthNorm: number;
  heightNorm: number;
  text?: string;
  fontSize?: number;
  imageIndex?: number;
}

function normToPdfRect(
  pageWidth: number,
  pageHeight: number,
  xNorm: number,
  yNorm: number,
  widthNorm: number,
  heightNorm: number
) {
  const w = widthNorm * pageWidth;
  const h = heightNorm * pageHeight;
  const x = xNorm * pageWidth;
  const y = pageHeight - yNorm * pageHeight - h;
  return { x, y, width: w, height: h };
}

/** Draw checkmark with lines — StandardFonts cannot encode Unicode ✓ (U+2713). */
function drawCheckmark(
  page: PDFPage,
  rect: { x: number; y: number; width: number; height: number }
) {
  const { x, y, width, height } = rect;
  const thickness = Math.max(1.2, Math.min(width, height) * 0.11);
  const color = rgb(0, 0, 0);

  page.drawLine({
    start: { x: x + width * 0.14, y: y + height * 0.48 },
    end: { x: x + width * 0.38, y: y + height * 0.2 },
    thickness,
    color,
  });
  page.drawLine({
    start: { x: x + width * 0.38, y: y + height * 0.2 },
    end: { x: x + width * 0.86, y: y + height * 0.78 },
    thickness,
    color,
  });
}

export async function applySignAnnotations(
  fileBuffer: Buffer,
  annotations: SignAnnotationInput[],
  imageBuffers: Buffer[]
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const ann of annotations) {
    const pageIndex = ann.page - 1;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;
    const page = pages[pageIndex];
    const { width, height } = page.getSize();
    const rect = normToPdfRect(width, height, ann.xNorm, ann.yNorm, ann.widthNorm, ann.heightNorm);

    if (ann.type === "image" && ann.imageIndex !== undefined) {
      const buf = imageBuffers[ann.imageIndex];
      if (!buf) continue;
      const img =
        buf[0] === 0xff && buf[1] === 0xd8
          ? await pdfDoc.embedJpg(buf)
          : await pdfDoc.embedPng(buf);
      page.drawImage(img, rect);
      continue;
    }

    if (ann.type === "text" || ann.type === "date") {
      const size = ann.fontSize ?? 14;
      page.drawText(ann.text ?? "", {
        x: rect.x,
        y: rect.y + rect.height * 0.2,
        size,
        font,
        color: rgb(0, 0, 0),
      });
      continue;
    }

    if (ann.type === "check") {
      drawCheckmark(page, rect);
    }
  }

  return Buffer.from(await pdfDoc.save());
}

export async function addSignatureToPDF(
  fileBuffer: Buffer,
  signatureBuffer: Buffer,
  position: SignaturePosition
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

    // Signature images are typically PNG (transparent background)
    let signatureImage;
    if (signatureBuffer[0] === 0xff && signatureBuffer[1] === 0xd8) {
      signatureImage = await pdfDoc.embedJpg(signatureBuffer);
    } else {
      signatureImage = await pdfDoc.embedPng(signatureBuffer);
    }

    const page = pages[pageIndex];
    page.drawImage(signatureImage, {
      x: position.x,
      y: position.y,
      width: position.width,
      height: position.height,
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (err) {
    await logError({
      tool_name: "sign-pdf",
      error_type: "ADD_SIGNATURE_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
    throw new Error(
      `Failed to add signature to PDF: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}
