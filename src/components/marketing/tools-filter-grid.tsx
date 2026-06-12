"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils/cn";
import {
  CATEGORY_FALLBACK_LABELS,
  ICON_MAP,
  TOOL_CATEGORIES,
  TOOL_KEYS,
} from "@/components/marketing/home/home-shared";
import { ToolIconTile } from "@/components/tools/tool-icon-tile";

type FilterId = "all" | (typeof TOOL_CATEGORIES)[number]["id"];

function categoryLabel(
  t: (key: string) => string,
  cat: (typeof TOOL_CATEGORIES)[number]
) {
  const translated = t(cat.labelKey);
  return translated !== cat.labelKey ? translated : CATEGORY_FALLBACK_LABELS[cat.id];
}

type ToolsFilterGridProps = {
  ariaLabel?: string;
  className?: string;
};

export function ToolsFilterGrid({ ariaLabel, className }: ToolsFilterGridProps) {
  const { t } = useTranslation();
  const [active, setActive] = useState<FilterId>("all");
  const label = ariaLabel ?? t("landing.toolsTitle");

  const filters: { id: FilterId; label: string }[] = useMemo(
    () => [
      { id: "all", label: t("landing.toolsFilterAll") },
      ...TOOL_CATEGORIES.map((cat) => ({
        id: cat.id as FilterId,
        label: categoryLabel(t, cat),
      })),
    ],
    [t]
  );

  const visibleTools = useMemo(() => {
    if (active === "all") return [...TOOL_KEYS];
    return TOOL_KEYS.filter((tool) => tool.category === active);
  }, [active]);

  return (
    <div className={className}>
      <div
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:justify-start sm:overflow-visible"
        role="tablist"
        aria-label={label}
      >
        {filters.map((filter) => {
          const isActive = active === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(filter.id)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-pd-foreground bg-pd-foreground text-pd-surface shadow-sm"
                  : "border-pd-border bg-pd-surface text-pd-muted hover:border-pd-foreground/30 hover:text-pd-foreground"
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-pd-muted">
        {t("allTools.showingCount", { count: String(visibleTools.length) })}
      </p>

      <div
        className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        role="tabpanel"
      >
        {visibleTools.map((tool) => {
          const Icon = ICON_MAP[tool.icon];
          const name = t(tool.nameKey);

          return (
            <Link
              key={tool.slug}
              href={`/${tool.slug}`}
              title={name}
              className={cn(
                "tool-card-ilove group relative flex min-h-[148px] flex-col rounded-xl border border-pd-border bg-pd-surface p-4",
                "transition-all duration-200 hover:border-pd-foreground hover:shadow-md"
              )}
            >
              {"isPro" in tool && tool.isPro && (
                <span className="absolute right-2.5 top-2.5 rounded-full bg-pd-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Pro
                </span>
              )}

              {Icon && <ToolIconTile slug={tool.slug} icon={Icon} size="lg" />}

              <h3 className="mt-3 text-sm font-bold leading-snug text-pd-foreground sm:text-[15px]">
                {name}
              </h3>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-pd-muted">
                {t(tool.descKey)}
              </p>

              <span
                className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-pd-foreground px-2.5 py-1 text-xs font-medium text-pd-surface opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                aria-hidden
              >
                {name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
