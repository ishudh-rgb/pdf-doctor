"use client";

import Image from "next/image";
import { useTranslation } from "@/i18n";

export function HeroVisual() {
  const { t } = useTranslation();

  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div
        aria-hidden
        className="absolute -inset-4 rounded-[2rem] bg-pd-brand/15 blur-2xl"
      />

      <div className="relative overflow-hidden rounded-[1.75rem] border border-pd-border bg-pd-surface p-2 shadow-lg sm:p-3">
        <div className="overflow-hidden rounded-[1.25rem] border border-pd-border">
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

      <div className="absolute -left-2 top-8 hidden rounded-xl border border-pd-border bg-pd-surface px-3 py-2 shadow-lg sm:block animate-float-medium">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-pd-success">
          {t("landing.secureLabel")}
        </p>
        <p className="text-xs font-bold text-pd-foreground">{t("landing.secureBadge")}</p>
      </div>
      <div className="absolute -right-2 bottom-16 hidden rounded-xl border border-pd-border bg-pd-surface px-3 py-2 shadow-lg sm:block animate-float-slow">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-pd-brand">
          {t("landing.autoDeleteLabel")}
        </p>
        <p className="text-xs font-bold text-pd-foreground">{t("landing.autoDeleteBadge")}</p>
      </div>
    </div>
  );
}
