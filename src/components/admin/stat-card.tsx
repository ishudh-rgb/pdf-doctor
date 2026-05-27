"use client";

import { cn } from "@/lib/utils/cn";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-2xl border border-pd-border bg-pd-surface p-6 shadow-sm",
        className
      )}
    >
      <div className="rounded-xl bg-pd-brand-muted p-3 text-pd-brand">
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-pd-muted">{label}</p>
        <p className="mt-1 text-2xl font-bold text-pd-foreground">{value}</p>
        {trend && (
          <div className="mt-2 flex items-center gap-1">
            {trend.value >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-pd-success" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-pd-danger" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                trend.value >= 0 ? "text-pd-success" : "text-pd-danger"
              )}
            >
              {trend.value > 0 ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-xs text-pd-muted">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="flex animate-pulse items-start gap-4 rounded-2xl border border-pd-border bg-pd-surface p-6 shadow-sm">
      <div className="h-12 w-12 rounded-xl bg-pd-border" />
      <div className="flex-1">
        <div className="h-4 w-24 rounded bg-pd-border" />
        <div className="mt-2 h-7 w-16 rounded bg-pd-border" />
        <div className="mt-2 h-3 w-20 rounded bg-pd-border" />
      </div>
    </div>
  );
}
