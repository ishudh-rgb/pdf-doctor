import { describe, expect, it } from "vitest";
import en from "@/i18n/en.json";
import hi from "@/i18n/hi.json";

const TOOL_PAGE_UI_KEYS = [
  "selectFile",
  "orDragDropFile",
  "sizeOriginal",
  "sizeOutput",
  "sizeSaved",
  "processingLabel",
  "chooseFileAria",
  "outputSize",
] as const;

describe("tool workspace UI i18n", () => {
  for (const key of TOOL_PAGE_UI_KEYS) {
    it(`has Hindi translation for toolPage.${key}`, () => {
      const enVal = en.toolPage[key as keyof typeof en.toolPage];
      const hiVal = hi.toolPage[key as keyof typeof hi.toolPage];
      expect(typeof enVal).toBe("string");
      expect(typeof hiVal).toBe("string");
      expect((hiVal as string).length).toBeGreaterThan(0);
      expect(hiVal).not.toBe(enVal);
    });
  }
});
