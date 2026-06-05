import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import { logError } from "@/lib/db/queries";
import { safePdfLoad } from "@/lib/pdf/pdf-safe-load";
import type { PdfFontKey } from "@/lib/edit-pdf/fonts";
import type {
  ExportImageOp,
  ExportShapeOp,
  ExportStrokeOp,
  ExportTextOp,
  TextDecoration,
} from "@/components/tools/edit-pdf/edit-pdf-types";

const FONT_MAP: Record<PdfFontKey, StandardFonts> = {
  Helvetica: StandardFonts.Helvetica,
  "Helvetica-Bold": StandardFonts.HelveticaBold,
  "Helvetica-Oblique": StandardFonts.HelveticaOblique,
  "Helvetica-BoldOblique": StandardFonts.HelveticaBoldOblique,
  "Times-Roman": StandardFonts.TimesRoman,
  "Times-Bold": StandardFonts.TimesBold,
  "Times-Italic": StandardFonts.TimesItalic,
  "Times-BoldItalic": StandardFonts.TimesBoldItalic,
  Courier: StandardFonts.Courier,
  "Courier-Bold": StandardFonts.CourierBold,
  "Courier-Oblique": StandardFonts.CourierOblique,
  "Courier-BoldOblique": StandardFonts.CourierBoldOblique,
};

function hexToRgb(hex: string): RGB {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16) / 255;
  const g = parseInt(cleaned.substring(2, 4), 16) / 255;
  const b = parseInt(cleaned.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

function parseColor(hex: string): RGB {
  return hexToRgb(hex);
}

async function getFont(pdfDoc: PDFDocument, key: PdfFontKey = "Helvetica") {
  return pdfDoc.embedFont(FONT_MAP[key] ?? StandardFonts.Helvetica);
}

function drawDecoration(
  page: PDFPage,
  t: ExportTextOp,
  textWidth: number,
  color: RGB
) {
  const deco = t.decoration ?? "none";
  if (deco === "none") return;

  const size = t.fontSize ?? 12;
  const baseY = t.y;
  const x1 = t.x;
  const x2 = t.x + (t.boxWidth ?? textWidth);

  if (deco === "highlight") {
    page.drawRectangle({
      x: x1 - 1,
      y: baseY - 2,
      width: x2 - x1 + 2,
      height: size + 4,
      color: rgb(1, 0.92, 0.23),
      opacity: 0.45,
      borderWidth: 0,
    });
    return;
  }

  const lineY =
    deco === "underline"
      ? baseY - 2
      : deco === "strikethrough"
        ? baseY + size * 0.35
        : baseY - 1;

  if (deco === "squiggle") {
    let cx = x1;
    const amp = 1.5;
    while (cx < x2) {
      page.drawLine({
        start: { x: cx, y: lineY },
        end: { x: cx + 3, y: lineY + amp },
        thickness: 0.8,
        color,
      });
      page.drawLine({
        start: { x: cx + 3, y: lineY + amp },
        end: { x: cx + 6, y: lineY - amp },
        thickness: 0.8,
        color,
      });
      cx += 6;
    }
    return;
  }

  page.drawLine({
    start: { x: x1, y: lineY },
    end: { x: x2, y: lineY },
    thickness: deco === "underline" ? 0.8 : 0.6,
    color,
  });
}

export interface EditPdfOperations {
  texts?: ExportTextOp[];
  images?: ExportImageOp[];
  shapes?: ExportShapeOp[];
  strokes?: ExportStrokeOp[];
}

export async function applyEditPdfOperations(
  fileBuffer: Buffer,
  operations: EditPdfOperations,
  imageBuffers: Buffer[] = []
): Promise<Buffer> {
  try {
    const pdfDoc = await safePdfLoad(fileBuffer, "edit-pdf");
    const pages = pdfDoc.getPages();
    const fontCache = new Map<PdfFontKey, Awaited<ReturnType<typeof getFont>>>();

    async function font(key: PdfFontKey) {
      if (!fontCache.has(key)) {
        fontCache.set(key, await getFont(pdfDoc, key));
      }
      return fontCache.get(key)!;
    }

    for (const t of operations.texts ?? []) {
      const pageIndex = t.page - 1;
      if (pageIndex < 0 || pageIndex >= pages.length) {
        throw new Error(`Text operation targets page ${t.page}, but document only has ${pages.length} pages.`);
      }
      const page = pages[pageIndex];
      const color = t.color ? hexToRgb(t.color) : rgb(0, 0, 0);
      const f = await font(t.fontKey ?? "Helvetica");

      if (t.whiteout) {
        const w = t.whiteout;
        page.drawRectangle({
          x: w.x,
          y: w.y,
          width: w.width,
          height: w.height,
          color: rgb(1, 1, 1),
          borderWidth: 0,
        });
      }

      drawDecoration(page, t, f.widthOfTextAtSize(t.text, t.fontSize ?? 12), color);

      page.drawText(t.text, {
        x: t.x,
        y: t.y,
        size: t.fontSize ?? 12,
        font: f,
        color,
      });
    }

    for (const s of operations.shapes ?? []) {
      const pageIndex = s.page - 1;
      if (pageIndex < 0 || pageIndex >= pages.length) {
        throw new Error(`Shape operation targets page ${s.page}, but document only has ${pages.length} pages.`);
      }
      const page = pages[pageIndex];
      page.drawRectangle({
        x: s.x,
        y: s.y,
        width: s.width,
        height: s.height,
        borderColor: hexToRgb(s.strokeColor),
        borderWidth: s.strokeWidth,
        color: s.fillColor ? parseColor(s.fillColor) : undefined,
      });
    }

    for (const stroke of operations.strokes ?? []) {
      const pageIndex = stroke.page - 1;
      if (pageIndex < 0 || pageIndex >= pages.length) {
        throw new Error(`Stroke operation targets page ${stroke.page}, but document only has ${pages.length} pages.`);
      }
      const page = pages[pageIndex];
      const color = parseColor(stroke.color);
      for (let i = 1; i < stroke.points.length; i++) {
        page.drawLine({
          start: stroke.points[i - 1],
          end: stroke.points[i],
          thickness: stroke.width,
          color,
          opacity: stroke.opacity,
        });
      }
    }

    for (const imgOp of operations.images ?? []) {
      if (imgOp.imageIndex >= imageBuffers.length) {
        throw new Error(`Image operation references image index ${imgOp.imageIndex}, but only ${imageBuffers.length} images were provided.`);
      }
      const pageIndex = imgOp.page - 1;
      if (pageIndex < 0 || pageIndex >= pages.length) {
        throw new Error(`Image operation targets page ${imgOp.page}, but document only has ${pages.length} pages.`);
      }
      const imageBuffer = imageBuffers[imgOp.imageIndex];
      let image;
      if (imageBuffer[0] === 0xff && imageBuffer[1] === 0xd8) {
        image = await pdfDoc.embedJpg(imageBuffer);
      } else {
        image = await pdfDoc.embedPng(imageBuffer);
      }
      pages[pageIndex].drawImage(image, {
        x: imgOp.x,
        y: imgOp.y,
        width: imgOp.width,
        height: imgOp.height,
      });
    }

    return Buffer.from(await pdfDoc.save());
  } catch (err) {
    await logError({
      tool_name: "edit-pdf",
      error_type: "EDIT_APPLY_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
    throw new Error(
      `Failed to edit PDF: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}

/** @deprecated Use applyEditPdfOperations */
export async function addTextToPDF(
  fileBuffer: Buffer,
  texts: ExportTextOp[]
): Promise<Buffer> {
  return applyEditPdfOperations(fileBuffer, { texts });
}

/** @deprecated Use applyEditPdfOperations */
export async function addImageToPDF(
  fileBuffer: Buffer,
  imageBuffer: Buffer,
  position: ExportImageOp
): Promise<Buffer> {
  return applyEditPdfOperations(fileBuffer, { images: [position] }, [imageBuffer]);
}
