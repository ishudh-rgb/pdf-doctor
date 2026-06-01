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
  PricingSection,
  SecuritySection,
  WorkflowSection,
} from "@/components/marketing/home/home-sections";
import { PopularToolsGrid } from "@/components/marketing/popular-tools-grid";
import { WhyChooseSection } from "@/components/marketing/why-choose-section";

/** Layout B — Stripe-style: split hero, category rows, live preview feel */
export function HomeLayoutB() {
  const { t } = useTranslation();

  return (
    <>
      <section className="relative overflow-hidden bg-pd-background pd-section pb-6 lg:pb-8">
        <div className="pd-container">
          <div className="pd-tool-grid grid items-center gap-12">
            <HeroCopy align="left" />
            <HeroVisual />
          </div>
        </div>
      </section>

      <section id="tools" className="border-t border-pd-border bg-pd-surface pd-section">
        <div className="pd-container">
          <SectionHeading
            eyebrow={t("landing.toolsEyebrow")}
            title={t("landing.toolsTitle")}
            description={t("landing.toolsDesc")}
          />
          <div className="mt-12">
            <PopularToolsGrid />
          </div>
          <div className="mt-10 text-center">
            <Link href="/all-tools">
              <Button variant="outline">
                {t("landing.toolsViewAll")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <WhyChooseSection />

      <StatsBar />

      <WorkflowSection />
      <AISection split />
      <SecuritySection />
      <PricingSection centered={false} />
      <FAQSection />
      <CTASection />
    </>
  );
}
