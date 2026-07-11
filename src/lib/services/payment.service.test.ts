import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/billing/billing-config", () => ({
  isMockBillingMode: vi.fn(),
}));

import { isMockBillingMode } from "@/lib/billing/billing-config";
import {
  getRazorpayPlanId,
  isRazorpaySubscriptionEnabled,
} from "@/lib/services/payment.service";

describe("payment.service plan helpers", () => {
  const env = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...env };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = env;
  });

  it("returns mock plan ids in mock billing mode", async () => {
    vi.mocked(isMockBillingMode).mockReturnValue(true);
    expect(getRazorpayPlanId("monthly")).toBe("plan_mock_monthly");
    expect(getRazorpayPlanId("yearly")).toBe("plan_mock_yearly");
  });

  it("reads live Razorpay plan ids from env", async () => {
    vi.mocked(isMockBillingMode).mockReturnValue(false);
    process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID = "plan_live_monthly";
    process.env.RAZORPAY_PRO_YEARLY_PLAN_ID = "plan_live_yearly";

    expect(getRazorpayPlanId("monthly")).toBe("plan_live_monthly");
    expect(getRazorpayPlanId("yearly")).toBe("plan_live_yearly");
  });

  it("reports subscription billing configured when plan ids exist", async () => {
    vi.mocked(isMockBillingMode).mockReturnValue(false);
    process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID = "plan_live_monthly";
    expect(isRazorpaySubscriptionEnabled()).toBe(true);
  });

  it("reports subscription billing unavailable without plan ids", async () => {
    vi.mocked(isMockBillingMode).mockReturnValue(false);
    delete process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID;
    delete process.env.RAZORPAY_PRO_YEARLY_PLAN_ID;
    expect(isRazorpaySubscriptionEnabled()).toBe(false);
  });
});
