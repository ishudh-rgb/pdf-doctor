"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Timer,
  Shield,
  UserCheck,
  HardDrive,
  FileSearch,
  ListChecks,
  Zap,
  CalendarCheck,
  Check,
  Upload,
  Search,
} from "lucide-react";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { StatsBar } from "@/components/marketing/stats-bar";
import { SectionHeading } from "@/components/marketing/section-heading";
import {
  CATEGORY_FALLBACK_LABELS,
  FAQ_KEYS,
  FREE_FEATURES,
  ICON_MAP,
  PRO_FEATURES,
  TOOL_CATEGORIES,
  TOOL_KEYS,
} from "@/components/marketing/home/home-shared";

const WorkflowVisual = dynamic(
  () =>
    import("@/components/marketing/workflow-visual").then((m) => ({
      default: m.WorkflowVisual,
    })),
  { loading: () => <div className="h-48 animate-pulse rounded-2xl bg-pd-border/40" /> }
);

const AiSummaryVisual = dynamic(
  () =>
    import("@/components/marketing/ai-summary-visual").then((m) => ({
      default: m.AiSummaryVisual,
    })),
  { loading: () => <div className="mx-auto h-96 max-w-md animate-pulse rounded-2xl bg-pd-brand-muted" /> }
);

export function ToolsGrid({
  columns = "default",
  compact = false,
}: {
  columns?: "default" | "dense" | "list";
  compact?: boolean;
}) {
  const { t } = useTranslation();

  if (columns === "list") {
    return (
      <div className="space-y-2">
        {TOOL_KEYS.map((tool) => {
          const Icon = ICON_MAP[tool.icon];
          return (
            <Link
              key={tool.slug}
              href={`/${tool.slug}`}
              className="group flex items-center gap-4 rounded-xl border border-pd-border bg-pd-surface px-4 py-3 transition hover:border-pd-brand/30 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pd-brand-muted text-pd-brand">
                {Icon && <Icon className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-pd-foreground">{t(tool.nameKey)}</p>
                {!compact && (
                  <p className="truncate text-sm text-pd-muted">{t(tool.descKey)}</p>
                )}
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-pd-brand opacity-0 transition group-hover:opacity-100" />
            </Link>
          );
        })}
      </div>
    );
  }

  const gridClass =
    columns === "dense"
      ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      : "grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4";

  return (
    <div className={gridClass}>
      {TOOL_KEYS.map((tool) => {
        const Icon = ICON_MAP[tool.icon];
        return (
          <Link
            key={tool.slug}
            href={`/${tool.slug}`}
            className="tool-card-glow group relative rounded-2xl border border-pd-border bg-pd-surface p-4 shadow-sm sm:p-5"
          >
            {"isPro" in tool && tool.isPro && (
              <span className="absolute right-3 top-3 rounded-full bg-pd-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Pro
              </span>
            )}
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pd-brand-muted text-pd-brand transition-transform group-hover:scale-110">
              {Icon && <Icon className="h-5 w-5" />}
            </div>
            <h3 className="mt-3 font-semibold text-pd-foreground">{t(tool.nameKey)}</h3>
            {!compact && (
              <p className="mt-1 text-sm leading-relaxed text-pd-muted">{t(tool.descKey)}</p>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export function ToolsByCategory() {
  const { t } = useTranslation();

  return (
    <div className="space-y-10">
      {TOOL_CATEGORIES.map((cat) => {
        const tools = TOOL_KEYS.filter((tool) => tool.category === cat.id);
        if (tools.length === 0) return null;
        return (
          <div key={cat.id}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-pd-muted">
              {CATEGORY_FALLBACK_LABELS[cat.id]}
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => {
                const Icon = ICON_MAP[tool.icon];
                return (
                  <Link
                    key={tool.slug}
                    href={`/${tool.slug}`}
                    className="group flex items-center gap-3 rounded-xl border border-pd-border bg-pd-surface p-4 transition hover:border-pd-brand/40"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pd-brand-muted text-pd-brand">
                      {Icon && <Icon className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-pd-foreground">{t(tool.nameKey)}</p>
                      <p className="text-xs text-pd-muted">{t(tool.descKey)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PopularToolChips() {
  const { t } = useTranslation();
  const popular = ["merge-pdf", "compress-pdf", "pdf-to-word", "sign-pdf", "ai-pdf-summarizer"];

  return (
    <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
      {popular.map((slug) => {
        const tool = TOOL_KEYS.find((t) => t.slug === slug);
        if (!tool) return null;
        const Icon = ICON_MAP[tool.icon];
        return (
          <Link
            key={slug}
            href={`/${slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-pd-border bg-pd-surface px-4 py-2 text-sm font-medium text-pd-foreground transition hover:border-pd-brand hover:text-pd-brand"
          >
            {Icon && <Icon className="h-4 w-4 text-pd-brand" />}
            {t(tool.nameKey)}
          </Link>
        );
      })}
    </div>
  );
}

export function WorkflowSection() {
  const { t } = useTranslation();
  return (
    <section className="mesh-section pd-section sm:py-28">
      <div className="pd-container">
        <SectionHeading
          eyebrow={t("landing.workflowEyebrow")}
          title={t("landing.workflowTitle")}
          description={t("landing.workflowDesc")}
        />
        <div className="mt-16">
          <WorkflowVisual />
        </div>
      </div>
    </section>
  );
}

export function AISection({ split = false }: { split?: boolean }) {
  const { t } = useTranslation();

  const content = (
    <>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-pd-border bg-pd-surface px-3 py-1 text-xs font-semibold text-pd-brand">
        <Sparkles className="h-3.5 w-3.5" /> {t("landing.aiBadge")}
      </span>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-pd-foreground sm:text-4xl">
        {t("landing.aiTitle")}
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-pd-muted">{t("landing.aiDesc")}</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {[
          { icon: FileSearch, title: t("landing.aiFeature1Title"), desc: t("landing.aiFeature1Desc") },
          { icon: ListChecks, title: t("landing.aiFeature2Title"), desc: t("landing.aiFeature2Desc") },
          { icon: Zap, title: t("landing.aiFeature3Title"), desc: t("landing.aiFeature3Desc") },
          { icon: CalendarCheck, title: t("landing.aiFeature4Title"), desc: t("landing.aiFeature4Desc") },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-pd-border bg-pd-surface p-4">
            <f.icon className="h-5 w-5 text-pd-brand" />
            <h3 className="mt-2 text-sm font-semibold text-pd-foreground">{f.title}</h3>
            <p className="mt-0.5 text-xs text-pd-muted">{f.desc}</p>
          </div>
        ))}
      </div>
      <Link href="/ai-pdf-summarizer" className="mt-8 inline-block">
        <Button size="lg">
          {t("landing.aiCta")}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </>
  );

  if (split) {
    return (
      <section className="bg-pd-brand-muted pd-section sm:py-28">
        <div className="pd-container">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <AiSummaryVisual />
            </div>
            <div className="order-1 lg:order-2">{content}</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-pd-brand-muted pd-section sm:py-28">
      <div className="pd-container max-w-3xl">{content}</div>
    </section>
  );
}

export function SecuritySection({ variant = "dark" }: { variant?: "dark" | "cards" }) {
  const { t } = useTranslation();
  const items = [
    { icon: Timer, title: t("landing.security1Title"), desc: t("landing.security1Desc") },
    { icon: Shield, title: t("landing.security2Title"), desc: t("landing.security2Desc") },
    { icon: UserCheck, title: t("landing.security3Title"), desc: t("landing.security3Desc") },
    { icon: HardDrive, title: t("landing.security4Title"), desc: t("landing.security4Desc") },
  ];

  if (variant === "cards") {
    return (
      <section className="pd-section sm:py-28">
        <div className="pd-container">
          <SectionHeading
            eyebrow={t("landing.securityEyebrow")}
            title={t("landing.securityTitle")}
            description={t("landing.securityDesc")}
          />
          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {items.map((f) => (
              <div key={f.title} className="flex gap-4 rounded-2xl border border-pd-border bg-pd-surface p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pd-brand-muted text-pd-brand">
                  <f.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-pd-foreground">{f.title}</h3>
                  <p className="mt-1 text-sm text-pd-muted">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-dark pd-section sm:py-28">
      <div className="pd-container">
        <SectionHeading
          eyebrow={t("landing.securityEyebrow")}
          title={t("landing.securityTitle")}
          description={t("landing.securityDesc")}
          className="[&_h2]:text-white [&_p]:text-white/75 [&_span]:border-white/20 [&_span]:bg-white/10 [&_span]:text-white"
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                <f.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-4 font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingSection({ centered = true }: { centered?: boolean }) {
  const { t } = useTranslation();

  return (
    <section className="mesh-section pd-section sm:py-28">
      <div className={`pd-container ${centered ? "max-w-4xl" : ""}`}>
        <SectionHeading
          eyebrow={t("landing.pricingEyebrow")}
          title={t("landing.pricingTitle")}
          description={t("landing.pricingDesc")}
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-pd-border bg-pd-surface p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-pd-foreground">{t("landing.pricingFree")}</h3>
            <p className="mt-4">
              <span className="text-4xl font-extrabold text-pd-foreground">₹0</span>
              <span className="ml-1 text-pd-muted">{t("landing.pricingPerMonth")}</span>
            </p>
            <ul className="mt-6 space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-pd-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-pd-success" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="#tools" className="mt-8 block">
              <Button variant="outline" className="w-full">
                {t("landing.pricingFreeCta")}
              </Button>
            </Link>
          </div>
          <div className="relative rounded-2xl border-2 border-pd-brand bg-pd-surface p-8 shadow-lg">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-pd-brand px-4 py-0.5 text-xs font-bold text-white">
              {t("landing.pricingPopular")}
            </span>
            <h3 className="text-lg font-semibold text-pd-foreground">{t("landing.pricingPro")}</h3>
            <p className="mt-4">
              <span className="text-4xl font-extrabold text-pd-foreground">₹299</span>
              <span className="ml-1 text-pd-muted">{t("landing.pricingPerMonth")}</span>
            </p>
            <ul className="mt-6 space-y-3">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-pd-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-pd-brand" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/pricing" className="mt-8 block">
              <Button className="w-full">{t("landing.pricingProCta")}</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FAQSection() {
  const { t } = useTranslation();
  return (
    <section className="bg-pd-surface pd-section sm:py-28">
      <div className="pd-container max-w-3xl">
        <SectionHeading title={t("landing.faqTitle")} />
        <div className="mt-12 divide-y divide-pd-border rounded-2xl border border-pd-border bg-pd-background px-6">
          {FAQ_KEYS.map((key) => (
            <details key={key} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-pd-foreground [&::-webkit-details-marker]:hidden">
                {t(`landing.${key}q`)}
                <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pd-surface text-pd-muted shadow-sm transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-pd-muted">{t(`landing.${key}a`)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTASection() {
  const { t } = useTranslation();
  return (
    <section className="bg-pd-brand py-16 sm:py-20">
      <div className="pd-container max-w-4xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {t("landing.ctaTitle")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/85">{t("landing.ctaDesc")}</p>
        <Link href="#tools" className="mt-8 inline-block">
          <Button size="lg" variant="secondary" className="bg-white text-pd-brand hover:bg-white/90">
            {t("landing.ctaButton")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

export function HeroCopy({ align = "center" }: { align?: "center" | "left" }) {
  const { t } = useTranslation();
  return (
    <div className={align === "center" ? "text-center" : "text-center lg:text-left"}>
      <span className="inline-flex items-center gap-2 rounded-full border border-pd-border bg-pd-surface px-4 py-1.5 text-xs font-semibold text-pd-brand shadow-sm">
        <Sparkles className="h-3.5 w-3.5" />
        {t("landing.heroBadge")}
      </span>
      <h1 className="pd-display mt-6 text-4xl font-extrabold tracking-tight text-pd-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
        {t("landing.heroTitle")}{" "}
        <span className="text-pd-brand">{t("landing.heroTitleHighlight")}</span>
      </h1>
      <p className={`pd-prose mt-6 text-lg text-pd-muted ${align === "left" ? "lg:mx-0" : "mx-auto"}`}>
        {t("landing.heroSubtitle")}
      </p>
      <div
        className={`pd-hero-actions mt-10 flex flex-col items-center gap-4 sm:flex-row ${
          align === "left" ? "lg:justify-start" : "justify-center"
        }`}
      >
        <Link href="#tools">
          <Button size="lg">
            {t("landing.heroCtaPrimary")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/ai-pdf-summarizer">
          <Button variant="outline" size="lg">
            <Sparkles className="h-4 w-4" />
            {t("landing.heroCtaSecondary")}
          </Button>
        </Link>
      </div>
      <p className="mt-6 text-sm text-pd-muted">{t("landing.heroTrust")}</p>
    </div>
  );
}

export function UploadFirstHero() {
  const { t } = useTranslation();
  return (
    <section className="border-b border-pd-border bg-pd-surface pd-section">
      <div className="pd-container">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="pd-display text-3xl font-extrabold tracking-tight text-pd-foreground sm:text-4xl">
            {t("landing.heroTitle")}{" "}
            <span className="text-pd-brand">{t("landing.heroTitleHighlight")}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pd-muted">{t("landing.heroSubtitle")}</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pd-muted" />
              <input
                type="search"
                readOnly
                placeholder="Search tools: merge, compress, convert..."
                className="h-12 w-full rounded-xl border border-pd-border bg-pd-background pl-11 pr-4 text-sm text-pd-foreground"
                aria-label="Search PDF tools"
              />
            </div>
            <Link href="/merge-pdf">
              <Button size="lg">
                <Upload className="h-4 w-4" />
                {t("landing.heroCtaPrimary")}
              </Button>
            </Link>
          </div>
          <div className="mt-6">
            <PopularToolChips />
          </div>
        </div>
      </div>
    </section>
  );
}

export function WizardSteps() {
  const { t } = useTranslation();
  const steps = [
    { n: 1, title: t("landing.workflowUpload"), desc: t("landing.workflowUploadDesc") },
    { n: 2, title: t("landing.workflowProcess"), desc: t("landing.workflowProcessDesc") },
    { n: 3, title: t("landing.workflowDownload"), desc: t("landing.workflowDownloadDesc") },
  ];

  return (
    <div className="pd-step-bar">
      {steps.map((step, i) => (
        <div key={step.n} className="flex flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pd-brand text-sm font-bold text-white">
            {step.n}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-pd-foreground">{step.title}</p>
            <p className="text-xs text-pd-muted">{step.desc}</p>
          </div>
          {i < steps.length - 1 && (
            <div className="hidden h-px flex-1 bg-pd-border lg:block" aria-hidden />
          )}
        </div>
      ))}
    </div>
  );
}
