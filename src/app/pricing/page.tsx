"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { MarketingPageShell } from "@/components/layout/marketing-page-shell";
const plans = [
  {
    name: "Free",
    tier: "free" as const,
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "5 tool uses per day",
      "Max 25 MB file size",
      "Basic PDF tools",
      "Standard processing speed",
      "Files deleted after 2 hours",
      "Community support",
    ],
    highlighted: false,
    cta: "Get Started Free",
    ctaHref: "/#tools",
  },
  {
    name: "Pro",
    tier: "pro" as const,
    monthlyPrice: 299,
    yearlyPrice: 2399,
    features: [
      "100 tool uses per day",
      "Max 200 MB file size",
      "All PDF tools including Edit & Sign",
      "AI PDF Summarizer",
      "Priority processing speed",
      "Files deleted after 24 hours",
      "No ads",
      "Priority email support",
      "Batch processing",
    ],
    highlighted: true,
    cta: "Upgrade to Pro",
    ctaHref: "/signup",
  },
];

const pricingFaqs = [
  {
    q: "What's included in the Free plan?",
    a: "The Free plan gives you access to basic PDF tools like merge, split, compress, and convert — up to 5 uses per day with a 25 MB file size limit.",
  },
  {
    q: "Can I switch from monthly to yearly billing?",
    a: "Yes! You can switch your billing cycle anytime from your dashboard. When switching to yearly, you'll be credited for any remaining days on your monthly plan.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit/debit cards, UPI, net banking, and wallets through Razorpay. All transactions are processed securely in INR.",
  },
  {
    q: "Is there a refund policy?",
    a: "Yes, we offer a 7-day money-back guarantee on Pro subscriptions. If you're not satisfied, contact our support team for a full refund.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Absolutely. You can cancel your Pro subscription at any time from your dashboard. You'll continue to have Pro access until the end of your current billing period.",
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <MarketingPageShell
      title="Simple, Transparent Pricing"
      description="Get started for free. Upgrade to Pro when you need more power."
      eyebrow="Pricing"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Pricing" }]}
    >
      <div className="text-center">
        <div className="inline-flex items-center rounded-full border border-pd-border bg-pd-background p-1">
          <button
            onClick={() => setIsYearly(false)}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-medium transition",
              !isYearly ? "bg-pd-surface text-pd-foreground shadow-sm" : "text-pd-muted"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-medium transition",
              isYearly ? "bg-pd-surface text-pd-foreground shadow-sm" : "text-pd-muted"
            )}
          >
            Yearly
            <span className="ml-1.5 rounded-full bg-pd-brand-muted px-2 py-0.5 text-xs font-semibold text-pd-brand">
              Save 33%
            </span>
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        {plans.map((plan) => {
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
          const period = isYearly ? "/year" : "/month";
          return (
            <div
              key={plan.tier}
              className={cn(
                "relative rounded-2xl p-8",
                plan.highlighted
                  ? "border-2 border-pd-brand bg-pd-surface shadow-lg"
                  : "border border-pd-border bg-pd-surface"
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-pd-brand px-4 py-0.5 text-xs font-bold text-white">
                  Popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-pd-foreground">{plan.name}</h3>
              <p className="mt-4">
                <span className="text-4xl font-extrabold text-pd-foreground">
                  {price === 0 ? "₹0" : `₹${price.toLocaleString("en-IN")}`}
                </span>
                <span className="ml-1 text-pd-muted">{period}</span>
              </p>
              <ul className="mt-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-pd-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-pd-brand" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.ctaHref} className="mt-8 block">
                <Button variant={plan.highlighted ? "default" : "outline"} className="w-full">
                  {plan.cta}
                </Button>
              </Link>
            </div>
          );
        })}
      </div>

      <section className="mt-16">
        <h2 className="text-center text-2xl font-bold text-pd-foreground">Pricing FAQ</h2>
        <div className="mt-8 divide-y divide-pd-border rounded-2xl border border-pd-border bg-pd-surface px-6">
          {pricingFaqs.map((faq) => (
            <details key={faq.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-pd-foreground [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span className="ml-4 shrink-0 text-pd-muted transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-pd-muted">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>
    </MarketingPageShell>
  );
}
