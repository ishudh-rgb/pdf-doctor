"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { StatsBar } from "@/components/marketing/stats-bar";
import { SectionHeading } from "@/components/marketing/section-heading";
import {
  AISection,
  CTASection,
  FAQSection,
  HeroCopy,
  PopularToolChips,
  PricingSection,
  SecuritySection,
  ToolsGrid,
  WorkflowSection,
} from "@/components/marketing/home/home-sections";

/** Layout E — Expert mix: balanced hero + tools + trust (recommended default) */
export function HomeLayoutE() {
  const { t } = useTranslation();

  return (
    <>
      <section className="relative overflow-hidden bg-pd-background">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-pd-brand/10 blur-3xl"
        />
        <div className="pd-container relative pb-8 pt-16 lg:pb-12 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <HeroCopy align="left" />
            <HeroVisual />
          </div>
          <div className="mt-10 hidden lg:block">
            <PopularToolChips />
          </div>
        </div>
        <StatsBar />
      </section>

      <WorkflowSection />

      <section id="tools" className="bg-pd-surface pd-section sm:py-28">
        <div className="pd-container">
          <SectionHeading
            eyebrow={t("landing.toolsEyebrow")}
            title={t("landing.toolsTitle")}
            description={t("landing.toolsDesc")}
          />
          <div className="mt-14">
            <ToolsGrid />
          </div>
          <div className="mt-10 text-center">
            <Link href="/all-tools">
              <Button variant="outline" size="md">
                {t("landing.toolsViewAll")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <AISection split />
      <SecuritySection />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
