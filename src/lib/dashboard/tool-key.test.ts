import { describe, expect, it } from "vitest";
import { slugToToolKey } from "@/lib/dashboard/tool-key";

describe("slugToToolKey", () => {
  it("maps merge-pdf to tools.mergePdf.name", () => {
    expect(slugToToolKey("merge-pdf")).toBe("tools.mergePdf.name");
  });

  it("maps ai-pdf-summarizer to tools.aiPdfSummarizer.name", () => {
    expect(slugToToolKey("ai-pdf-summarizer")).toBe("tools.aiPdfSummarizer.name");
  });

  it("maps pdf-to-word to tools.pdfToWord.name", () => {
    expect(slugToToolKey("pdf-to-word")).toBe("tools.pdfToWord.name");
  });
});
