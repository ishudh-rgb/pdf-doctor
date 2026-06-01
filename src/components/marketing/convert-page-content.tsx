"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils/cn";
import { MarketingPageShell } from "@/components/layout/marketing-page-shell";
import {
  CATEGORY_FALLBACK_LABELS,
  ICON_MAP,
  TOOL_ACCENT,
  TOOL_KEYS,
} from "@/components/marketing/home/home-shared";

type ConvertFilter = "all" | "convert-from" | "convert-to";

const CONVERT_CATEGORIES = ["convert-from", "convert-to"] as const;

function categoryLabel(t: (key: string) => string, id: (typeof CONVERT_CATEGORIES)[number]) {
  const key = id === "convert-from" ? "landing.toolsCategoryConvertFrom" : "landing.toolsCategoryConvertTo";
  const translated = t(key);
  return translated !== key ? translated : CATEGORY_FALLBACK_LABELS[id];
}

export function ConvertPageContent() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<ConvertFilter>("all");

  const convertTools = useMemo(
    () => TOOL_KEYS.filter((tool) => CONVERT_CATEGORIES.includes(tool.category as typeof CONVERT_CATEGORIES[number])),
    []
  );

  const visibleByCategory = useMemo(() => {
    const cats =
      filter === "all" ? CONVERT_CATEGORIES : ([filter] as readonly (typeof CONVERT_CATEGORIES)[number][]);
    return cats
      .map((cat) => ({
        id: cat,
        label: categoryLabel(t, cat),
        tools: convertTools.filter((tool) => tool.category === cat),
      }))
      .filter((group) => group.tools.length > 0);
  }, [filter, t]);

  const filters: { id: ConvertFilter; label: string }[] = [
    { id: "all", label: t("landing.toolsFilterAll") },
    { id: "convert-from", label: categoryLabel(t, "convert-from") },
    { id: "convert-to", label: categoryLabel(t, "convert-to") },
  ];

  return (
    <MarketingPageShell
      title={t("convertPage.title")}
      description={t("convertPage.description")}
      eyebrow={t("convertPage.eyebrow")}
      heroStyle="centered"
      breadcrumbs={[
        { label: t("nav.home"), href: "/" },
        { label: t("convertPage.breadcrumb") },
      ]}
    >
      <div className="mx-auto max-w-5xl">
      <div className="rounded-xl border border-pd-border bg-pd-surface p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap justify-center gap-2 border-b border-pd-border pb-5">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                filter === item.id
                  ? "border-pd-foreground bg-pd-foreground text-pd-surface"
                  : "border-pd-border bg-pd-background text-pd-muted hover:border-pd-brand/40 hover:text-pd-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-8">
          {visibleByCategory.map((group) => (
            <section key={group.id}>
              {filter === "all" && (
                <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-pd-muted">
                  {group.label}
                </h2>
              )}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {group.tools.map((tool) => {
                  const Icon = ICON_MAP[tool.icon];
                  const accent = TOOL_ACCENT[tool.slug] ?? "bg-pd-brand";
                  const name = t(tool.nameKey);

                  return (
                    <Link
                      key={tool.slug}
                      href={`/${tool.slug}`}
                      title={name}
                      className="group relative flex min-h-[132px] flex-col rounded-xl border border-pd-border bg-pd-background p-3.5 transition-all hover:border-pd-brand/50 hover:shadow-md sm:p-4"
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-sm transition-transform group-hover:scale-105",
                          accent
                        )}
                      >
                        {Icon && <Icon className="h-5 w-5" strokeWidth={2.25} />}
                      </div>
                      <h3 className="mt-3 text-sm font-bold leading-snug text-pd-foreground">
                        {name}
                      </h3>
                      <p className="mt-1 line-clamp-2 flex-1 text-[11px] leading-relaxed text-pd-muted">
                        {t(tool.descKey)}
                      </p>
                      <ArrowRight className="mt-2 h-4 w-4 text-pd-brand opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-pd-muted">
          {t("convertPage.footer", { count: String(convertTools.length) })}
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4 rounded-xl border border-pd-border bg-pd-brand-muted px-6 py-7 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="font-semibold text-pd-foreground">{t("convertPage.ctaTitle")}</p>
          <p className="mt-1 text-sm text-pd-muted">{t("convertPage.ctaDesc")}</p>
        </div>
        <Link
          href="/all-tools"
          className="inline-flex items-center gap-2 rounded-lg bg-pd-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-pd-brand-hover"
        >
          {t("landing.toolsViewAll")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      </div>
    </MarketingPageShell>
  );
}
