import { describe, expect, it } from "vitest";
import {
  HI_PREFIX,
  localeFromPathname,
  pathnameHasHindiPrefix,
  stripLocalePrefix,
  withLocalePrefix,
} from "@/lib/i18n/locale-path";

describe("locale-path", () => {
  it("detects Hindi prefix", () => {
    expect(pathnameHasHindiPrefix("/hi")).toBe(true);
    expect(pathnameHasHindiPrefix("/hi/pricing")).toBe(true);
    expect(pathnameHasHindiPrefix("/pricing")).toBe(false);
  });

  it("strips Hindi prefix", () => {
    expect(stripLocalePrefix("/hi")).toBe("/");
    expect(stripLocalePrefix("/hi/pricing")).toBe("/pricing");
    expect(stripLocalePrefix("/pricing")).toBe("/pricing");
  });

  it("adds Hindi prefix", () => {
    expect(withLocalePrefix("/", "hi")).toBe(HI_PREFIX);
    expect(withLocalePrefix("/pricing", "hi")).toBe("/hi/pricing");
    expect(withLocalePrefix("/hi/pricing", "en")).toBe("/pricing");
  });

  it("derives locale from pathname", () => {
    expect(localeFromPathname("/hi/terms")).toBe("hi");
    expect(localeFromPathname("/terms")).toBe("en");
  });
});
