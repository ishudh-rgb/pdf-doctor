"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useDesignPreview } from "@/components/design/design-preview-provider";
import type { LayoutStyleId } from "@/config/design-system";

interface MarketingPageShellProps {
  title: string;
  description?: string;
  eyebrow?: string;
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
}

function PageHero({
  layout,
  title,
  description,
  eyebrow,
}: {
  layout: LayoutStyleId;
  title: string;
  description?: string;
  eyebrow?: string;
}) {
  if (layout === "A") {
    return (
      <section className="border-b border-pd-border bg-pd-surface py-10">
        <div className="pd-container">
          {eyebrow && (
            <p className="text-xs font-bold uppercase tracking-wider text-pd-brand">{eyebrow}</p>
          )}
          <h1 className="mt-2 text-2xl font-bold text-pd-foreground sm:text-3xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-pd-muted">{description}</p>}
        </div>
      </section>
    );
  }

  if (layout === "C") {
    return (
      <section className="bg-pd-brand py-16 text-white sm:py-20">
        <div className="pd-container text-center">
          {eyebrow && (
            <p className="text-xs font-bold uppercase tracking-wider text-white/80">{eyebrow}</p>
          )}
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl lg:text-5xl">{title}</h1>
          {description && (
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">{description}</p>
          )}
        </div>
      </section>
    );
  }

  if (layout === "D") {
    return (
      <section className="pd-section pt-12 sm:pt-16">
        <div className="pd-container max-w-2xl">
          <div className="rounded-2xl border border-pd-border bg-pd-surface p-8 shadow-sm">
            {eyebrow && (
              <p className="text-xs font-bold uppercase tracking-wider text-pd-brand">{eyebrow}</p>
            )}
            <h1 className="mt-2 text-2xl font-bold text-pd-foreground sm:text-3xl">{title}</h1>
            {description && <p className="mt-3 text-pd-muted">{description}</p>}
          </div>
        </div>
      </section>
    );
  }

  if (layout === "B") {
    return (
      <section className="mesh-section border-b border-pd-border py-14 sm:py-20">
        <div className="pd-container">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              {eyebrow && (
                <p className="text-xs font-bold uppercase tracking-wider text-pd-brand">{eyebrow}</p>
              )}
              <h1 className="mt-3 text-3xl font-bold text-pd-foreground sm:text-4xl">{title}</h1>
              {description && <p className="mt-4 max-w-xl text-lg text-pd-muted">{description}</p>}
            </div>
            <div className="hidden rounded-2xl border border-pd-border bg-pd-surface p-6 lg:block">
              <p className="text-sm font-semibold text-pd-foreground">Quick access</p>
              <p className="mt-1 text-sm text-pd-muted">Pick a tool and start in seconds.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Layout E (default expert)
  return (
    <section className="relative overflow-hidden bg-pd-background py-16 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 right-0 h-64 w-64 rounded-full bg-pd-brand/10 blur-3xl"
      />
      <div className="pd-container relative text-center">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-wider text-pd-brand">{eyebrow}</p>
        )}
        <h1 className="mt-3 text-3xl font-bold text-pd-foreground sm:text-4xl lg:text-5xl">{title}</h1>
        {description && (
          <p className="mx-auto mt-4 max-w-2xl text-lg text-pd-muted">{description}</p>
        )}
      </div>
    </section>
  );
}

export function MarketingPageShell({
  title,
  description,
  eyebrow,
  children,
  breadcrumbs,
  className,
}: MarketingPageShellProps) {
  const { layoutStyle } = useDesignPreview();

  const contentWidth =
    layoutStyle === "D" ? "max-w-2xl" : layoutStyle === "A" ? "max-w-6xl" : "max-w-6xl";

  return (
    <article className={cn("pd-marketing-page bg-pd-background", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="border-b border-pd-border bg-pd-surface py-3">
          <div className="pd-container">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-pd-muted">
              {breadcrumbs.map((crumb, i) => (
                <li key={crumb.label} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-pd-brand">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-pd-foreground">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </nav>
      )}

      <PageHero layout={layoutStyle} title={title} description={description} eyebrow={eyebrow} />

      <div className={`pd-container pb-20 pt-10 ${contentWidth}`}>{children}</div>
    </article>
  );
}
