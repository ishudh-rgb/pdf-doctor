import {
  claimPaymentForFulfillment,
  createSubscription,
  finalizeClaimedPayment,
  getPaymentByRazorpayOrderId,
  getPaymentByRazorpayPaymentId,
  getPlanUuidByName,
  getUserProfile,
  getUserSubscription,
  incrementCouponUsage,
  releasePaymentClaim,
  updateSubscription,
  updateUserProfile,
} from "@/lib/db/queries";
import { isActivePro } from "@/lib/auth/plan-access";
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

type PaymentRow = NonNullable<Awaited<ReturnType<typeof getPaymentByRazorpayOrderId>>>;

async function fulfillClaimedOrder(
  claimed: PaymentRow,
  input: {
    razorpay_payment_id: string;
    razorpay_signature?: string | null;
    payment_method?: string | null;
    amount?: number | null;
  }
): Promise<FulfillPaymentResult> {
  const duration = claimed.plan_duration === "yearly" ? "yearly" : "monthly";
  const existingSub = await getUserSubscription(claimed.user_id);

  const periodEnd = new Date();
  const extendFrom =
    existingSub?.current_period_end &&
    new Date(existingSub.current_period_end) > new Date()
      ? new Date(existingSub.current_period_end)
      : new Date();
  periodEnd.setTime(extendFrom.getTime());

  if (duration === "yearly") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  const planUuid = await getPlanUuidByName(claimed.plan_name || "pro");

  const subscription = existingSub
    ? await updateSubscription(existingSub.id, {
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
    : await createSubscription({
        user_id: claimed.user_id,
        plan_id: planUuid,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
      });

  const payment = await finalizeClaimedPayment(claimed.id, {
    razorpay_payment_id: input.razorpay_payment_id,
    razorpay_signature: input.razorpay_signature ?? null,
    subscription_id: subscription.id,
    ...(input.amount != null ? { amount: input.amount } : {}),
    ...(input.payment_method ? { payment_method: input.payment_method } : {}),
  });

  if (!payment) {
    const profile = await getUserProfile(claimed.user_id);
    if (isActivePro(profile)) {
      return { ok: true, already_verified: true };
    }
    return { ok: false, status: 409, error: "Payment verification failed" };
  }

  await updateUserProfile(claimed.user_id, {
    plan: "pro",
    plan_expires_at: periodEnd.toISOString(),
  });

  if (claimed.coupon_code) {
    await incrementCouponUsage(claimed.coupon_code);
  }

  return {
    ok: true,
    already_verified: false,
    payment_id: payment.id,
    subscription_id: subscription.id,
  };
}

async function resumeProcessingPayment(
  order: PaymentRow,
  input: FulfillPaymentInput
): Promise<FulfillPaymentResult> {
  if (
    order.razorpay_payment_id &&
    order.razorpay_payment_id !== input.razorpay_payment_id
  ) {
    return { ok: false, status: 409, error: "Payment verification failed" };
  }

  const profile = await getUserProfile(order.user_id);
  if (isActivePro(profile) && order.status === "processing") {
    await finalizeClaimedPayment(order.id, {
      razorpay_payment_id: input.razorpay_payment_id,
      razorpay_signature: input.razorpay_signature ?? null,
      ...(input.amount != null ? { amount: input.amount } : {}),
      ...(input.payment_method ? { payment_method: input.payment_method } : {}),
    });
    return { ok: true, already_verified: true, payment_id: order.id };
  }

  try {
    return await fulfillClaimedOrder(order, input);
  } catch (err) {
    await releasePaymentClaim(order.id);
    throw err;
  }
}

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

  if (requireSignature) {
    if (!razorpay_signature) {
      return { ok: false, status: 400, error: "Missing payment verification fields" };
    }
    const isValid = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return { ok: false, status: 400, error: "Payment verification failed" };
    }
  }

  if (amount != null && pendingOrder.amount != null) {
    const expectedPaise = Math.round(Number(pendingOrder.amount));
    const capturedPaise = Math.round(Number(amount));
    if (expectedPaise !== capturedPaise) {
      return { ok: false, status: 400, error: "Payment amount mismatch" };
    }
  }

  if (pendingOrder.status === "processing") {
    return resumeProcessingPayment(pendingOrder, input);
  }

  if (pendingOrder.status !== "pending") {
    return { ok: false, status: 400, error: "Payment verification failed" };
  }

  const claimed = await claimPaymentForFulfillment(pendingOrder.id);
  if (!claimed) {
    const fresh = await getPaymentByRazorpayOrderId(razorpay_order_id);
    if (fresh?.status === "completed") {
      return { ok: true, already_verified: true };
    }
    if (fresh?.status === "processing") {
      return resumeProcessingPayment(fresh, input);
    }
    return { ok: false, status: 409, error: "Payment verification failed" };
  }

  try {
    return await fulfillClaimedOrder(claimed, {
      razorpay_payment_id,
      razorpay_signature,
      payment_method,
      amount,
    });
  } catch (err) {
    await releasePaymentClaim(claimed.id);
    throw err;
  }
}
