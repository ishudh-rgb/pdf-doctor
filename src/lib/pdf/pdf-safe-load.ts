import { PDFDocument } from "pdf-lib";

/**
 * Safely load a PDF, rejecting truly encrypted files with a clear error.
 * Falls back to ignoreEncryption for PDFs that trip false-positive
 * encryption detection in pdf-lib (e.g. certain linearized files).
 */
export async function safePdfLoad(
  buffer: Buffer,
  toolName?: string
): Promise<ReturnType<typeof PDFDocument.load>> {
  try {
    return await PDFDocument.load(buffer);
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : "";
    const isEncryptionError =
      msg.includes("encrypt") || msg.includes("password") || msg.includes("decrypt");

    if (isEncryptionError) {
      const hasEncryptMarker =
        buffer.includes(Buffer.from("/Encrypt")) ||
        buffer.subarray(0, 2048).toString("ascii").includes("/Encrypt");

      if (hasEncryptMarker) {
        throw new Error(
          `This PDF is password-protected. Please use the "Unlock PDF" tool first, then try again.`
        );
      }
    }

    return await PDFDocument.load(buffer, { ignoreEncryption: true });
  }
}
