import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fulfillPendingPayment } from "@/lib/services/payment-fulfillment.service";
import { getPaymentByRazorpayOrderId } from "@/lib/db/queries";
import { checkAuthRateLimit, rateLimitResponse } from "@/lib/server/rate-limiter";
import { toSafeApiError, captureApiError } from "@/lib/server/safe-error";

export async function POST(request: NextRequest) {
  try {
    const rate = await checkAuthRateLimit(request);
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

    const pendingOrder = await getPaymentByRazorpayOrderId(razorpay_order_id);

    if (!pendingOrder) {
      return NextResponse.json({ error: "Unknown order" }, { status: 400 });
    }

    if (pendingOrder.user_id !== user.id) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 403 });
    }

    const result = await fulfillPendingPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount: pendingOrder.amount != null ? Number(pendingOrder.amount) : undefined,
      requireSignature: true,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      already_verified: result.already_verified,
      payment_id: result.payment_id,
      subscription_id: result.subscription_id,
    });
  } catch (err) {
    captureApiError(err, { route: "payments/verify" });
    return NextResponse.json(
      { error: toSafeApiError(err, "Payment verification failed") },
      { status: 500 }
    );
  }
}
