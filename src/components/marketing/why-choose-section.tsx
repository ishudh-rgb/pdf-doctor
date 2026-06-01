"use client";

import type { ReactElement } from "react";
import {
  Users,
  Star,
  Globe,
  MessageCircle,
  Lock,
  ShieldCheck,
  Smartphone,
  Monitor,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "@/i18n";
import { SectionHeading } from "@/components/marketing/section-heading";
import { cn } from "@/lib/utils/cn";

type WhyItemId = "users" | "business" | "everywhere" | "support" | "encryption" | "standards";

function UsersVisual() {
  return (
    <div className="relative flex h-full items-end justify-center gap-1 pb-2">
      <div className="flex h-14 w-10 items-end justify-center rounded-t-full bg-pd-brand/25">
        <Users className="mb-2 h-6 w-6 text-pd-brand" />
      </div>
      <div className="flex h-16 w-10 items-end justify-center rounded-t-full bg-pd-brand/40">
        <Users className="mb-2 h-7 w-7 text-pd-brand" />
      </div>
      <div className="flex h-12 w-10 items-end justify-center rounded-t-full bg-pd-brand/20">
        <Users className="mb-2 h-5 w-5 text-pd-brand/80" />
      </div>
      <span className="absolute -right-1 top-2 rounded-full bg-pd-brand px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
        10K+
      </span>
    </div>
  );
}

function BusinessVisual() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <div className="flex h-10 w-full max-w-[140px] items-end justify-center gap-1.5 px-4">
        {[40, 65, 50, 80, 55].map((h, i) => (
          <div
            key={i}
            className="w-4 flex-1 rounded-t bg-pd-brand/30"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <span className="text-xs font-bold text-pd-brand">4.9 / 5</span>
    </div>
  );
}

function EverywhereVisual() {
  const icons: LucideIcon[] = [Globe, Monitor, Smartphone, FileText];
  return (
    <div className="grid h-full grid-cols-2 place-items-center gap-3 p-4">
      {icons.map((Icon, i) => (
        <div
          key={i}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-pd-border bg-pd-surface shadow-sm"
        >
          <Icon className="h-6 w-6 text-pd-brand" />
        </div>
      ))}
    </div>
  );
}

function SupportVisual() {
  return (
    <div className="relative flex h-full items-center justify-center">
      <div className="absolute h-20 w-20 rounded-full bg-pd-brand/10" />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-pd-brand/30 bg-pd-surface shadow-md">
        <MessageCircle className="h-8 w-8 text-pd-brand" />
      </div>
      <span className="absolute right-6 top-6 rounded-lg bg-pd-brand px-2 py-1 text-xs font-bold text-white">
        24/7
      </span>
    </div>
  );
}

function EncryptionVisual() {
  return (
    <div className="relative flex h-full items-center justify-center">
      <div className="flex h-14 w-16 items-center justify-center rounded-lg border-2 border-dashed border-pd-brand/25 bg-pd-brand-muted/50">
        <FileText className="h-8 w-8 text-pd-muted/60" />
      </div>
      <div className="absolute -bottom-1 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-pd-brand shadow-lg ring-4 ring-pd-surface">
        <Lock className="h-6 w-6 text-white" />
      </div>
    </div>
  );
}

function StandardsVisual() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-pd-brand/20 bg-pd-surface shadow-inner">
        <ShieldCheck className="h-10 w-10 text-pd-brand" />
        <span className="absolute -bottom-1 rounded bg-pd-foreground px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-pd-surface">
          GDPR
        </span>
      </div>
    </div>
  );
}

const VISUALS: Record<WhyItemId, () => ReactElement> = {
  users: UsersVisual,
  business: BusinessVisual,
  everywhere: EverywhereVisual,
  support: SupportVisual,
  encryption: EncryptionVisual,
  standards: StandardsVisual,
};

const ITEM_IDS: WhyItemId[] = [
  "users",
  "business",
  "everywhere",
  "support",
  "encryption",
  "standards",
];

export function WhyChooseSection() {
  const { t } = useTranslation();

  return (
    <section className="border-y border-pd-border bg-pd-surface pd-section sm:py-16">
      <div className="pd-container">
        <SectionHeading
          title={t("landing.whyChooseTitle")}
          description={t("landing.whyChooseDesc")}
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {ITEM_IDS.map((id) => {
            const Visual = VISUALS[id];
            return (
              <article
                key={id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-pd-border bg-pd-background",
                  "transition-all duration-300 hover:-translate-y-1 hover:border-pd-brand/35 hover:shadow-lg"
                )}
              >
                <div className="relative h-36 overflow-hidden bg-gradient-to-b from-pd-brand-muted/80 to-pd-background">
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-pd-brand/10" />
                    <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-pd-brand/5" />
                  </div>
                  <Visual />
                </div>

                <div className="px-5 pb-6 pt-4">
                  <h3 className="text-base font-bold text-pd-foreground sm:text-lg">
                    {t(`landing.whyChoose_${id}_title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-pd-muted">
                    {t(`landing.whyChoose_${id}_desc`)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
