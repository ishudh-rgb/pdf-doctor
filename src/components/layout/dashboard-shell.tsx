"use client";

import { cn } from "@/lib/utils/cn";
import { useDesignPreview } from "@/components/design/design-preview-provider";
import type { LayoutStyleId } from "@/config/design-system";

interface DashboardShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

function DashboardHero({
  layout,
  title,
  subtitle,
}: {
  layout: LayoutStyleId;
  title: string;
  subtitle?: string;
}) {
  if (layout === "C") {
    return (
      <div className="mb-8 rounded-2xl bg-pd-brand p-6 text-white sm:p-8">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-white/85">{subtitle}</p>}
      </div>
    );
  }

  if (layout === "D") {
    return (
      <div className="mb-8 max-w-2xl rounded-2xl border border-pd-border bg-pd-surface p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-pd-foreground">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-pd-muted">{subtitle}</p>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mb-8 flex items-center gap-4 rounded-2xl border border-pd-border bg-pd-surface p-5 shadow-sm",
        layout === "A" && "py-4"
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pd-brand text-white">
        <span className="text-lg font-bold">PD</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-pd-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-pd-muted">{subtitle}</p>}
      </div>
    </div>
  );
}

export function DashboardShell({ title, subtitle, children, className }: DashboardShellProps) {
  const { layoutStyle } = useDesignPreview();
  const widthClass = layoutStyle === "D" ? "max-w-2xl" : "max-w-7xl";

  return (
    <section className={cn("pd-dashboard min-h-screen bg-pd-background", className)}>
      <div className={cn("pd-container py-8", widthClass)}>
        <DashboardHero layout={layoutStyle} title={title} subtitle={subtitle} />
        {children}
      </div>
    </section>
  );
}

/** Reusable dashboard stat card */
export function DashboardCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-pd-border bg-pd-surface p-6 shadow-sm", className)}>
      {children}
    </div>
  );
}
