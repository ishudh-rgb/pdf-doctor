"use client";

import { useHeroVariant } from "@/components/marketing/hero-variant-provider";
import { HeroVisualV2D1 } from "@/components/marketing/hero-visual-v2-d1";
import { HeroVisualV2D2 } from "@/components/marketing/hero-visual-v2-d2";

/** Routes V2 animation designs — keep edits inside d1/d2 files. */
export function HeroVisualV2() {
  const { animationDesign } = useHeroVariant();
  return animationDesign === "d2" ? <HeroVisualV2D2 /> : <HeroVisualV2D1 />;
}
