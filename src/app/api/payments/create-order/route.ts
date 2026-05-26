import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOrder } from "@/lib/services/payment.service";
import { getCouponCode } from "@/lib/db/queries";

const PLAN_PRICES = {
  pro: {
    monthly: 29900,
    yearly: 249900,
  },
} as const;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { plan, duration, couponCode } = await request.json();

    if (!plan || !duration) {
      return NextResponse.json({ error: "Plan and duration are required" }, { status: 400 });
    }

    if (plan !== "pro") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (duration !== "monthly" && duration !== "yearly") {
      return NextResponse.json({ error: "Duration must be 'monthly' or 'yearly'" }, { status: 400 });
    }

    let amount = PLAN_PRICES[plan as keyof typeof PLAN_PRICES][duration as "monthly" | "yearly"];
    let discountApplied = 0;

    if (couponCode) {
      const coupon = await getCouponCode(couponCode);
      if (!coupon) {
        return NextResponse.json({ error: "Invalid or expired coupon code" }, { status: 400 });
      }

      discountApplied = Math.round(amount * (coupon.discount_percent / 100));
      amount = amount - discountApplied;
    }

    const receipt = `order_${user.id}_${Date.now()}`;
    const order = await createOrder(amount, "INR", receipt);

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      plan,
      duration,
      discount_applied: discountApplied,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
