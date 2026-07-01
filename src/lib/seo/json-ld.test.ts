import { describe, expect, it } from "vitest";
import { pricingProProductJsonLd, webSiteJsonLd } from "@/lib/seo/json-ld";

describe("webSiteJsonLd", () => {
  it("does not include broken SearchAction", () => {
    const data = webSiteJsonLd() as Record<string, unknown>;
    expect(data.potentialAction).toBeUndefined();
    expect(data.inLanguage).toBe("en");
  });
});

describe("pricingProProductJsonLd", () => {
  it("includes monthly and yearly INR offers", () => {
    const data = pricingProProductJsonLd() as {
      offers: Array<{ price: string; priceCurrency: string }>;
    };
    expect(data.offers).toHaveLength(2);
    expect(data.offers[0].priceCurrency).toBe("INR");
    expect(data.offers.some((o) => o.price === "299")).toBe(true);
    expect(data.offers.some((o) => o.price === "2399")).toBe(true);
  });
});
