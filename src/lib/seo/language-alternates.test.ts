import { describe, expect, it } from "vitest";
import { buildLanguageAlternates } from "@/lib/seo/language-alternates";

describe("buildLanguageAlternates", () => {
  it("builds en, hi, and x-default URLs", () => {
    const alt = buildLanguageAlternates("/pricing");
    expect(alt.canonical).toContain("/pricing");
    expect(alt.languages.en).toBe(alt.canonical);
    expect(alt.languages.hi).toContain("/hi/pricing");
    expect(alt.languages["x-default"]).toBe(alt.canonical);
  });

  it("uses canonical for home path", () => {
    const alt = buildLanguageAlternates("/");
    expect(alt.languages.en).toBe(alt.canonical);
    expect(alt.languages.hi).toContain("/hi");
  });

  it("strips /hi prefix from canonical when given Hindi path", () => {
    const alt = buildLanguageAlternates("/hi/terms");
    expect(alt.canonical).toContain("/terms");
    expect(alt.canonical).not.toContain("/hi/hi");
    expect(alt.languages.hi).toContain("/hi/terms");
  });
});
