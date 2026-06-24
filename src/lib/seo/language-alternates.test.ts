import { describe, expect, it } from "vitest";
import { buildLanguageAlternates } from "@/lib/seo/language-alternates";

describe("buildLanguageAlternates", () => {
  it("builds en, hi, and x-default URLs", () => {
    const alt = buildLanguageAlternates("/pricing");
    expect(alt.canonical).toContain("/pricing");
    expect(alt.languages.en).toBe(alt.canonical);
    expect(alt.languages.hi).toContain("lang=hi");
    expect(alt.languages["x-default"]).toBe(alt.canonical);
  });

  it("appends lang=hi on home path", () => {
    const alt = buildLanguageAlternates("/");
    expect(alt.languages.hi).toMatch(/\?lang=hi$/);
  });
});
