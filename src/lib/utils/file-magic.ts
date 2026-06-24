/** Magic-byte sniffing for uploads — validation only, not conversion logic. */

const SIGNATURES: Record<string, { bytes: number[]; offset?: number }[]> = {
  pdf: [{ bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] }], // %PDF-
  png: [{ bytes: [0x89, 0x50, 0x4e, 0x47] }],
  jpeg: [{ bytes: [0xff, 0xd8, 0xff] }],
  gif: [{ bytes: [0x47, 0x49, 0x46, 0x38] }],
  webp: [{ bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }],
  zip: [{ bytes: [0x50, 0x4b, 0x03, 0x04] }], // docx/xlsx/pptx
};

function matchesSignature(
  buffer: Buffer,
  sig: { bytes: number[]; offset?: number }
): boolean {
  const offset = sig.offset ?? 0;
  if (buffer.length < offset + sig.bytes.length) return false;
  return sig.bytes.every((b, i) => buffer[offset + i] === b);
}

function categoryFromMagic(buffer: Buffer): string | null {
  if (SIGNATURES.pdf.some((s) => matchesSignature(buffer, s))) return "pdf";
  if (SIGNATURES.png.some((s) => matchesSignature(buffer, s))) return "png";
  if (SIGNATURES.jpeg.some((s) => matchesSignature(buffer, s))) return "jpeg";
  if (SIGNATURES.gif.some((s) => matchesSignature(buffer, s))) return "gif";
  if (SIGNATURES.webp.every((s) => matchesSignature(buffer, s))) return "webp";
  if (SIGNATURES.zip.some((s) => matchesSignature(buffer, s))) return "zip";
  return null;
}

const CATEGORY_MAP: Record<string, string[]> = {
  pdf: ["pdf"],
  word: ["zip"],
  image: ["png", "jpeg", "gif", "webp"],
  excel: ["zip"],
  powerpoint: ["zip"],
};

export function validateBufferMagic(
  buffer: Buffer,
  allowedCategories: string[]
): { valid: boolean; message?: string } {
  if (buffer.length === 0) {
    return { valid: false, message: "File is empty." };
  }

  const detected = categoryFromMagic(buffer);

  if (allowedCategories.includes("txt") || allowedCategories.includes("html")) {
    const textSample = buffer.subarray(0, Math.min(512, buffer.length)).toString("utf8");
    const nullBytes = buffer.subarray(0, Math.min(32, buffer.length)).includes(0);
    if (!nullBytes && /^[\x09\x0a\x0d\x20-\x7e\u00a0-\ufffd]*$/u.test(textSample.slice(0, 256))) {
      return { valid: true };
    }
  }

  if (!detected) {
    return { valid: false, message: "File content does not match the declared type." };
  }

  const allowed = allowedCategories.some((cat) =>
    (CATEGORY_MAP[cat] ?? []).includes(detected)
  );

  if (!allowed) {
    return { valid: false, message: "File content does not match the allowed file type." };
  }

  return { valid: true };
}
