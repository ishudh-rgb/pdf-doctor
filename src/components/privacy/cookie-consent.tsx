"use client";



import { useEffect, useState } from "react";

import Link from "next/link";

import { X, Cookie } from "lucide-react";

import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  defaultConsentAcceptAll,
  defaultConsentReject,
  type CookieConsentState,
} from "@/lib/privacy/consent";

import { applyConsent } from "@/lib/privacy/consent-client";

import { useFocusTrap } from "@/lib/a11y/use-focus-trap";



export function CookieConsentBanner() {

  const [visible, setVisible] = useState(false);

  const [showPrefs, setShowPrefs] = useState(false);

  const [analytics, setAnalytics] = useState(false);

  const [marketing, setMarketing] = useState(false);

  const dialogRef = useFocusTrap(visible);



  useEffect(() => {

    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);

    if (!stored) {

      setVisible(true);

      return;

    }

    try {

      const parsed = JSON.parse(stored) as CookieConsentState;

      if (parsed.version !== CONSENT_VERSION) setVisible(true);

    } catch {

      setVisible(true);

    }

  }, []);



  useEffect(() => {

    if (!visible) return;

    function onKeyDown(e: KeyboardEvent) {

      if (e.key === "Escape") {

        void finish(defaultConsentReject());

      }

    }

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);

  }, [visible]);



  async function finish(state: CookieConsentState) {

    await applyConsent(state);

    setVisible(false);

    setShowPrefs(false);

  }



  if (!visible) return null;



  return (

    <div

      ref={dialogRef}

      role="dialog"

      aria-modal="true"

      aria-labelledby="cookie-consent-title"

      className="fixed inset-x-0 bottom-0 z-[100] border-t border-pd-border bg-pd-surface p-4 shadow-2xl sm:p-5"

    >

      <div className="pd-container max-w-4xl">

        <div className="flex items-start gap-3">

          <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-pd-brand" aria-hidden />

          <div className="min-w-0 flex-1">

            <h2 id="cookie-consent-title" className="text-sm font-bold text-pd-foreground">

              Cookie & privacy preferences

            </h2>

            <p className="mt-1 text-xs leading-relaxed text-pd-muted sm:text-sm">

              OnlyMyPDF uses essential cookies to run the site securely. Optional analytics and

              marketing cookies are off until you choose otherwise. See our{" "}

              <Link href="/cookies" className="font-medium text-pd-brand hover:underline">

                Cookie Policy

              </Link>{" "}

              and{" "}

              <Link href="/privacy" className="font-medium text-pd-brand hover:underline">

                Privacy Policy

              </Link>

              .

            </p>



            {showPrefs ? (

              <div className="mt-3 space-y-2 rounded-xl border border-pd-border bg-pd-background p-3 text-sm">

                <label className="flex items-center justify-between gap-3">

                  <span>

                    <span className="font-medium text-pd-foreground">Essential</span>

                    <span className="block text-xs text-pd-muted">Required for security and login</span>

                  </span>

                  <input type="checkbox" checked disabled className="h-4 w-4" />

                </label>

                <label className="flex items-center justify-between gap-3">

                  <span>

                    <span className="font-medium text-pd-foreground">Analytics</span>

                    <span className="block text-xs text-pd-muted">Help us improve tools (optional)</span>

                  </span>

                  <input

                    type="checkbox"

                    checked={analytics}

                    onChange={(e) => setAnalytics(e.target.checked)}

                    className="h-4 w-4 accent-pd-brand"

                  />

                </label>

                <label className="flex items-center justify-between gap-3">

                  <span>

                    <span className="font-medium text-pd-foreground">Marketing</span>

                    <span className="block text-xs text-pd-muted">Personalized ads if enabled later</span>

                  </span>

                  <input

                    type="checkbox"

                    checked={marketing}

                    onChange={(e) => setMarketing(e.target.checked)}

                    className="h-4 w-4 accent-pd-brand"

                  />

                </label>

              </div>

            ) : null}



            <div className="mt-4 flex flex-wrap gap-2">

              <button

                type="button"

                onClick={() => void finish(defaultConsentAcceptAll())}

                className="rounded-lg bg-pd-brand px-4 py-2 text-xs font-semibold text-white hover:opacity-90"

              >

                Accept all

              </button>

              <button

                type="button"

                onClick={() => void finish(defaultConsentReject())}

                className="rounded-lg border border-pd-border px-4 py-2 text-xs font-semibold text-pd-foreground hover:bg-pd-background"

              >

                Reject non-essential

              </button>

              <button

                type="button"

                onClick={() => {

                  if (showPrefs) {

                    void finish({

                      version: CONSENT_VERSION,

                      essential: true,

                      analytics,

                      marketing,

                      decidedAt: new Date().toISOString(),

                    });

                  } else {

                    setShowPrefs(true);

                  }

                }}

                className="rounded-lg border border-pd-border px-4 py-2 text-xs font-semibold text-pd-muted hover:bg-pd-background"

              >

                {showPrefs ? "Save preferences" : "Customize"}

              </button>

            </div>

          </div>

          <button

            type="button"

            onClick={() => void finish(defaultConsentReject())}

            className="shrink-0 rounded-lg p-1 text-pd-muted hover:bg-pd-background"

            aria-label="Dismiss and reject non-essential cookies"

          >

            <X className="h-4 w-4" />

          </button>

        </div>

      </div>

    </div>

  );

}


