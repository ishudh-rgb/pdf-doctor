import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/billing/billing-config", () => ({
  isMockBillingMode: vi.fn(() => false),
}));

vi.mock("@/lib/billing/mock-billing.service", () => ({
  isMockPaymentId: vi.fn((id: string) => id.startsWith("pay_mock_")),
  isMockSubscriptionId: vi.fn((id: string) => id.startsWith("sub_mock_")),
}));

const fetchPayment = vi.fn();

vi.mock("razorpay", () => ({
  default: vi.fn().mockImplementation(() => ({
    payments: { fetch: fetchPayment },
  })),
}));

import { verifyRazorpaySubscriptionPaymentBinding } from "@/lib/services/payment.service";

describe("verifyRazorpaySubscriptionPaymentBinding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RAZORPAY_KEY_ID = "rzp_test";
    process.env.RAZORPAY_KEY_SECRET = "secret";
  });

  it("accepts captured payments bound to the subscription", async () => {
    fetchPayment.mockResolvedValue({
      id: "pay_live_1",
      status: "captured",
      subscription_id: "sub_live_1",
      amount: 29900,
      method: "upi",
    });

    const result = await verifyRazorpaySubscriptionPaymentBinding("pay_live_1", "sub_live_1");
    expect(result).toEqual({
      ok: true,
      amountPaise: 29900,
      paymentMethod: "upi",
    });
  });

  it("rejects payments tied to a different subscription", async () => {
    fetchPayment.mockResolvedValue({
      id: "pay_live_1",
      status: "captured",
      subscription_id: "sub_other",
      amount: 29900,
    });

    const result = await verifyRazorpaySubscriptionPaymentBinding("pay_live_1", "sub_live_1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("does not belong");
      expect(result.status).toBe(400);
    }
  });

  it("rejects uncaptured payments", async () => {
    fetchPayment.mockResolvedValue({
      id: "pay_live_1",
      status: "authorized",
      subscription_id: "sub_live_1",
    });

    const result = await verifyRazorpaySubscriptionPaymentBinding("pay_live_1", "sub_live_1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Payment not captured");
    }
  });

  it("rejects payments without a subscription link", async () => {
    fetchPayment.mockResolvedValue({
      id: "pay_live_1",
      status: "captured",
      subscription_id: null,
      amount: 29900,
    });

    const result = await verifyRazorpaySubscriptionPaymentBinding("pay_live_1", "sub_live_1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("not linked");
      expect(result.status).toBe(400);
    }
  });
});
