"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { SectionHeading } from "@/components/marketing/section-heading";
import {
  AISection,
  CTASection,
  FAQSection,
  PricingSection,
  SecuritySection,
  ToolsByCategory,
  WizardSteps,
} from "@/components/marketing/home/home-sections";

/** Layout C — Adobe-style: bold visual hero, wizard steps, tabbed categories */
export function HomeLayoutC() {
  const { t } = useTranslation();

  return (
    <>
      <section className="relative overflow-hidden bg-pd-brand pd-section pb-20 pt-16 text-white sm:pb-28 sm:pt-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]"
        />
        <div className="pd-container relative text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            {t("landing.heroBadge")}
          </span>
          <h1 className="pd-display mx-auto mt-6 max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {t("landing.heroTitle")}{" "}
            <span className="text-white/90">{t("landing.heroTitleHighlight")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/85">{t("landing.heroSubtitle")}</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="#tools">
              <Button size="lg" variant="secondary" className="bg-white text-pd-brand hover:bg-white/90">
                {t("landing.heroCtaPrimary")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/ai-pdf-summarizer">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                {t("landing.heroCtaSecondary")}
              </Button>
            </Link>
          </div>
          <div className="mx-auto mt-14 max-w-3xl">
            <HeroVisual />
          </div>
        </div>
      </section>

      <section className="border-b border-pd-border bg-pd-surface py-10">
        <div className="pd-container">
          <WizardSteps />
        </div>
      </section>

      <section id="tools" className="pd-section sm:py-28">
        <div className="pd-container">
          <SectionHeading
            eyebrow={t("landing.toolsEyebrow")}
            title={t("landing.toolsTitle")}
            description={t("landing.toolsDesc")}
          />
          <div className="mt-12 rounded-2xl border border-pd-border bg-pd-background p-6 sm:p-10">
            <ToolsByCategory />
          </div>
        </div>
      </section>

      <AISection />
      <SecuritySection variant="cards" />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
