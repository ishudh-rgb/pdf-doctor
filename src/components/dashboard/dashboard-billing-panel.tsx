"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Loader2, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";
import { useAuthContext } from "@/components/providers/auth-provider";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  amountInr: number;
  taxInr: number;
  status: string;
  issuedAt: string;
};

type BillingInfo = {
  plan: "free" | "pro";
  planExpiresAt: string | null;
  billingMode: string;
  subscription: {
    autoRenew: boolean;
    cancelAtPeriodEnd: boolean;
    cancelledAt: string | null;
    currentPeriodEnd: string | null;
    razorpaySubscriptionId: string | null;
  } | null;
};

export function DashboardBillingPanel() {
  const { t } = useTranslation();
  const { isPro, refreshProfile } = useAuthContext();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [billingRes, invoicesRes] = await Promise.all([
        fetch("/api/user/billing", { credentials: "include", cache: "no-store" }),
        fetch("/api/user/invoices", { credentials: "include", cache: "no-store" }),
      ]);

      if (billingRes.ok) {
        setBilling((await billingRes.json()) as BillingInfo);
      }
      if (invoicesRes.ok) {
        const data = (await invoicesRes.json()) as { invoices?: InvoiceRow[] };
        setInvoices(data.invoices ?? []);
      }
    } catch {
      setError(t("billingPanel.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isPro) void load();
  }, [isPro, load]);

  async function handleCancelSubscription() {
    if (!window.confirm(t("billingPanel.cancelConfirm"))) return;

    setCancelling(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/payments/verify-subscription", {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("billingPanel.cancelFailed"));
      setMessage(t("billingPanel.cancelSuccess"));
      await refreshProfile();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("billingPanel.cancelFailed"));
    } finally {
      setCancelling(false);
    }
  }

  if (!isPro) return null;

  const expiresLabel = billing?.planExpiresAt
    ? new Date(billing.planExpiresAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <section className="rounded-3xl border border-pd-border/70 bg-pd-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-pd-foreground">{t("billingPanel.title")}</h2>
          <p className="mt-1 text-sm text-pd-muted">{t("billingPanel.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-pd-border px-3 py-1.5 text-xs font-semibold text-pd-muted hover:text-pd-brand"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t("billingPanel.refresh")}
        </button>
      </div>

      {billing?.billingMode === "mock" && (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {t("billingPanel.mockNotice")}
        </p>
      )}

      {message && (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-pd-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("billingPanel.loading")}
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-pd-border/60 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-pd-muted">
                {t("billingPanel.planLabel")}
              </p>
              <p className="mt-1 text-lg font-bold text-pd-foreground">Pro</p>
              {expiresLabel && (
                <p className="mt-1 text-xs text-pd-muted">
                  {billing?.subscription?.cancelAtPeriodEnd
                    ? t("billingPanel.accessUntil", { date: expiresLabel })
                    : t("billingPanel.renewsOn", { date: expiresLabel })}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-pd-border/60 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-pd-muted">
                {t("billingPanel.autoRenewLabel")}
              </p>
              <p className="mt-1 text-lg font-bold text-pd-foreground">
                {billing?.subscription?.autoRenew
                  ? t("billingPanel.autoRenewOn")
                  : billing?.subscription?.cancelAtPeriodEnd
                    ? t("billingPanel.autoRenewOff")
                    : t("billingPanel.oneTimePlan")}
              </p>
              {billing?.subscription?.autoRenew && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  disabled={cancelling}
                  onClick={() => void handleCancelSubscription()}
                >
                  {cancelling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {t("billingPanel.cancelSubscription")}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-pd-foreground">
              <FileText className="h-4 w-4 text-pd-brand" />
              {t("billingPanel.invoicesTitle")}
            </h3>
            {invoices.length === 0 ? (
              <p className="mt-2 text-sm text-pd-muted">{t("billingPanel.noInvoices")}</p>
            ) : (
              <ul className="mt-3 divide-y divide-pd-border/60 rounded-2xl border border-pd-border/60">
                {invoices.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-pd-foreground">{inv.invoiceNumber}</p>
                      <p className="text-xs text-pd-muted">
                        {new Date(inv.issuedAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        · ₹{inv.amountInr.toLocaleString("en-IN")} ({t("billingPanel.gstIncluded")})
                      </p>
                    </div>
                    <a
                      href={`/api/user/invoices/${inv.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-pd-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-pd-brand-hover"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {t("billingPanel.downloadPdf")}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
