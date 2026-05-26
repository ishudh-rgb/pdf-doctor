"use client";

import Image from "next/image";
import { useTranslation } from "@/i18n";

export function HeroVisual() {
  const { t } = useTranslation();

  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div
        aria-hidden
        className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-cyan-400/20 blur-2xl"
      />

      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/80 p-2 shadow-2xl shadow-indigo-500/10 backdrop-blur-sm sm:p-3">
        <div className="overflow-hidden rounded-[1.25rem] border border-slate-100">
          <Image
            src="/images/hero-product-main.webp"
            alt="PDF Doctor merge PDF tool interface screenshot"
            width={1200}
            height={750}
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="h-auto w-full object-cover object-top"
          />
        </div>
      </div>

      <div className="absolute -left-2 top-8 hidden rounded-xl border border-emerald-200 bg-white px-3 py-2 shadow-lg sm:block animate-float-medium">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
          {t("landing.secureLabel")}
        </p>
        <p className="text-xs font-bold text-slate-800">{t("landing.secureBadge")}</p>
      </div>
      <div className="absolute -right-2 bottom-16 hidden rounded-xl border border-violet-200 bg-white px-3 py-2 shadow-lg sm:block animate-float-slow">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-600">
          {t("landing.autoDeleteLabel")}
        </p>
        <p className="text-xs font-bold text-slate-800">{t("landing.autoDeleteBadge")}</p>
      </div>
    </div>
  );
}
