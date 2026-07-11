import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatRelativeDate,
  truncateText,
} from "./format";

describe("format utils", () => {
  it("formats ISO dates", () => {
    expect(formatDate("2026-01-15T00:00:00.000Z")).toMatch(/15 Jan 2026/);
    expect(formatDate(new Date("2026-06-01T12:00:00.000Z"), "yyyy")).toBe("2026");
  });

  it("formats relative dates", () => {
    const recent = new Date(Date.now() - 60_000).toISOString();
    expect(formatRelativeDate(recent)).toMatch(/minute/);
  });

  it("formats currency and numbers for en-IN", () => {
    expect(formatCurrency(299)).toMatch(/299/);
    expect(formatCurrency(1234.5, "USD")).toMatch(/1,234\.5|1,234/);
    expect(formatNumber(12847)).toMatch(/12,847/);
  });

  it("truncates long text with ellipsis", () => {
    expect(truncateText("hello", 10)).toBe("hello");
    expect(truncateText("hello world from pdf doctor", 12)).toBe("hello world…");
  });
});
