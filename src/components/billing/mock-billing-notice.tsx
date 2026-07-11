"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useTranslation } from "@/i18n";
import { isMockCheckoutClient } from "@/lib/payment/checkout-config";

export function MockBillingNotice({ className }: { className?: string }) {
  const { t } = useTranslation();
  if (!isMockCheckoutClient()) return null;

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-950",
        className
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
      <p>{t("billingPanel.mockNotice")}</p>
    </div>
  );
}
