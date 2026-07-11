import { describe, expect, it } from "vitest";
import {
  resolveLocalizedToolDescription,
  resolveLocalizedToolTitle,
  toolI18nBaseKey,
} from "@/lib/i18n/tool-page-copy";

describe("tool-page-copy", () => {
  const t = (key: string) => key;

  it("maps slug to i18n base key", () => {
    expect(toolI18nBaseKey("merge-pdf")).toBe("tools.mergePdf");
  });

  it("falls back when translation key is missing", () => {
    expect(resolveLocalizedToolTitle("merge-pdf", t, "Merge PDF")).toBe("Merge PDF");
    expect(resolveLocalizedToolDescription("merge-pdf", t, "Combine files")).toBe("Combine files");
  });
});
