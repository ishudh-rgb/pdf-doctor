"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_HERO_ANIMATION,
  DEFAULT_HERO_VARIANT,
  HERO_ANIMATION_STORAGE_KEY,
  HERO_VARIANT_STORAGE_KEY,
  HERO_VARIANT_LOCKED,
  LOCKED_HERO_ANIMATION,
  LOCKED_HERO_VARIANT,
  type HeroAnimationId,
  type HeroVariantId,
  isHeroVariantSwitchEnabled,
} from "@/config/hero-variant";

type HeroVariantContextValue = {
  variant: HeroVariantId;
  animationDesign: HeroAnimationId;
  setVariant: (variant: HeroVariantId) => void;
  setAnimationDesign: (design: HeroAnimationId) => void;
  switchEnabled: boolean;
};

const HeroVariantContext = createContext<HeroVariantContextValue | null>(null);

function readStoredVariant(): HeroVariantId {
  if (HERO_VARIANT_LOCKED) return LOCKED_HERO_VARIANT;
  if (typeof window === "undefined") return DEFAULT_HERO_VARIANT;
  const stored = localStorage.getItem(HERO_VARIANT_STORAGE_KEY);
  return stored === "v2" ? "v2" : DEFAULT_HERO_VARIANT;
}

function readStoredAnimation(): HeroAnimationId {
  if (HERO_VARIANT_LOCKED) return LOCKED_HERO_ANIMATION;
  if (typeof window === "undefined") return DEFAULT_HERO_ANIMATION;
  const stored = localStorage.getItem(HERO_ANIMATION_STORAGE_KEY);
  return stored === "d1" ? "d1" : DEFAULT_HERO_ANIMATION;
}

export function HeroVariantProvider({ children }: { children: ReactNode }) {
  const switchEnabled = isHeroVariantSwitchEnabled();
  const [variant, setVariantState] = useState<HeroVariantId>(DEFAULT_HERO_VARIANT);
  const [animationDesign, setAnimationDesignState] =
    useState<HeroAnimationId>(DEFAULT_HERO_ANIMATION);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setVariantState(readStoredVariant());
    setAnimationDesignState(readStoredAnimation());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const activeVariant = HERO_VARIANT_LOCKED ? LOCKED_HERO_VARIANT : variant;
    const activeAnimation = HERO_VARIANT_LOCKED ? LOCKED_HERO_ANIMATION : animationDesign;
    document.documentElement.dataset.heroVariant = activeVariant;
    document.documentElement.dataset.heroAnimation = activeAnimation;
    if (!switchEnabled || HERO_VARIANT_LOCKED) return;
    localStorage.setItem(HERO_VARIANT_STORAGE_KEY, variant);
    localStorage.setItem(HERO_ANIMATION_STORAGE_KEY, animationDesign);
  }, [variant, animationDesign, hydrated, switchEnabled]);

  const setVariant = useCallback((next: HeroVariantId) => {
    setVariantState(next);
  }, []);

  const setAnimationDesign = useCallback((next: HeroAnimationId) => {
    setAnimationDesignState(next);
  }, []);

  const value = useMemo(
    () => ({
      variant,
      animationDesign,
      setVariant,
      setAnimationDesign,
      switchEnabled,
    }),
    [variant, animationDesign, setVariant, setAnimationDesign, switchEnabled]
  );

  return <HeroVariantContext.Provider value={value}>{children}</HeroVariantContext.Provider>;
}

export function useHeroVariant() {
  const ctx = useContext(HeroVariantContext);
  if (!ctx) {
    throw new Error("useHeroVariant must be used within HeroVariantProvider");
  }
  return ctx;
}
