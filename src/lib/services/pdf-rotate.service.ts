import { PDFDocument, degrees, PageSizes, PDFPage, PDFName, PDFArray, PDFNumber } from "pdf-lib";
import { logError } from "@/lib/db/queries";

const VALID_ROTATIONS = new Set([0, 90, 180, 270]);

function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Get the effective current rotation of a page, including inherited rotation
 * from the page tree and the page's own /Rotate entry.
 */
function getEffectiveRotation(page: PDFPage): number {
  const rotation = page.getRotation().angle;
  return normalizeAngle(rotation);
}

/**
 * Swap MediaBox and CropBox width/height so the page size matches
 * the visual result after a 90° or 270° net rotation change.
 * This prevents empty space caused by mismatched dimensions.
 */
function swapPageBoxes(page: PDFPage) {
  const { width, height } = page.getSize();
  page.setSize(height, width);

  const node = page.node;
  const boxNames = ["CropBox", "BleedBox", "TrimBox", "ArtBox"] as const;
  for (const name of boxNames) {
    const box = node.lookup(PDFName.of(name));
    if (box instanceof PDFArray && box.size() === 4) {
      const x1 = (box.get(0) as PDFNumber).asNumber();
      const y1 = (box.get(1) as PDFNumber).asNumber();
      const x2 = (box.get(2) as PDFNumber).asNumber();
      const y2 = (box.get(3) as PDFNumber).asNumber();
      const bw = x2 - x1;
      const bh = y2 - y1;
      node.set(
        PDFName.of(name),
        page.doc.context.obj([x1, y1, x1 + bh, y1 + bw])
      );
    }
  }
}

export async function rotatePdfPages(
  fileBuffer: Buffer,
  pageRotations: Record<number, number>
): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    for (const [pageNumStr, rotation] of Object.entries(pageRotations)) {
      const pageNum = Number(pageNumStr);

      if (pageNum < 1 || pageNum > totalPages) {
        throw new Error(
          `Page ${pageNum} does not exist. Document has ${totalPages} pages.`
        );
      }

      const desired = normalizeAngle(rotation);
      if (!VALID_ROTATIONS.has(desired)) {
        throw new Error(
          `Invalid rotation ${rotation}° for page ${pageNum}. Must be 0, 90, 180, or 270.`
        );
      }

      const page = pages[pageNum - 1];
      const current = getEffectiveRotation(page);
      const final = normalizeAngle(current + desired);

      const dimensionChange = desired === 90 || desired === 270;
      if (dimensionChange) {
        swapPageBoxes(page);
      }

      page.setRotation(degrees(final));
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (err) {
    await logError({
      tool_name: "rotate-pdf",
      error_type: "ROTATE_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
    throw new Error(
      `Failed to rotate PDF: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}

/**
 * Insert blank pages into a PDF at the given 1-based positions.
 * Each position refers to where the blank page should appear in the
 * final document. Positions are processed in ascending order so that
 * earlier insertions don't shift later indices.
 */
export async function addBlankPages(
  fileBuffer: Buffer,
  positions: number[],
  pageSize: [number, number] = PageSizes.A4
): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });

    const sorted = [...positions].sort((a, b) => a - b);
    let inserted = 0;

    for (const pos of sorted) {
      const index = pos - 1 + inserted;
      pdfDoc.insertPage(index, pageSize);
      inserted++;
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (err) {
    await logError({
      tool_name: "rotate-pdf",
      error_type: "ADD_BLANK_PAGES_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
    throw new Error(
      `Failed to add blank pages: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}
