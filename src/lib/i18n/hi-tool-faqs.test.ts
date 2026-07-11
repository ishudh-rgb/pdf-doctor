import { describe, expect, it } from "vitest";
import hi from "@/i18n/hi.json";
import { TOOLS } from "@/config/constants";

describe("hi toolFaqs coverage", () => {
  it("includes Hindi FAQs for all tool slugs", () => {
    const faqs = hi.toolFaqs as Record<string, unknown[]>;
    for (const tool of TOOLS) {
      expect(faqs[tool.slug], `missing Hindi FAQs for ${tool.slug}`).toBeDefined();
      expect(faqs[tool.slug]?.length).toBeGreaterThan(0);
    }
  });
});
