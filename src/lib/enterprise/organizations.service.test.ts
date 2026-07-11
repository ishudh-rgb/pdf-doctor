import { describe, expect, it } from "vitest";

import { clampSeatLimit } from "@/lib/enterprise/organizations.service";
import { TEAM_PRICING } from "@/config/constants";

describe("clampSeatLimit", () => {
  it("defaults to TEAM_PRICING.defaultSeatLimit", () => {
    expect(clampSeatLimit()).toBe(TEAM_PRICING.defaultSeatLimit);
  });

  it("clamps inflated client values to default seat limit", () => {
    expect(clampSeatLimit(999)).toBe(TEAM_PRICING.defaultSeatLimit);
  });

  it("floors fractional values and enforces minimum of 1", () => {
    expect(clampSeatLimit(2.9)).toBe(2);
    expect(clampSeatLimit(0)).toBe(1);
  });
});
