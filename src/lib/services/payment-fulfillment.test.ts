import { describe, expect, it, vi, beforeEach } from "vitest";
import { fulfillPendingPayment } from "@/lib/services/payment-fulfillment.service";

vi.mock("@/lib/db/queries", () => ({
  getPaymentByRazorpayPaymentId: vi.fn(),
  getPaymentByRazorpayOrderId: vi.fn(),
  getPlanUuidByName: vi.fn(),
  createSubscription: vi.fn(),
  updatePayment: vi.fn(),
  updateUserProfile: vi.fn(),
  incrementCouponUsage: vi.fn(),
}));

vi.mock("@/lib/services/payment.service", () => ({
  verifyPayment: vi.fn(() => true),
}));

import {
  getPaymentByRazorpayPaymentId,
  getPaymentByRazorpayOrderId,
  getPlanUuidByName,
  createSubscription,
  updatePayment,
  updateUserProfile,
} from "@/lib/db/queries";

describe("fulfillPendingPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPaymentByRazorpayPaymentId).mockResolvedValue(null);
    vi.mocked(getPaymentByRazorpayOrderId).mockResolvedValue({
      id: "pay-1",
      user_id: "user-1",
      status: "pending",
      amount: 29900,
      plan_name: "pro",
      plan_duration: "monthly",
      coupon_code: null,
    } as never);
    vi.mocked(getPlanUuidByName).mockResolvedValue("plan-uuid");
    vi.mocked(createSubscription).mockResolvedValue({ id: "sub-1" } as never);
    vi.mocked(updatePayment).mockResolvedValue({ id: "pay-1" } as never);
    vi.mocked(updateUserProfile).mockResolvedValue(undefined as never);
  });

  it("rejects amount mismatch from webhook", async () => {
    const result = await fulfillPendingPayment({
      razorpay_order_id: "order_1",
      razorpay_payment_id: "pay_1",
      amount: 100,
      requireSignature: false,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Payment amount mismatch");
      expect(result.status).toBe(400);
    }
  });

  it("fulfills when amount matches pending order", async () => {
    const result = await fulfillPendingPayment({
      razorpay_order_id: "order_1",
      razorpay_payment_id: "pay_1",
      amount: 29900,
      requireSignature: false,
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.already_verified).toBe(false);
  });
});
