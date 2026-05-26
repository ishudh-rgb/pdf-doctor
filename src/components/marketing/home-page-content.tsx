"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Layers,
  Scissors,
  Minimize2,
  FileText,
  FileUp,
  Image as ImageIcon,
  Pencil,
  PenTool,
  Sparkles,
  ScanLine,
  Unlock,
  Lock,
  ArrowRight,
  Table,
  Presentation,
  FileSpreadsheet,
  Stamp,
  Timer,
  Shield,
  UserCheck,
  HardDrive,
  ListChecks,
  CalendarCheck,
  FileSearch,
  Zap,
  Check,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "@/i18n";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { StatsBar } from "@/components/marketing/stats-bar";
import { SectionHeading } from "@/components/marketing/section-heading";

const WorkflowVisual = dynamic(
  () =>
    import("@/components/marketing/workflow-visual").then((m) => ({
      default: m.WorkflowVisual,
    })),
  { loading: () => <div className="h-48 animate-pulse rounded-2xl bg-slate-100" /> }
);

const AiSummaryVisual = dynamic(
  () =>
    import("@/components/marketing/ai-summary-visual").then((m) => ({
      default: m.AiSummaryVisual,
    })),
  { loading: () => <div className="mx-auto h-96 max-w-md animate-pulse rounded-2xl bg-violet-50" /> }
);

const ICON_MAP: Record<string, LucideIcon> = {
  Layers,
  Scissors,
  Minimize2,
  FileText,
  FileUp,
  Image: ImageIcon,
  Pencil,
  PenTool,
  Sparkles,
  ScanLine,
  Unlock,
  Lock,
  Table,
  Presentation,
  FileSpreadsheet,
  Stamp,
};

const TOOL_KEYS = [
  { slug: "merge-pdf", icon: "Layers", color: "#4CAF50", nameKey: "tools.mergePdf.name", descKey: "tools.mergePdf.description" },
  { slug: "split-pdf", icon: "Scissors", color: "#2196F3", nameKey: "tools.splitPdf.name", descKey: "tools.splitPdf.description" },
  { slug: "compress-pdf", icon: "Minimize2", color: "#FF9800", nameKey: "tools.compressPdf.name", descKey: "tools.compressPdf.description" },
  { slug: "pdf-to-word", icon: "FileText", color: "#1565C0", nameKey: "tools.pdfToWord.name", descKey: "tools.pdfToWord.description" },
  { slug: "pdf-to-excel", icon: "Table", color: "#217346", nameKey: "tools.pdfToExcel.name", descKey: "tools.pdfToExcel.description" },
  { slug: "pdf-to-ppt", icon: "Presentation", color: "#D24726", nameKey: "tools.pdfToPpt.name", descKey: "tools.pdfToPpt.description" },
  { slug: "word-to-pdf", icon: "FileUp", color: "#C62828", nameKey: "tools.wordToPdf.name", descKey: "tools.wordToPdf.description" },
  { slug: "excel-to-pdf", icon: "FileSpreadsheet", color: "#217346", nameKey: "tools.excelToPdf.name", descKey: "tools.excelToPdf.description" },
  { slug: "ppt-to-pdf", icon: "Presentation", color: "#D24726", nameKey: "tools.pptToPdf.name", descKey: "tools.pptToPdf.description" },
  { slug: "jpg-to-pdf", icon: "Image", color: "#7B1FA2", nameKey: "tools.jpgToPdf.name", descKey: "tools.jpgToPdf.description" },
  { slug: "edit-pdf", icon: "Pencil", color: "#00897B", nameKey: "tools.editPdf.name", descKey: "tools.editPdf.description", isPro: true },
  { slug: "sign-pdf", icon: "PenTool", color: "#F57C00", nameKey: "tools.signPdf.name", descKey: "tools.signPdf.description", isPro: true },
  { slug: "add-watermark", icon: "Stamp", color: "#0891B2", nameKey: "tools.addWatermark.name", descKey: "tools.addWatermark.description" },
  { slug: "ai-pdf-summarizer", icon: "Sparkles", color: "#6A1B9A", nameKey: "tools.aiPdfSummarizer.name", descKey: "tools.aiPdfSummarizer.description", isPro: true },
  { slug: "pdf-scanner", icon: "ScanLine", color: "#455A64", nameKey: "tools.pdfScanner.name", descKey: "tools.pdfScanner.description" },
  { slug: "unlock-pdf", icon: "Unlock", color: "#D32F2F", nameKey: "tools.unlockPdf.name", descKey: "tools.unlockPdf.description" },
  { slug: "protect-pdf", icon: "Lock", color: "#1976D2", nameKey: "tools.protectPdf.name", descKey: "tools.protectPdf.description" },
] as const;

const FAQ_KEYS = ["faq1", "faq2", "faq3", "faq4", "faq5", "faq6", "faq7"] as const;

const FREE_FEATURES = [
  "5 tool uses per day",
  "Max 25 MB file size",
  "Basic PDF tools",
  "Standard processing speed",
  "Files deleted after 2 hours",
];

const PRO_FEATURES = [
  "100 tool uses per day",
  "Max 200 MB file size",
  "All PDF tools including Edit & Sign",
  "AI PDF Summarizer",
  "Priority processing",
  "No ads",
  "Batch processing",
];

export function HomePageContent() {
  const { t } = useTranslation();

  return (
    <>
      <section className="relative overflow-hidden mesh-hero">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-indigo-300/20 blur-3xl"
          style={{ animation: "mesh-shift 12s ease-in-out infinite" }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8 lg:pb-24 lg:pt-32">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/80 px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                {t("landing.heroBadge")}
              </span>

              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                {t("landing.heroTitle")}{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                  {t("landing.heroTitleHighlight")}
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">
                {t("landing.heroSubtitle")}
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                <a
                  href="#tools"
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-slate-900 px-8 text-sm font-semibold text-white shadow-xl shadow-slate-900/20 transition hover:bg-slate-800"
                >
                  {t("landing.heroCtaPrimary")}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href="/ai-pdf-summarizer"
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-violet-200 bg-white/90 px-8 text-sm font-semibold text-violet-700 shadow-sm backdrop-blur-sm transition hover:border-violet-300 hover:bg-violet-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {t("landing.heroCtaSecondary")}
                </Link>
              </div>

              <p className="mt-6 text-sm text-slate-500">{t("landing.heroTrust")}</p>
            </div>

            <HeroVisual />
          </div>
        </div>

        <StatsBar />
      </section>

      <section className="mesh-section py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
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

      <section id="tools" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow={t("landing.toolsEyebrow")}
            title={t("landing.toolsTitle")}
            description={t("landing.toolsDesc")}
          />

          <div className="mt-14 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {TOOL_KEYS.map((tool) => {
              const Icon = ICON_MAP[tool.icon];
              return (
                <Link
                  key={tool.slug}
                  href={`/${tool.slug}`}
                  className="tool-card-glow group relative rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                  {"isPro" in tool && tool.isPro && (
                    <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                      Pro
                    </span>
                  )}
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${tool.color}18` }}
                  >
                    {Icon && (
                      <Icon className="h-6 w-6" style={{ color: tool.color }} />
                    )}
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">{t(tool.nameKey)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    {t(tool.descKey)}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
                    {t("landing.toolsOpen")}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/all-tools"
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-5 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              {t("landing.toolsViewAll")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-indigo-50 py-20 sm:py-28">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 lg:order-1">
              <AiSummaryVisual />
            </div>

            <div className="order-1 lg:order-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                <Sparkles className="h-3.5 w-3.5" /> {t("landing.aiBadge")}
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {t("landing.aiTitle")}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                {t("landing.aiDesc")}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  { icon: FileSearch, title: t("landing.aiFeature1Title"), desc: t("landing.aiFeature1Desc") },
                  { icon: ListChecks, title: t("landing.aiFeature2Title"), desc: t("landing.aiFeature2Desc") },
                  { icon: Zap, title: t("landing.aiFeature3Title"), desc: t("landing.aiFeature3Desc") },
                  { icon: CalendarCheck, title: t("landing.aiFeature4Title"), desc: t("landing.aiFeature4Desc") },
                ].map((f) => (
                  <div
                    key={f.title}
                    className="rounded-xl border border-violet-100 bg-white/80 p-4 backdrop-blur-sm"
                  >
                    <f.icon className="h-5 w-5 text-violet-600" />
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">{f.title}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{f.desc}</p>
                  </div>
                ))}
              </div>

              <Link
                href="/ai-pdf-summarizer"
                className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-700 hover:to-indigo-700"
              >
                {t("landing.aiCta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-dark relative overflow-hidden py-20 sm:py-28">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow={t("landing.securityEyebrow")}
            title={t("landing.securityTitle")}
            description={t("landing.securityDesc")}
            className="[&_h2]:text-white [&_p]:text-indigo-100/80 [&_span]:border-indigo-400/30 [&_span]:bg-indigo-500/20 [&_span]:text-indigo-100"
          />

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Timer, title: t("landing.security1Title"), desc: t("landing.security1Desc") },
              { icon: Shield, title: t("landing.security2Title"), desc: t("landing.security2Desc") },
              { icon: UserCheck, title: t("landing.security3Title"), desc: t("landing.security3Desc") },
              { icon: HardDrive, title: t("landing.security4Title"), desc: t("landing.security4Desc") },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm transition hover:bg-white/10"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 ring-1 ring-indigo-400/30">
                  <f.icon className="h-6 w-6 text-indigo-200" />
                </div>
                <h3 className="mt-4 font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-indigo-100/70">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mesh-section py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow={t("landing.pricingEyebrow")}
            title={t("landing.pricingTitle")}
            description={t("landing.pricingDesc")}
          />

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">{t("landing.pricingFree")}</h3>
              <p className="mt-4">
                <span className="text-4xl font-extrabold text-slate-900">₹0</span>
                <span className="ml-1 text-slate-500">{t("landing.pricingPerMonth")}</span>
              </p>
              <ul className="mt-6 space-y-3">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="#tools"
                className="mt-8 block rounded-xl border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {t("landing.pricingFreeCta")}
              </Link>
            </div>

            <div className="relative rounded-2xl border-2 border-indigo-500 bg-white p-8 shadow-xl shadow-indigo-500/10">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-0.5 text-xs font-bold text-white shadow-md">
                {t("landing.pricingPopular")}
              </span>
              <h3 className="text-lg font-semibold text-slate-900">{t("landing.pricingPro")}</h3>
              <p className="mt-4">
                <span className="text-4xl font-extrabold text-slate-900">₹299</span>
                <span className="ml-1 text-slate-500">{t("landing.pricingPerMonth")}</span>
              </p>
              <ul className="mt-6 space-y-3">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="mt-8 block rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-center text-sm font-semibold text-white shadow-lg transition hover:from-indigo-700 hover:to-violet-700"
              >
                {t("landing.pricingProCta")}
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
            >
              {t("landing.pricingSeeAll")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title={t("landing.faqTitle")} />

          <div className="mt-12 divide-y divide-slate-200 rounded-2xl border border-slate-100 bg-slate-50/50 px-6">
            {FAQ_KEYS.map((key) => (
              <details key={key} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-slate-900 [&::-webkit-details-marker]:hidden">
                  {t(`landing.${key}q`)}
                  <span className="ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {t(`landing.${key}a`)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 py-16 sm:py-20">
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t("landing.ctaTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-indigo-100">{t("landing.ctaDesc")}</p>
          <a
            href="#tools"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-sm font-semibold text-indigo-700 shadow-xl transition hover:bg-indigo-50"
          >
            {t("landing.ctaButton")}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </>
  );
}
