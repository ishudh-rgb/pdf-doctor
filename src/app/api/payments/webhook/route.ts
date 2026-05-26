import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/services/payment.service";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const isValid = verifyWebhookSignature(body, signature);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    const eventType = event.event;
    const payload = event.payload;

    const supabase = await createServiceClient();

    switch (eventType) {
      case "payment.captured": {
        const paymentEntity = payload.payment?.entity;
        if (!paymentEntity) break;

        const { error } = await supabase
          .from("payments")
          .update({
            status: "completed",
            amount: paymentEntity.amount,
            payment_method: paymentEntity.method || null,
          })
          .eq("razorpay_order_id", paymentEntity.order_id);

        if (error) {
          console.error("Failed to update payment on capture:", error.message);
        }
        break;
      }

      case "subscription.cancelled": {
        const subscriptionEntity = payload.subscription?.entity;
        if (!subscriptionEntity) break;

        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("razorpay_subscription_id", subscriptionEntity.id)
          .single();

        if (sub) {
          await supabase
            .from("subscriptions")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("razorpay_subscription_id", subscriptionEntity.id);

          await supabase
            .from("user_profiles")
            .update({ plan: "free", updated_at: new Date().toISOString() })
            .eq("id", sub.user_id);
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
