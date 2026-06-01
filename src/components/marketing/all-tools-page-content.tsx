"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { MarketingPageShell } from "@/components/layout/marketing-page-shell";
import { ToolsFilterGrid } from "@/components/marketing/tools-filter-grid";
import { TOOL_KEYS } from "@/components/marketing/home/home-shared";

export function AllToolsPageContent() {
  const { t } = useTranslation();
  const totalTools = TOOL_KEYS.length;

  return (
    <MarketingPageShell
      title={t("allTools.pageTitle")}
      description={t("allTools.pageDesc")}
      eyebrow={t("allTools.eyebrow")}
      heroStyle="centered"
      breadcrumbs={[
        { label: t("nav.home"), href: "/" },
        { label: t("allTools.breadcrumb") },
      ]}
    >
      <div className="rounded-2xl border border-pd-border bg-pd-surface p-5 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 border-b border-pd-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-pd-foreground">
              {t("allTools.totalLabel", { count: String(totalTools) })}
            </p>
            <p className="mt-1 text-sm text-pd-muted">{t("allTools.hint")}</p>
          </div>
          <Link href="/ai-pdf-summarizer" className="shrink-0">
            <Button variant="outline" size="sm">
              <Sparkles className="h-4 w-4" />
              {t("landing.heroCtaSecondary")}
            </Button>
          </Link>
        </div>

        <ToolsFilterGrid ariaLabel={t("allTools.pageTitle")} />
      </div>

      <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl bg-pd-brand-muted px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="font-semibold text-pd-foreground">{t("allTools.ctaTitle")}</p>
          <p className="mt-1 text-sm text-pd-muted">{t("allTools.ctaDesc")}</p>
        </div>
        <Link href="/">
          <Button>
            {t("allTools.ctaButton")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </MarketingPageShell>
  );
}
