import { describe, expect, it } from "vitest";
import {
  formatFileSize,
  generateSecureFilename,
  getFileExtension,
  getMimeTypeCategory,
  isValidFileType,
  sanitizeFilename,
  validateFileSize,
} from "@/lib/utils/file";

function mockFile(name: string, type: string, sizeBytes: number): File {
  const blob = new Blob([new Uint8Array(sizeBytes)], { type });
  return new File([blob], name, { type });
}

describe("file utils", () => {
  it("formats byte sizes", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("extracts extensions and builds secure names", () => {
    expect(getFileExtension("report.PDF")).toBe("pdf");
    expect(getFileExtension("noext")).toBe("");
    const secure = generateSecureFilename("invoice.pdf");
    expect(secure.endsWith(".pdf")).toBe(true);
    expect(secure).not.toBe("invoice.pdf");
  });

  it("validates file types by mime and extension", () => {
    const pdf = mockFile("doc.pdf", "application/pdf", 100);
    expect(isValidFileType(pdf, ["pdf"])).toBe(true);
    expect(isValidFileType(pdf, ["word"])).toBe(false);

    const docx = mockFile("file.docx", "", 100);
    expect(isValidFileType(docx, ["word"])).toBe(true);
  });

  it("validates file size limits", () => {
    const empty = mockFile("empty.pdf", "application/pdf", 0);
    expect(validateFileSize(empty, 25).valid).toBe(false);

    const ok = mockFile("ok.pdf", "application/pdf", 1024);
    expect(validateFileSize(ok, 25).valid).toBe(true);

    const huge = mockFile("big.pdf", "application/pdf", 30 * 1024 * 1024);
    expect(validateFileSize(huge, 25).valid).toBe(false);
    expect(validateFileSize(huge, 25).message).toMatch(/exceeds/i);

    expect(validateFileSize(huge, 0).valid).toBe(true);
  });

  it("maps mime categories and sanitizes download names", () => {
    expect(getMimeTypeCategory("application/pdf")).toBe("pdf");
    expect(getMimeTypeCategory("application/unknown")).toBeNull();
    expect(sanitizeFilename('bad"name\r\n.pdf')).toBe('badname.pdf');
    expect(sanitizeFilename("   ")).toBe("download");
  });
});
