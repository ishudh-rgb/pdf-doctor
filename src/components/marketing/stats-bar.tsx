"use client";

import { useTranslation } from "@/i18n";

export function StatsBar() {
  const { t } = useTranslation();

  const stats = [
    { value: "12+", label: t("landing.statTools") },
    { value: "2 hrs", label: t("landing.statDelete") },
    { value: "25 MB", label: t("landing.statLimit") },
    { value: "100%", label: t("landing.statBrowser") },
  ];

  return (
    <div className="border-y border-slate-200/80 bg-white/70 backdrop-blur-sm">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {stat.value}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
