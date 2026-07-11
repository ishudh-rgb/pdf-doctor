import { describe, expect, it, vi, beforeEach } from "vitest";
import { PDFDocument } from "pdf-lib";
import { createTestPdf, getPdfPageCount } from "@/test/pdf-fixtures";
import { mergePDFs } from "@/lib/services/pdf-merge.service";
import { splitAllPages, splitPDF, extractPages } from "@/lib/services/pdf-split.service";
import { rotatePdfPages } from "@/lib/services/pdf-rotate.service";
import { compressPDF } from "@/lib/services/pdf-compress.service";

vi.mock("@/lib/db/queries", () => ({
  logError: vi.fn().mockResolvedValue(undefined),
  logToolUsage: vi.fn().mockResolvedValue(undefined),
}));

describe("PDF conversion integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("mergePDFs", () => {
    it("merges two single-page PDFs into one two-page document", async () => {
      const a = await createTestPdf({ labels: ["A"] });
      const b = await createTestPdf({ labels: ["B"] });
      const merged = await mergePDFs([a, b]);
      expect(await getPdfPageCount(merged)).toBe(2);
    });

    it("returns the same buffer for a single input", async () => {
      const single = await createTestPdf();
      const result = await mergePDFs([single]);
      expect(result).toEqual(single);
    });
  });

  describe("splitPDF", () => {
    it("splits a three-page PDF by range", async () => {
      const source = await createTestPdf({ pages: 3 });
      const parts = await splitPDF(source, [{ start: 1, end: 2 }, { start: 3, end: 3 }]);
      expect(parts).toHaveLength(2);
      expect(await getPdfPageCount(parts[0])).toBe(2);
      expect(await getPdfPageCount(parts[1])).toBe(1);
    });

    it("splitAllPages returns one buffer per page", async () => {
      const source = await createTestPdf({ pages: 2 });
      const pages = await splitAllPages(source);
      expect(pages).toHaveLength(2);
      for (const page of pages) {
        expect(await getPdfPageCount(page)).toBe(1);
      }
    });

    it("extractPages pulls selected pages in order", async () => {
      const source = await createTestPdf({ pages: 4, labels: ["P1", "P2", "P3", "P4"] });
      const extracted = await extractPages(source, [2, 4]);
      expect(await getPdfPageCount(extracted)).toBe(2);
    });
  });

  describe("rotatePdfPages", () => {
    it("rotates a page by 90 degrees", async () => {
      const source = await createTestPdf({ pages: 1 });
      const before = await PDFDocument.load(source);
      const beforeAngle = before.getPage(0).getRotation().angle;

      const rotated = await rotatePdfPages(source, { 1: 90 });
      const after = await PDFDocument.load(rotated);
      const afterAngle = after.getPage(0).getRotation().angle;

      expect(afterAngle).not.toBe(beforeAngle);
      expect(await getPdfPageCount(rotated)).toBe(1);
    });
  });

  describe("compressPDF", () => {
    it("returns a valid PDF with size metadata", async () => {
      const source = await createTestPdf({ pages: 2 });
      const result = await compressPDF(source, "basic");
      expect(result.originalSize).toBe(source.length);
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(await getPdfPageCount(result.buffer)).toBe(2);
      expect(result.compressedSize).toBeGreaterThan(0);
    });
  });
});
