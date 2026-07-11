import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedSupabaseUser } from "@/lib/auth/get-api-user";
import { authGuardResponse } from "@/lib/server/auth-guard-http";
import {
  createRazorpaySubscription,
  getRazorpayPlanId,
  isRazorpaySubscriptionEnabled,
} from "@/lib/services/payment.service";
import { createPayment } from "@/lib/db/queries";
import { isMockBillingMode } from "@/lib/billing/billing-config";
import { guardMutationOrigin } from "@/lib/server/mutation-origin";
import { checkAuthRateLimit, rateLimitResponse } from "@/lib/server/rate-limiter";
import { toSafeApiError } from "@/lib/server/safe-error";
import { PRO_PRICING } from "@/config/constants";

export async function POST(request: NextRequest) {
  try {
    const originBlocked = guardMutationOrigin(request);
    if (originBlocked) return originBlocked;

    const rate = await checkAuthRateLimit(request);
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);

    if (!isRazorpaySubscriptionEnabled()) {
      return NextResponse.json(
        { error: "Auto-renew subscriptions are not configured. Use one-time checkout." },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const user = await getAuthenticatedSupabaseUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { duration } = await request.json();
    if (duration !== "monthly" && duration !== "yearly") {
      return NextResponse.json({ error: "Duration must be monthly or yearly" }, { status: 400 });
    }

    const planId = getRazorpayPlanId(duration);
    if (!planId) {
      return NextResponse.json({ error: "Subscription plan not configured" }, { status: 503 });
    }

    const totalCount = duration === "yearly" ? 10 : 120;
    const subscription = await createRazorpaySubscription({
      planId,
      totalCount,
      notes: {
        user_id: user.id,
        duration,
        plan: "pro",
      },
    });

    const amountInr =
      duration === "yearly" ? PRO_PRICING.yearlyInr : PRO_PRICING.monthlyInr;

    await createPayment({
      user_id: user.id,
      razorpay_subscription_id: subscription.id,
      amount: amountInr,
      currency: "INR",
      status: "pending",
      plan_name: "pro",
      plan_duration: duration,
      billing_mode: "subscription",
    });

    return NextResponse.json({
      subscription_id: subscription.id,
      amount: amountInr * 100,
      currency: "INR",
      duration,
      billing_mode: "subscription",
      mock: isMockBillingMode(),
    });
  } catch (err) {
    const guarded = authGuardResponse(err);
    if (guarded) return guarded;
    return NextResponse.json(
      { error: toSafeApiError(err, "Failed to create subscription") },
      { status: 500 }
    );
  }
}
