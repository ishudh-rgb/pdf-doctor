"use client";

import Link from "next/link";
import { AlertTriangle, Crown } from "lucide-react";
import { useAuthContext } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";

const RENEWAL_WINDOW_DAYS = 14;

export function ProRenewalBanner() {
  const { profile, isPro } = useAuthContext();

  if (!profile?.plan_expires_at) return null;

  const expires = new Date(profile.plan_expires_at);
  if (!Number.isFinite(expires.getTime())) return null;

  const msLeft = expires.getTime() - Date.now();
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

  if (daysLeft > RENEWAL_WINDOW_DAYS) return null;

  const expired = msLeft <= 0;
  const show = isPro || expired || profile.plan === "pro";
  if (!show) return null;

  return (
    <div
      className={`mb-6 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
        expired
          ? "border-amber-300 bg-amber-50"
          : "border-pd-brand/30 bg-pd-brand-muted/40"
      }`}
    >
      <div className="flex items-start gap-3">
        {expired ? (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        ) : (
          <Crown className="mt-0.5 h-5 w-5 shrink-0 text-pd-brand" />
        )}
        <div>
          <p className="text-sm font-semibold text-pd-foreground">
            {expired ? "Your Pro plan has expired" : `Pro renews in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
          </p>
          <p className="mt-0.5 text-xs text-pd-muted">
            {expired
              ? "Renew to restore Pro limits, Sign PDF, and AI tools."
              : `Expires ${expires.toLocaleDateString()} — renew early to avoid interruption.`}
          </p>
        </div>
      </div>
      <Link href="/dashboard/pricing">
        <Button size="sm" className="w-full sm:w-auto">
          {expired ? "Renew Pro" : "Manage plan"}
        </Button>
      </Link>
    </div>
  );
}
