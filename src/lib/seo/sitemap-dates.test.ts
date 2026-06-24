import { describe, expect, it } from "vitest";
import {
  sitemapLastModifiedForAeo,
  sitemapLastModifiedForMarketing,
  sitemapLastModifiedForTools,
} from "@/lib/seo/sitemap-dates";

describe("sitemapLastModified", () => {
  it("returns stable dates for marketing routes", () => {
    const home = sitemapLastModifiedForMarketing("");
    const contact = sitemapLastModifiedForMarketing("/contact");
    expect(home.getFullYear()).toBeGreaterThanOrEqual(2026);
    expect(contact.getTime()).toBeGreaterThan(0);
  });

  it("returns stable dates for tools and aeo", () => {
    expect(sitemapLastModifiedForTools().getFullYear()).toBeGreaterThanOrEqual(2026);
    expect(sitemapLastModifiedForAeo().getFullYear()).toBeGreaterThanOrEqual(2026);
  });
});
