"use client";

import { useHeroVariant } from "@/components/marketing/hero-variant-provider";
import { HeroVisualV1 } from "@/components/marketing/hero-visual-v1";
import { HeroVisualV2 } from "@/components/marketing/hero-visual-v2";

/** Routes to V1 or V2 — keep edits inside those files so variants stay independent. */
export function HeroVisual() {
  const { variant } = useHeroVariant();
  return variant === "v2" ? <HeroVisualV2 /> : <HeroVisualV1 />;
}
