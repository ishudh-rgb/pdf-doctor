import { describe, expect, it } from "vitest";
import { computeFileExpiresAt, fileRetentionHoursForPlan } from "./retention";

describe("fileRetentionHoursForPlan", () => {
  it("returns 24h for pro", () => {
    expect(fileRetentionHoursForPlan("pro")).toBe(24);
  });

  it("returns default for free", () => {
    expect(fileRetentionHoursForPlan("free")).toBeGreaterThan(0);
  });
});

describe("computeFileExpiresAt", () => {
  it("returns ISO date in the future", () => {
    const expires = new Date(computeFileExpiresAt(2)).getTime();
    expect(expires).toBeGreaterThan(Date.now());
  });
});
