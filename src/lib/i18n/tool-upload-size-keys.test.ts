import { describe, expect, it } from "vitest";
import en from "@/i18n/en.json";
import hi from "@/i18n/hi.json";
import { formatUploadSizeDisplay } from "@/hooks/use-tool-upload-limits";

describe("tool upload size i18n", () => {
  it("has upload size keys in en and hi", () => {
    expect(en.toolPage.uploadSizeFree).toContain("{free}");
    expect(en.toolPage.uploadSizeFree).toContain("{pro}");
    expect(en.toolPage.uploadSizePro).toContain("{pro}");
    expect(hi.toolPage.uploadSizeFree).toContain("{free}");
    expect(hi.toolPage.uploadSizePro).toContain("{pro}");
  });

  it("keeps MB with the number using a non-breaking space", () => {
    expect(formatUploadSizeDisplay("Free up to 25 MB · Pro up to 200 MB")).toBe(
      "Free up to 25\u00a0MB · Pro up to 200\u00a0MB"
    );
  });
});
