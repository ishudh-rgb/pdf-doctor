import { describe, expect, it } from "vitest";
import { createTestPdfFile, getPdfPageCount } from "@/test/pdf-fixtures";
import {
  mergePdfFilesInBrowser,
  splitAllPagesInBrowser,
  extractPagesInBrowser,
  rotatePdfInBrowser,
} from "@/lib/pdf/pdf-browser";

async function blobToBuffer(blob: Blob): Promise<Buffer> {
  return Buffer.from(await blob.arrayBuffer());
}

describe("client PDF helpers (pdf-browser)", () => {
  it("mergePdfFilesInBrowser combines two files", async () => {
    const a = await createTestPdfFile("a.pdf", { labels: ["A"] });
    const b = await createTestPdfFile("b.pdf", { labels: ["B"] });
    const merged = await mergePdfFilesInBrowser([a, b]);
    expect(merged.type).toBe("application/pdf");
    expect(await getPdfPageCount(await blobToBuffer(merged))).toBe(2);
  });

  it("splitAllPagesInBrowser splits each page", async () => {
    const file = await createTestPdfFile("two.pdf", { pages: 2 });
    const parts = await splitAllPagesInBrowser(file);
    expect(parts).toHaveLength(2);
    for (const part of parts) {
      expect(await getPdfPageCount(await blobToBuffer(part))).toBe(1);
    }
  });

  it("extractPagesInBrowser keeps selected pages", async () => {
    const file = await createTestPdfFile("four.pdf", { pages: 4 });
    const extracted = await extractPagesInBrowser(file, [1, 3]);
    expect(await getPdfPageCount(await blobToBuffer(extracted))).toBe(2);
  });

  it("rotatePdfInBrowser changes page rotation", async () => {
    const file = await createTestPdfFile("one.pdf", { pages: 1 });
    const rotated = await rotatePdfInBrowser(file, { 1: 90 });
    expect(rotated.type).toBe("application/pdf");
    expect((await blobToBuffer(rotated)).length).toBeGreaterThan(0);
  });
});
