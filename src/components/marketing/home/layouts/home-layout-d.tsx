"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/marketing/section-heading";
import {
  AISection,
  CTASection,
  FAQSection,
  HeroCopy,
  PricingSection,
  SecuritySection,
  ToolsGrid,
  WorkflowSection,
} from "@/components/marketing/home/home-sections";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";

/** Layout D — Notion-style: narrow centered column, calm stacked cards */
export function HomeLayoutD() {
  const { t } = useTranslation();

  return (
    <div className="layout-calm-cards bg-pd-background">
      <section className="pd-section pt-16 sm:pt-24">
        <div className="pd-container max-w-2xl">
          <HeroCopy align="center" />
        </div>
      </section>

      <section id="tools" className="pd-section">
        <div className="pd-container max-w-2xl">
          <div className="pd-card rounded-2xl border border-pd-border bg-pd-surface p-6 sm:p-8">
            <SectionHeading
              eyebrow={t("landing.toolsEyebrow")}
              title={t("landing.toolsTitle")}
              description={t("landing.toolsDesc")}
              align="left"
            />
            <div className="mt-8">
              <ToolsGrid columns="list" compact />
            </div>
            <Link href="/all-tools" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-pd-brand">
              {t("landing.toolsViewAll")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="pd-section">
        <div className="pd-container max-w-2xl space-y-6">
          <div className="pd-card rounded-2xl border border-pd-border bg-pd-surface p-6 sm:p-8">
            <SectionHeading
              eyebrow={t("landing.workflowEyebrow")}
              title={t("landing.workflowTitle")}
              description={t("landing.workflowDesc")}
              align="left"
            />
          </div>
        </div>
      </section>

      <div className="pd-container max-w-2xl">
        <AISection />
      </div>

      <SecuritySection variant="cards" />

      <section className="pd-section">
        <div className="pd-container max-w-2xl">
          <PricingSection centered />
        </div>
      </section>

      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </div>
  );
}
