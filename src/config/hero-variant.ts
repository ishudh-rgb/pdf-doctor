export type HeroVariantId = "v1" | "v2";
export type HeroAnimationId = "d1" | "d2";

export const HERO_VARIANT_STORAGE_KEY = "pdf-doctor-hero-variant";
export const HERO_ANIMATION_STORAGE_KEY = "pdf-doctor-hero-animation";

export const HERO_VARIANTS: Record<
  HeroVariantId,
  { id: HeroVariantId; label: string; description: string }
> = {
  v1: {
    id: "v1",
    label: "V1 · Static",
    description: "Current hero image (06/06/26 baseline)",
  },
  v2: {
    id: "v2",
    label: "V2 · Animation",
    description: "5s hero animation loop",
  },
};

export const HERO_ANIMATIONS: Record<
  HeroAnimationId,
  { id: HeroAnimationId; label: string; description: string }
> = {
  d1: {
    id: "d1",
    label: "D1 · Saved",
    description: "Frozen storyboard animation (approved)",
  },
  d2: {
    id: "d2",
    label: "D2 · Modern",
    description: "Product studio · 5 tools demo",
  },
};

/** Locked — V2 · Animation → D1 · Saved is the permanent production hero */
export const HERO_VARIANT_LOCKED = true;
export const LOCKED_HERO_VARIANT: HeroVariantId = "v2";
export const LOCKED_HERO_ANIMATION: HeroAnimationId = "d1";

export const DEFAULT_HERO_VARIANT: HeroVariantId = LOCKED_HERO_VARIANT;
export const DEFAULT_HERO_ANIMATION: HeroAnimationId = LOCKED_HERO_ANIMATION;

export function isHeroVariantSwitchEnabled() {
  if (HERO_VARIANT_LOCKED) return false;
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_HERO_VARIANT_SWITCH === "true"
  );
}
