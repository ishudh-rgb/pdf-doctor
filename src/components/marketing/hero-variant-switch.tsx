"use client";

import { useState } from "react";
import { Clapperboard, ImageIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  HERO_ANIMATIONS,
  HERO_VARIANTS,
  type HeroAnimationId,
  type HeroVariantId,
} from "@/config/hero-variant";
import { useHeroVariant } from "@/components/marketing/hero-variant-provider";

export function HeroVariantSwitch() {
  const { variant, animationDesign, setVariant, setAnimationDesign, switchEnabled } =
    useHeroVariant();
  const [open, setOpen] = useState(true);

  if (!switchEnabled) return null;

  const activeLabel =
    variant === "v1"
      ? HERO_VARIANTS.v1.label
      : `${HERO_VARIANTS.v2.label} → ${HERO_ANIMATIONS[animationDesign].label}`;

  return (
    <div
      className={cn(
        "fixed left-4 top-1/2 z-[9997] w-[min(100vw-2rem,210px)] -translate-y-1/2 transition-transform duration-300",
        !open && "-translate-x-[calc(100%+1rem)]"
      )}
      aria-label="Hero variant compare switch"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="absolute -right-11 top-1/2 flex h-24 w-11 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-r-xl border border-l-0 border-pd-border bg-pd-surface text-[10px] font-semibold text-pd-muted shadow-md"
      >
        <Clapperboard className="h-4 w-4 text-pd-brand" />
        <span className="[writing-mode:vertical-rl]">Hero</span>
      </button>

      <div className="overflow-hidden rounded-2xl border border-dashed border-amber-300/80 bg-pd-surface shadow-lg">
        <div className="border-b border-pd-border bg-amber-50 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
            Temporary compare
          </p>
          <p className="text-[11px] text-amber-800/80">Home hero only · dev switch</p>
        </div>

        <div className="space-y-2 p-3">
          {(Object.keys(HERO_VARIANTS) as HeroVariantId[]).map((id) => {
            const item = HERO_VARIANTS[id];
            const active = variant === id;
            const Icon = id === "v1" ? ImageIcon : Clapperboard;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setVariant(id)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  active
                    ? "border-pd-brand bg-pd-brand-muted"
                    : "border-pd-border hover:border-pd-border-strong"
                )}
              >
                <Icon
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    active ? "text-pd-brand" : "text-pd-muted"
                  )}
                />
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-xs font-semibold",
                      active ? "text-pd-brand" : "text-pd-foreground"
                    )}
                  >
                    {item.label}
                  </p>
                  <p className="text-[10px] leading-snug text-pd-muted">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {variant === "v2" && (
          <div className="space-y-2 border-t border-pd-border px-3 pb-3 pt-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-pd-muted">
              V2 animation design
            </p>
            {(Object.keys(HERO_ANIMATIONS) as HeroAnimationId[]).map((id) => {
              const item = HERO_ANIMATIONS[id];
              const active = animationDesign === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAnimationDesign(id)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors",
                    active
                      ? "border-violet-400 bg-violet-50"
                      : "border-pd-border hover:border-pd-border-strong"
                  )}
                >
                  <Sparkles
                    className={cn(
                      "mt-0.5 h-3.5 w-3.5 shrink-0",
                      active ? "text-violet-600" : "text-pd-muted"
                    )}
                  />
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-[11px] font-semibold",
                        active ? "text-violet-700" : "text-pd-foreground"
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="text-[9px] leading-snug text-pd-muted">{item.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="border-t border-pd-border px-3 py-2 text-center text-[10px] text-pd-muted">
          Active: <strong className="text-pd-foreground">{activeLabel}</strong>
        </div>
      </div>
    </div>
  );
}
