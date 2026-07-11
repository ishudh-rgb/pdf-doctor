import { describe, expect, it } from "vitest";
import {
  FILE_LIMITS,
  FILE_SIZE_MARKETING,
  formatFileSizeMarketingLabel,
  getMaxFileSizeMB,
  isUnlimitedFileSizeMB,
  planFileSizeMarketingLabel,
} from "@/config/constants";

describe("file size constants", () => {
  it("detects unlimited bypass values", () => {
    expect(isUnlimitedFileSizeMB(0)).toBe(true);
    expect(isUnlimitedFileSizeMB(-1)).toBe(true);
    expect(isUnlimitedFileSizeMB(25)).toBe(false);
  });

  it("formats marketing labels without unlimited wording", () => {
    expect(formatFileSizeMarketingLabel(25)).toBe("Up to 25 MB per file");
    expect(formatFileSizeMarketingLabel(0)).toBe("Generous file size limits");
    expect(formatFileSizeMarketingLabel(0).toLowerCase()).not.toContain("unlimited");
  });

  it("resolves plan limits from configured defaults", () => {
    expect(getMaxFileSizeMB(false)).toBe(FILE_LIMITS.maxFreeFileSizeMB);
    expect(getMaxFileSizeMB(true)).toBe(FILE_LIMITS.maxProFileSizeMB);
    expect(planFileSizeMarketingLabel(false)).toBe(FILE_SIZE_MARKETING.freeLabel);
    expect(planFileSizeMarketingLabel(true)).toBe(FILE_SIZE_MARKETING.proLabel);
  });
});
