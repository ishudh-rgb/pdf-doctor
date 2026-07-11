import { describe, expect, it } from "vitest";
import { validateBufferMagic } from "./file-magic";

describe("validateBufferMagic", () => {
  it("rejects empty buffers", () => {
    expect(validateBufferMagic(Buffer.alloc(0), ["pdf"])).toEqual({
      valid: false,
      message: "File is empty.",
    });
  });

  it("accepts PDF magic bytes", () => {
    const pdf = Buffer.from("%PDF-1.7\n", "ascii");
    expect(validateBufferMagic(pdf, ["pdf"])).toEqual({ valid: true });
  });

  it("accepts plain text when txt is allowed", () => {
    const txt = Buffer.from("Hello PDF Doctor\n", "utf8");
    expect(validateBufferMagic(txt, ["txt"])).toEqual({ valid: true });
  });

  it("rejects mismatched categories", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(validateBufferMagic(png, ["pdf"])).toEqual({
      valid: false,
      message: "File content does not match the allowed file type.",
    });
  });

  it("rejects unknown binary content", () => {
    const unknown = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    expect(validateBufferMagic(unknown, ["pdf"])).toEqual({
      valid: false,
      message: "File content does not match the declared type.",
    });
  });
});
