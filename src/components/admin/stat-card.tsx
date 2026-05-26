"use client";

import { cn } from "@/lib/utils/cn";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "blue" | "green" | "purple" | "orange" | "red" | "slate";
  className?: string;
}

const variantStyles = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  purple: "bg-purple-50 text-purple-600",
  orange: "bg-orange-50 text-orange-600",
  red: "bg-red-50 text-red-600",
  slate: "bg-slate-50 text-slate-600",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = "blue",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white border border-gray-100 shadow-sm p-6 flex items-start gap-4",
        className
      )}
    >
      <div className={cn("rounded-xl p-3", variantStyles[variant])}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trend.value >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                trend.value >= 0 ? "text-green-600" : "text-red-600"
              )}
            >
              {trend.value > 0 ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-xs text-gray-400">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 flex items-start gap-4 animate-pulse">
      <div className="rounded-xl bg-gray-100 h-12 w-12" />
      <div className="flex-1">
        <div className="h-4 w-24 bg-gray-100 rounded" />
        <div className="h-7 w-16 bg-gray-100 rounded mt-2" />
        <div className="h-3 w-20 bg-gray-100 rounded mt-2" />
      </div>
    </div>
  );
}
