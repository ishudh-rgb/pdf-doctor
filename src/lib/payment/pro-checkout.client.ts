"use client";

import { openRazorpayCheckout } from "@/lib/payment/razorpay-client";
import { isRazorpayCheckoutConfigured } from "@/lib/payment/checkout-config";

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
      error: "Online checkout is not configured yet. Please contact support.",
    };
  }

  const orderRes = await fetch("/api/payments/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  };

  if (!orderRes.ok || !orderJson.order_id || orderJson.amount == null) {
    return {
      success: false,
      error: orderJson.error ?? "Could not start checkout. Please try again.",
    };
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
      onDismiss: () => {
        resolve({ success: false, error: "Checkout cancelled." });
      },
    }).catch(() => {
      resolve({ success: false, error: "Could not open payment window. Try again." });
    });
  });
}
