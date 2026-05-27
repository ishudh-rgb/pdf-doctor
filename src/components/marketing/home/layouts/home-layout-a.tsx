"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { StatsBar } from "@/components/marketing/stats-bar";
import { SectionHeading } from "@/components/marketing/section-heading";
import {
  AISection,
  CTASection,
  FAQSection,
  PricingSection,
  SecuritySection,
  ToolsGrid,
  UploadFirstHero,
  WorkflowSection,
} from "@/components/marketing/home/home-sections";

/** Layout A — Smallpdf-style: tools-first, minimal hero, dense grid */
export function HomeLayoutA() {
  const { t } = useTranslation();

  return (
    <>
      <UploadFirstHero />
      <StatsBar />

      <section id="tools" className="bg-pd-background pd-section">
        <div className="pd-container">
          <SectionHeading
            eyebrow={t("landing.toolsEyebrow")}
            title={t("landing.toolsTitle")}
            description={t("landing.toolsDesc")}
          />
          <div className="mt-10">
            <ToolsGrid columns="dense" />
          </div>
          <div className="mt-8 text-center">
            <Link href="/all-tools">
              <Button variant="outline">{t("landing.toolsViewAll")}</Button>
            </Link>
          </div>
        </div>
      </section>

      <WorkflowSection />
      <SecuritySection variant="cards" />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
