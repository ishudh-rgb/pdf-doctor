import { describe, expect, it } from "vitest";
import { isActivePro, isBlockedProfile, UserBlockedError } from "@/lib/auth/plan-access";

describe("plan-access", () => {
  it("treats pro without expiry as active", () => {
    expect(isActivePro({ plan: "pro" })).toBe(true);
  });

  it("expires pro when plan_expires_at is in the past", () => {
    expect(
      isActivePro({
        plan: "pro",
        plan_expires_at: new Date(Date.now() - 60_000).toISOString(),
      })
    ).toBe(false);
  });

  it("detects blocked profiles", () => {
    expect(isBlockedProfile({ is_blocked: true })).toBe(true);
    expect(isBlockedProfile({ is_blocked: false })).toBe(false);
  });

  it("UserBlockedError has stable name", () => {
    expect(new UserBlockedError().name).toBe("UserBlockedError");
  });
});
