"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  X,
  ChevronRight,
  Zap,
  Crown,
  Shield,
  Lock,
  Timer,
  CreditCard,
  Users,
  Sparkles,
  Headphones,
  BadgeCheck,
  ArrowRight,
  Minus,
  IndianRupee,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";
import { useAuthContext } from "@/components/providers/auth-provider";
import { FREE_FEATURES, PRO_FEATURES } from "@/components/marketing/home/home-shared";

const PRO_MONTHLY = 299;
const PRO_YEARLY = 2399;

type CompareValue = "yes" | "no" | "text";

interface CompareRow {
  labelKey: string;
  free: CompareValue;
  pro: CompareValue;
  freeTextKey?: string;
  proTextKey?: string;
}

const COMPARE_ROWS: CompareRow[] = [
  { labelKey: "dailyUses", free: "text", pro: "text", freeTextKey: "dailyUsesFree", proTextKey: "dailyUsesPro" },
  { labelKey: "fileSize", free: "text", pro: "text", freeTextKey: "unlimited", proTextKey: "unlimited" },
  { labelKey: "basicTools", free: "yes", pro: "yes" },
  { labelKey: "convertTools", free: "yes", pro: "yes" },
  { labelKey: "signPdf", free: "no", pro: "yes" },
  { labelKey: "aiSummarizer", free: "no", pro: "yes" },
  { labelKey: "batchProcessing", free: "no", pro: "yes" },
  { labelKey: "processingSpeed", free: "text", pro: "text", freeTextKey: "speedStandard", proTextKey: "speedPriority" },
  { labelKey: "fileRetention", free: "text", pro: "text", freeTextKey: "retention2h", proTextKey: "retention24h" },
  { labelKey: "dashboardHistory", free: "yes", pro: "yes" },
  { labelKey: "ads", free: "text", pro: "text", freeTextKey: "adsYes", proTextKey: "adsNo" },
  { labelKey: "support", free: "text", pro: "text", freeTextKey: "supportCommunity", proTextKey: "supportPriority" },
];

const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"] as const;

const TRUST_PILLS = [
  { icon: Users, key: "trustUsers" },
  { icon: Shield, key: "trustSecure" },
  { icon: BadgeCheck, key: "trustNoHidden" },
] as const;

const TRUST_STRIP = [
  { icon: Lock, key: "stripEncrypt" },
  { icon: Timer, key: "stripAutoDelete" },
  { icon: CreditCard, key: "stripPayments" },
  { icon: RefreshCw, key: "stripCancel" },
] as const;

const BENEFIT_KEYS = ["benefit1", "benefit2", "benefit3", "benefit4"] as const;

function CompareCell({
  value,
  text,
}: {
  value: CompareValue;
  text?: string;
}) {
  if (value === "yes") {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
        <Check className="h-4 w-4 text-emerald-600" aria-hidden />
      </span>
    );
  }
  if (value === "no") {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
        <X className="h-4 w-4 text-slate-400" aria-hidden />
      </span>
    );
  }
  return (
    <span className="text-sm font-medium text-pd-foreground">{text ?? "—"}</span>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-2xl border border-pd-border/80 bg-white/80 backdrop-blur-sm transition hover:border-pd-brand/25 hover:shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-pd-foreground [&::-webkit-details-marker]:hidden">
        <span className="flex items-start gap-3">
          <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-pd-brand" aria-hidden />
          {question}
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pd-brand-muted text-lg font-light text-pd-brand transition group-open:rotate-45">
          +
        </span>
      </summary>
      <p className="border-t border-pd-border/60 px-5 pb-5 pt-4 text-sm leading-relaxed text-pd-muted">
        {answer}
      </p>
    </details>
  );
}

export function PricingPageContent() {
  const { t } = useTranslation();
  const { user, isPro, loading: authLoading } = useAuthContext();
  const [isYearly, setIsYearly] = useState(false);

  const proPrice = isYearly ? PRO_YEARLY : PRO_MONTHLY;
  const proPeriod = isYearly ? t("pricing.perYear") : t("pricing.perMonth");
  const monthlyEquivalent = isYearly ? Math.round(PRO_YEARLY / 12) : null;

  const freeCtaHref = user ? "/#tools" : "/#tools";
  const proCtaHref = user ? "/dashboard" : "/signup";

  return (
    <article className="pd-marketing-page bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_35%,#f8fafc_100%)]">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="border-b border-pd-border/80 bg-white/70 py-2 backdrop-blur-sm">
        <div className="pd-container">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-pd-muted">
            <li className="flex items-center gap-1">
              <Link href="/" className="transition hover:text-pd-brand">
                {t("pricing.page.breadcrumbHome")}
              </Link>
            </li>
            <li className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              <span className="font-medium text-pd-foreground">{t("pricing.page.breadcrumbPricing")}</span>
            </li>
          </ol>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-pd-border/60 py-12 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-pd-brand/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-violet-400/10 blur-3xl"
        />
        <div className="pd-container relative max-w-4xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-pd-brand/20 bg-pd-brand-muted/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-pd-brand">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t("pricing.page.eyebrow")}
          </p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-pd-foreground sm:text-4xl lg:text-5xl">
            {t("pricing.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-pd-muted sm:text-lg">
            {t("pricing.page.heroDesc")}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {TRUST_PILLS.map(({ icon: Icon, key }) => (
              <span
                key={key}
                className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm"
              >
                <Icon className="h-4 w-4 text-pd-brand" aria-hidden />
                {t(`pricing.page.${key}`)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-pd-border/60 bg-white/60 py-4 backdrop-blur-sm">
        <div className="pd-container">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {TRUST_STRIP.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="flex items-center gap-2.5 rounded-xl border border-pd-border/60 bg-white/80 px-3 py-2.5 sm:px-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pd-brand-muted">
                  <Icon className="h-4 w-4 text-pd-brand" aria-hidden />
                </div>
                <p className="text-xs font-semibold leading-snug text-pd-foreground sm:text-[13px]">
                  {t(`pricing.page.${key}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="pd-container max-w-6xl pb-16 pt-10">
        {/* Billing toggle */}
        <div className="flex justify-center">
          <div className="inline-flex items-center rounded-full border border-pd-border bg-white/90 p-1 shadow-sm backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={cn(
                "rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200",
                !isYearly
                  ? "bg-pd-brand text-white shadow-md shadow-pd-brand/25"
                  : "text-pd-muted hover:text-pd-foreground"
              )}
            >
              {t("pricing.monthly")}
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={cn(
                "flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200",
                isYearly
                  ? "bg-pd-brand text-white shadow-md shadow-pd-brand/25"
                  : "text-pd-muted hover:text-pd-foreground"
              )}
            >
              {t("pricing.yearly")}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  isYearly ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
                )}
              >
                {t("pricing.yearlyDiscount")}
              </span>
            </button>
          </div>
        </div>

        {isYearly && (
          <p className="mt-3 text-center text-sm text-pd-muted">
            {t("pricing.page.yearlyNote", { amount: monthlyEquivalent?.toLocaleString("en-IN") ?? "200" })}
          </p>
        )}

        {/* Pricing cards */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Free */}
          <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)]">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/70 via-white to-white" aria-hidden />
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl" aria-hidden />
            <div className="relative flex flex-1 flex-col p-7 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200/50">
                  <Zap className="h-6 w-6 text-white" aria-hidden />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-pd-foreground">{t("pricing.page.freeName")}</h2>
                  <p className="text-sm text-pd-muted">{t("pricing.page.freeTagline")}</p>
                </div>
              </div>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tight text-pd-foreground">₹0</span>
                <span className="text-pd-muted">{t("pricing.perMonth")}</span>
              </div>
              <p className="mt-2 text-sm text-emerald-700">{t("pricing.page.noCardRequired")}</p>

              <div className="my-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

              <ul className="space-y-3">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-pd-muted">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <Check className="h-3 w-3 text-emerald-600" aria-hidden />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {!authLoading && user && !isPro ? (
                  <div className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                    <BadgeCheck className="h-4 w-4" aria-hidden />
                    {t("pricing.currentPlan")}
                  </div>
                ) : null}
                <Link href={freeCtaHref} className="block">
                  <Button
                    variant="outline"
                    className="h-12 w-full rounded-xl border-2 text-base font-semibold transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    {t("pricing.getStarted")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Pro */}
          <div className="group relative flex flex-col overflow-hidden rounded-3xl border-2 border-pd-brand/40 bg-white shadow-[0_8px_32px_-8px_rgba(37,99,235,0.2)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_-12px_rgba(37,99,235,0.25)]">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-white" aria-hidden />
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-blue-400/15 blur-2xl" aria-hidden />
            <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
              {t("pricing.mostPopular")}
            </span>
            <div className="relative flex flex-1 flex-col p-7 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200/50">
                  <Crown className="h-6 w-6 text-white" aria-hidden />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-pd-foreground">{t("pricing.page.proName")}</h2>
                  <p className="text-sm text-pd-muted">{t("pricing.page.proTagline")}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-5xl font-extrabold tracking-tight text-pd-foreground">
                  ₹{proPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-pd-muted">{proPeriod}</span>
                {isYearly && monthlyEquivalent && (
                  <span className="w-full text-sm font-medium text-pd-brand">
                    ≈ ₹{monthlyEquivalent.toLocaleString("en-IN")}{t("pricing.perMonth")} {t("pricing.page.billedYearly")}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-pd-brand">{t("pricing.page.gstNote")}</p>

              <div className="my-6 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

              <ul className="space-y-3">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-pd-muted">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <Check className="h-3 w-3 text-blue-600" aria-hidden />
                    </span>
                    {f}
                  </li>
                ))}
                <li className="flex items-start gap-3 text-sm text-pd-muted">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Check className="h-3 w-3 text-blue-600" aria-hidden />
                  </span>
                  {t("pricing.page.proExtra1")}
                </li>
                <li className="flex items-start gap-3 text-sm text-pd-muted">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Check className="h-3 w-3 text-blue-600" aria-hidden />
                  </span>
                  {t("pricing.page.proExtra2")}
                </li>
              </ul>

              <div className="mt-8">
                {!authLoading && isPro ? (
                  <Button disabled className="h-12 w-full rounded-xl text-base font-semibold">
                    {t("pricing.currentPlan")}
                  </Button>
                ) : (
                  <Link href={proCtaHref} className="block">
                    <Button className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-base font-semibold shadow-lg shadow-blue-200/60 transition-all hover:shadow-xl hover:shadow-blue-300/50">
                      {t("pricing.upgrade")}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comparison table */}
        <section className="mt-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-pd-foreground sm:text-3xl">
              {t("pricing.page.compareTitle")}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-pd-muted">{t("pricing.page.compareDesc")}</p>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border border-pd-border/80 bg-white/90 shadow-sm backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-pd-border bg-slate-50/80">
                    <th className="px-5 py-4 text-sm font-bold text-pd-foreground sm:px-6">
                      {t("pricing.features")}
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-emerald-700">
                      {t("pricing.page.freeName")}
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-pd-brand">
                      {t("pricing.page.proName")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row, i) => (
                    <tr
                      key={row.labelKey}
                      className={cn(
                        "border-b border-pd-border/60 transition hover:bg-pd-brand-muted/30",
                        i === COMPARE_ROWS.length - 1 && "border-b-0"
                      )}
                    >
                      <td className="px-5 py-4 text-sm font-medium text-pd-foreground sm:px-6">
                        {t(`pricing.page.compare.${row.labelKey}`)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <CompareCell
                          value={row.free}
                          text={row.freeTextKey ? t(`pricing.page.compare.${row.freeTextKey}`) : undefined}
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <CompareCell
                          value={row.pro}
                          text={row.proTextKey ? t(`pricing.page.compare.${row.proTextKey}`) : undefined}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Why upgrade */}
        <section className="mt-16">
          <h2 className="text-center text-2xl font-bold text-pd-foreground">{t("pricing.page.whyTitle")}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFIT_KEYS.map((key) => (
              <div
                key={key}
                className="rounded-2xl border border-pd-border/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-pd-brand/30 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pd-brand-muted">
                  {key === "benefit1" && <Sparkles className="h-5 w-5 text-pd-brand" aria-hidden />}
                  {key === "benefit2" && <Timer className="h-5 w-5 text-pd-brand" aria-hidden />}
                  {key === "benefit3" && <Headphones className="h-5 w-5 text-pd-brand" aria-hidden />}
                  {key === "benefit4" && <IndianRupee className="h-5 w-5 text-pd-brand" aria-hidden />}
                </div>
                <h3 className="mt-4 font-bold text-pd-foreground">{t(`pricing.page.${key}Title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-pd-muted">{t(`pricing.page.${key}Desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Guarantee */}
        <div className="mt-12 flex flex-col items-center gap-4 rounded-3xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 to-teal-50/90 px-6 py-8 text-center sm:flex-row sm:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-200/50">
            <BadgeCheck className="h-7 w-7 text-white" aria-hidden />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-pd-foreground">{t("pricing.page.guaranteeTitle")}</h3>
            <p className="mt-1 text-sm text-pd-muted">{t("pricing.page.guaranteeDesc")}</p>
          </div>
          <Link href="/contact" className="shrink-0">
            <Button variant="outline" className="rounded-xl border-emerald-300 bg-white/80 font-semibold hover:bg-emerald-50">
              {t("pricing.page.contactSupport")}
            </Button>
          </Link>
        </div>

        {/* FAQ */}
        <section className="mt-20">
          <h2 className="text-center text-2xl font-bold text-pd-foreground sm:text-3xl">
            {t("pricing.faq.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-pd-muted">{t("pricing.page.faqDesc")}</p>
          <div className="mt-8 space-y-3">
            {FAQ_KEYS.map((key) => (
              <FaqItem
                key={key}
                question={t(`pricing.page.faq.${key}`)}
                answer={t(`pricing.page.faq.a${key.slice(1)}`)}
              />
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative mt-16 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-6 py-12 text-center text-white shadow-xl shadow-indigo-300/30 sm:px-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl"
          />
          <h2 className="relative text-2xl font-bold sm:text-3xl">{t("pricing.page.ctaTitle")}</h2>
          <p className="relative mx-auto mt-3 max-w-lg text-white/85">{t("pricing.page.ctaDesc")}</p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/#tools">
              <Button
                size="lg"
                variant="secondary"
                className="rounded-xl bg-white px-8 font-semibold text-indigo-700 hover:bg-white/90"
              >
                {t("pricing.getStarted")}
              </Button>
            </Link>
            {!isPro && (
              <Link href={proCtaHref}>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-white/40 bg-transparent px-8 font-semibold text-white hover:bg-white/10"
                >
                  {t("pricing.upgrade")}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Button>
              </Link>
            )}
          </div>
        </section>
      </div>
    </article>
  );
}
