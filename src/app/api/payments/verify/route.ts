import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyPayment } from "@/lib/services/payment.service";
import {
  createSubscription,
  getPaymentByRazorpayOrderId,
  getPaymentByRazorpayPaymentId,
  getPlanUuidByName,
  incrementCouponUsage,
  updatePayment,
  updateUserProfile,
} from "@/lib/db/queries";
import { checkAuthRateLimit, rateLimitResponse } from "@/lib/server/rate-limiter";
import { toSafeApiError } from "@/lib/server/safe-error";

export async function POST(request: NextRequest) {
  try {
    const rate = checkAuthRateLimit(request);
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment verification fields" }, { status: 400 });
    }

    const existingByPayment = await getPaymentByRazorpayPaymentId(razorpay_payment_id);
    if (existingByPayment) {
      if (existingByPayment.user_id === user.id && existingByPayment.status === "completed") {
        return NextResponse.json({ success: true, already_verified: true });
      }
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    const pendingOrder = await getPaymentByRazorpayOrderId(razorpay_order_id);
    if (!pendingOrder) {
      return NextResponse.json({ error: "Unknown order" }, { status: 400 });
    }

    if (pendingOrder.user_id !== user.id) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 403 });
    }

    if (pendingOrder.status === "completed") {
      return NextResponse.json({ success: true, already_verified: true });
    }

    if (pendingOrder.status !== "pending") {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    const isValid = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
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
      user_id: user.id,
      plan_id: planUuid,
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
    });

    const payment = await updatePayment(pendingOrder.id, {
      razorpay_payment_id,
      razorpay_signature,
      status: "completed",
      subscription_id: subscription.id,
    });

    await updateUserProfile(user.id, {
      plan: "pro",
      plan_expires_at: periodEnd.toISOString(),
    });

    if (pendingOrder.coupon_code) {
      await incrementCouponUsage(pendingOrder.coupon_code);
    }

    return NextResponse.json({
      success: true,
      payment_id: payment.id,
      subscription_id: subscription.id,
    });
  } catch (err) {
    return NextResponse.json(
      { error: toSafeApiError(err, "Payment verification failed") },
      { status: 500 }
    );
  }
}
