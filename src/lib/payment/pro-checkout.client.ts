"use client";

import { openRazorpayCheckout, openRazorpaySubscriptionCheckout } from "@/lib/payment/razorpay-client";
import {
  getCheckoutUnavailableMessage,
  isRazorpayCheckoutConfigured,
  isRazorpaySubscriptionCheckoutConfigured,
} from "@/lib/payment/checkout-config";

export type ProBillingDuration = "monthly" | "yearly";

export async function startProCheckout(params: {
  duration: ProBillingDuration;
  userName?: string;
  userEmail?: string;
  couponCode?: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  if (!isRazorpayCheckoutConfigured()) {
    return {
      success: false,
      error: getCheckoutUnavailableMessage(),
    };
  }

  if (isRazorpaySubscriptionCheckoutConfigured()) {
    const subResult = await startSubscriptionCheckout(params);
    if (subResult.success || subResult.error !== "subscription_fallback") {
      return subResult;
    }
  }

  return startOneTimeCheckout(params);
}

async function completeMockCheckout(body: Record<string, unknown>) {
  const res = await fetch("/api/payments/mock-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { error?: string; success?: boolean };
  if (!res.ok || !json.success) {
    return { success: false as const, error: json.error ?? "Mock checkout failed." };
  }
  return { success: true as const };
}

async function startSubscriptionCheckout(params: {
  duration: ProBillingDuration;
  userName?: string;
  userEmail?: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const subRes = await fetch("/api/payments/create-subscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ duration: params.duration }),
  });

  const subJson = (await subRes.json()) as {
    error?: string;
    subscription_id?: string;
    amount?: number;
    mock?: boolean;
  };

  if (!subRes.ok || !subJson.subscription_id) {
    return { success: false, error: subJson.error ?? "subscription_fallback" };
  }

  if (subJson.mock) {
    return completeMockCheckout({
      type: "subscription",
      razorpay_subscription_id: subJson.subscription_id,
      duration: params.duration,
    });
  }

  return new Promise((resolve) => {
    void openRazorpaySubscriptionCheckout({
      subscriptionId: subJson.subscription_id!,
      userName: params.userName,
      userEmail: params.userEmail,
      onSuccess: async (response) => {
        try {
          const verifyRes = await fetch("/api/payments/verify-subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_payment_id: response.razorpay_payment_id,
            }),
          });
          const verifyJson = (await verifyRes.json()) as { error?: string; success?: boolean };
          if (!verifyRes.ok || !verifyJson.success) {
            resolve({
              success: false,
              error: verifyJson.error ?? "Subscription verification failed.",
            });
            return;
          }
          resolve({ success: true });
        } catch {
          resolve({ success: false, error: "Subscription verification failed." });
        }
      },
      onDismiss: () => resolve({ success: false, error: "Checkout cancelled." }),
    }).catch(() => resolve({ success: false, error: "Could not open payment window." }));
  });
}

async function startOneTimeCheckout(params: {
  duration: ProBillingDuration;
  userName?: string;
  userEmail?: string;
  couponCode?: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const orderRes = await fetch("/api/payments/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      plan: "pro",
      duration: params.duration,
      ...(params.couponCode ? { couponCode: params.couponCode } : {}),
    }),
  });

  const orderJson = (await orderRes.json()) as {
    error?: string;
    order_id?: string;
    amount?: number;
    currency?: string;
    mock?: boolean;
    duration?: ProBillingDuration;
  };

  if (!orderRes.ok || !orderJson.order_id || orderJson.amount == null) {
    return {
      success: false,
      error: orderJson.error ?? "Could not start checkout. Please try again.",
    };
  }

  if (orderJson.mock) {
    return completeMockCheckout({
      type: "order",
      razorpay_order_id: orderJson.order_id,
      duration: params.duration,
    });
  }

  return new Promise((resolve) => {
    void openRazorpayCheckout({
      orderId: orderJson.order_id!,
      amount: orderJson.amount!,
      currency: orderJson.currency ?? "INR",
      userName: params.userName,
      userEmail: params.userEmail,
      onSuccess: async (response) => {
        try {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyJson = (await verifyRes.json()) as { error?: string; success?: boolean };
          if (!verifyRes.ok || !verifyJson.success) {
            resolve({
              success: false,
              error: verifyJson.error ?? "Payment verification failed. Contact support if charged.",
            });
            return;
          }
          resolve({ success: true });
        } catch {
          resolve({
            success: false,
            error: "Payment verification failed. Contact support if you were charged.",
          });
        }
      },
      onDismiss: () => resolve({ success: false, error: "Checkout cancelled." }),
    }).catch(() => resolve({ success: false, error: "Could not open payment window. Try again." }));
  });
}
