"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Trash2, Shield, Cookie } from "lucide-react";
import { DashboardMobileNav } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  CONSENT_STORAGE_KEY,
  defaultConsentAcceptAll,
  defaultConsentReject,
} from "@/lib/privacy/consent";
import { applyConsent } from "@/lib/privacy/consent-client";

export default function DashboardSettingsPage() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleExport() {
    setExporting(true);
    setMessage("");
    try {
      const res = await fetch("/api/user/account");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `onlymypdf-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage("Data export downloaded.");
    } catch {
      setMessage("Could not export data. Try again or contact support.");
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Delete your OnlyMyPDF account permanently? This removes your profile, files, and job history. Payment records may be retained as required by law."
    );
    if (!confirmed) return;

    setDeleting(true);
    setMessage("");
    try {
      const res = await fetch("/api/user/account", { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Deletion failed");
      router.push("/");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Account deletion failed.");
      setDeleting(false);
    }
  }

  function resetCookiePrefs() {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    document.cookie = "pd_consent=;path=/;max-age=0";
    setMessage("Cookie preferences cleared. Refresh the page to see the banner again.");
  }

  return (
    <div className="space-y-6">
      <DashboardMobileNav />

      <div>
        <Link
          href="/dashboard"
          className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-pd-muted hover:text-pd-brand"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to overview
        </Link>
        <h1 className="text-2xl font-bold text-pd-foreground">Privacy & data</h1>
        <p className="mt-1 text-sm text-pd-muted">
          Manage your GDPR rights: export, erasure, and cookie preferences.
        </p>
      </div>

      {message ? (
        <p className="rounded-xl border border-pd-border bg-pd-surface px-4 py-3 text-sm text-pd-foreground">
          {message}
        </p>
      ) : null}

      <section className="rounded-2xl border border-pd-border bg-pd-surface p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Download className="mt-0.5 h-5 w-5 text-pd-brand" />
          <div className="flex-1">
            <h2 className="font-semibold text-pd-foreground">Download your data</h2>
            <p className="mt-1 text-sm text-pd-muted">
              Export profile, tool job metadata, and billing summary as JSON (GDPR portability).
            </p>
            <Button className="mt-3" onClick={() => void handleExport()} disabled={exporting}>
              {exporting ? "Preparing…" : "Export my data"}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-pd-border bg-pd-surface p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 h-5 w-5 text-pd-brand" />
          <div className="flex-1">
            <h2 className="font-semibold text-pd-foreground">Cookie preferences</h2>
            <p className="mt-1 text-sm text-pd-muted">
              Read our{" "}
              <Link href="/cookies" className="text-pd-brand hover:underline">
                Cookie Policy
              </Link>
              .
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void applyConsent(defaultConsentAcceptAll()).then(() => {
                    setMessage("Analytics and marketing cookies accepted.");
                  });
                }}
              >
                Accept all cookies
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void applyConsent(defaultConsentReject()).then(() => {
                    setMessage("Non-essential cookies rejected.");
                  });
                }}
              >
                Reject non-essential
              </Button>
              <Button variant="outline" size="sm" onClick={resetCookiePrefs}>
                Reset banner
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
        <div className="flex items-start gap-3">
          <Trash2 className="mt-0.5 h-5 w-5 text-red-600" />
          <div className="flex-1">
            <h2 className="font-semibold text-red-900">Delete account</h2>
            <p className="mt-1 text-sm text-red-800/90">
              Permanently erase your account and associated files. This cannot be undone.
            </p>
            <Button
              variant="outline"
              className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => void handleDeleteAccount()}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete my account"}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm">
        <div className="flex gap-2">
          <Shield className="h-4 w-4 shrink-0 text-emerald-600" />
          <p className="text-emerald-900">
            Questions? Email{" "}
            <a href="mailto:privacy@onlymypdf.com" className="font-medium underline">
              privacy@onlymypdf.com
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
