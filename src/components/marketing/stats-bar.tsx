"use client";

import { useTranslation } from "@/i18n";

export function StatsBar() {
  const { t } = useTranslation();

  const stats = [
    { value: "12+", label: t("landing.statTools") },
    { value: "2 hrs", label: t("landing.statDelete") },
    { value: "∞", label: t("landing.statLimit") },
    { value: "100%", label: t("landing.statBrowser") },
  ];

  return (
    <div className="border-y border-pd-border bg-pd-surface/80 backdrop-blur-sm">
      <div className="pd-container grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-2xl font-extrabold tracking-tight text-pd-foreground sm:text-3xl">
              {stat.value}
            </p>
            <p className="mt-1 text-sm font-medium text-pd-muted">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
