import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyPayment } from "@/lib/services/payment.service";
import { createPayment, createSubscription, updateUserProfile } from "@/lib/db/queries";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment verification fields" }, { status: 400 });
    }

    const isValid = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    const payment = await createPayment({
      user_id: user.id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount: 0, // will be updated from webhook with actual amount
      currency: "INR",
      status: "completed",
    });

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription = await createSubscription({
      user_id: user.id,
      plan_id: "pro",
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
    });

    await updateUserProfile(user.id, { plan: "pro" });

    return NextResponse.json({
      success: true,
      payment_id: payment.id,
      subscription_id: subscription.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
