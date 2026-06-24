import { describe, expect, it } from "vitest";
import { webSiteJsonLd } from "@/lib/seo/json-ld";

describe("webSiteJsonLd", () => {
  it("does not include broken SearchAction", () => {
    const data = webSiteJsonLd() as Record<string, unknown>;
    expect(data.potentialAction).toBeUndefined();
    expect(data.inLanguage).toEqual(["en", "hi"]);
  });
});
