import { describe, expect, it } from "vitest";
import {
  cleanDocxText,
  fixBrokenHyphenation,
  fixLigatureArtifacts,
} from "./ligature-fix";

describe("ligature-fix", () => {
  it("fixes spaced ligature artifacts", () => {
    expect(fixLigatureArtifacts("pro fi t margin")).toBe("profit margin");
    expect(fixLigatureArtifacts("O ffi cer")).toBe("Officer");
  });

  it("joins broken hyphenation", () => {
    expect(fixBrokenHyphenation("docu-\nment")).toBe("document");
  });

  it("cleans docx text end-to-end", () => {
    expect(cleanDocxText("pro fi t\nre-\n port")).toBe("profit\nreport");
  });
});
