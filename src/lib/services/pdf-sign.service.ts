import { PDFDocument } from "pdf-lib";
import { logError } from "@/lib/db/queries";

interface SignaturePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
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
