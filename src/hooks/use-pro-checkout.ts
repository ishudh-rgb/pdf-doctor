"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { startProCheckout, type ProBillingDuration } from "@/lib/payment/pro-checkout.client";

export function useProCheckout() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = useCallback(
    async (params: {
      duration: ProBillingDuration;
      userName?: string;
      userEmail?: string;
      couponCode?: string;
    }) => {
      setLoading(true);
      setError(null);
      const result = await startProCheckout(params);
      setLoading(false);
      if (result.success) {
        router.push("/dashboard?upgraded=1");
        router.refresh();
        return true;
      }
      setError(result.error);
      return false;
    },
    [router]
  );

  return { checkout, loading, error, clearError: () => setError(null) };
}
