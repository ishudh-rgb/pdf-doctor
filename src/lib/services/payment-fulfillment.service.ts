import {
  createSubscription,
  getPaymentByRazorpayOrderId,
  getPaymentByRazorpayPaymentId,
  getPlanUuidByName,
  incrementCouponUsage,
  updatePayment,
  updateUserProfile,
} from "@/lib/db/queries";
import { verifyPayment } from "@/lib/services/payment.service";

export type FulfillPaymentInput = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature?: string | null;
  payment_method?: string | null;
  amount?: number | null;
  requireSignature?: boolean;
};

export type FulfillPaymentResult =
  | { ok: true; already_verified: boolean; payment_id?: string; subscription_id?: string }
  | { ok: false; status: number; error: string };

export async function fulfillPendingPayment(
  input: FulfillPaymentInput
): Promise<FulfillPaymentResult> {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    payment_method,
    amount,
    requireSignature = false,
  } = input;

  const existingByPayment = await getPaymentByRazorpayPaymentId(razorpay_payment_id);
  if (existingByPayment?.status === "completed") {
    return { ok: true, already_verified: true };
  }

  const pendingOrder = await getPaymentByRazorpayOrderId(razorpay_order_id);
  if (!pendingOrder) {
    return { ok: false, status: 400, error: "Unknown order" };
  }

  if (pendingOrder.status === "completed") {
    return { ok: true, already_verified: true };
  }

  if (pendingOrder.status !== "pending") {
    return { ok: false, status: 400, error: "Payment verification failed" };
  }

  if (requireSignature) {
    if (!razorpay_signature) {
      return { ok: false, status: 400, error: "Missing payment verification fields" };
    }
    const isValid = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return { ok: false, status: 400, error: "Payment verification failed" };
    }
  }

  const duration = pendingOrder.plan_duration === "yearly" ? "yearly" : "monthly";
  const periodEnd = new Date();
  if (duration === "yearly") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  const planUuid = await getPlanUuidByName(pendingOrder.plan_name || "pro");

  const subscription = await createSubscription({
    user_id: pendingOrder.user_id,
    plan_id: planUuid,
    status: "active",
    current_period_start: new Date().toISOString(),
    current_period_end: periodEnd.toISOString(),
  });

  const payment = await updatePayment(pendingOrder.id, {
    razorpay_payment_id,
    razorpay_signature: razorpay_signature ?? null,
    status: "completed",
    subscription_id: subscription.id,
    ...(amount != null ? { amount } : {}),
    ...(payment_method ? { payment_method } : {}),
  });

  await updateUserProfile(pendingOrder.user_id, {
    plan: "pro",
    plan_expires_at: periodEnd.toISOString(),
  });

  if (pendingOrder.coupon_code) {
    await incrementCouponUsage(pendingOrder.coupon_code);
  }

  return {
    ok: true,
    already_verified: false,
    payment_id: payment.id,
    subscription_id: subscription.id,
  };
}
