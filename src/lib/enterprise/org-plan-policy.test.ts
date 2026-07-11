import { describe, expect, it } from "vitest";
import {
  isOrgPlanActiveForApiKeys,
  isOrgPlanActiveForMemberAccess,
  isOrgPlanExpired,
} from "@/lib/enterprise/org-plan-policy";

describe("org-plan-policy", () => {
  const future = new Date(Date.now() + 86400000).toISOString();
  const past = new Date(Date.now() - 86400000).toISOString();

  it("detects expired org plans", () => {
    expect(isOrgPlanExpired({ plan_status: "active", plan_expires_at: past })).toBe(true);
    expect(isOrgPlanExpired({ plan_status: "active", plan_expires_at: future })).toBe(false);
  });

  it("allows member access for active and past_due until expiry", () => {
    expect(
      isOrgPlanActiveForMemberAccess({ plan_status: "past_due", plan_expires_at: future })
    ).toBe(true);
    expect(
      isOrgPlanActiveForMemberAccess({ plan_status: "past_due", plan_expires_at: past })
    ).toBe(false);
  });

  it("allows API keys only for active org plans", () => {
    expect(
      isOrgPlanActiveForApiKeys({ plan_status: "past_due", plan_expires_at: future })
    ).toBe(false);
    expect(
      isOrgPlanActiveForApiKeys({ plan_status: "active", plan_expires_at: future })
    ).toBe(true);
  });
});
