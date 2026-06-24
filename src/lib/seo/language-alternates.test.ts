import { describe, expect, it } from "vitest";
import { buildLanguageAlternates } from "@/lib/seo/language-alternates";

describe("buildLanguageAlternates", () => {
  it("builds en and x-default URLs", () => {
    const alt = buildLanguageAlternates("/pricing");
    expect(alt.canonical).toContain("/pricing");
    expect(alt.languages.en).toBe(alt.canonical);
    expect(alt.languages["x-default"]).toBe(alt.canonical);
    expect(alt.languages).not.toHaveProperty("hi");
  });

  it("uses canonical for home path", () => {
    const alt = buildLanguageAlternates("/");
    expect(alt.languages.en).toBe(alt.canonical);
  });
});
