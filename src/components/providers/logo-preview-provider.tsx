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
  DEFAULT_LOGO_VARIANT,
  LOGO_PREVIEW_STORAGE_KEY,
  LOGO_VARIANTS,
  isLogoPreviewEnabled,
  type LogoVariantId,
} from "@/config/brand-logos";

type LogoPreviewContextValue = {
  logoVariant: LogoVariantId;
  setLogoVariant: (variant: LogoVariantId) => void;
  previewEnabled: boolean;
};

const LogoPreviewContext = createContext<LogoPreviewContextValue | null>(null);

function readStoredLogo(): LogoVariantId {
  if (typeof window === "undefined") return DEFAULT_LOGO_VARIANT;
  const stored = localStorage.getItem(LOGO_PREVIEW_STORAGE_KEY);
  if (stored && stored in LOGO_VARIANTS) return stored as LogoVariantId;
  return DEFAULT_LOGO_VARIANT;
}

export function LogoPreviewProvider({ children }: { children: ReactNode }) {
  const previewEnabled = isLogoPreviewEnabled();
  const [logoVariant, setLogoVariantState] = useState<LogoVariantId>(DEFAULT_LOGO_VARIANT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!previewEnabled) {
      setLogoVariantState(DEFAULT_LOGO_VARIANT);
      setHydrated(true);
      return;
    }
    setLogoVariantState(readStoredLogo());
    setHydrated(true);
  }, [previewEnabled]);

  useEffect(() => {
    if (!hydrated || !previewEnabled) return;
    localStorage.setItem(LOGO_PREVIEW_STORAGE_KEY, logoVariant);
    document.documentElement.dataset.logoVariant = logoVariant;
  }, [logoVariant, hydrated, previewEnabled]);

  const setLogoVariant = useCallback((variant: LogoVariantId) => {
    setLogoVariantState(variant);
  }, []);

  const value = useMemo(
    () => ({
      logoVariant,
      setLogoVariant,
      previewEnabled,
    }),
    [logoVariant, setLogoVariant, previewEnabled]
  );

  return (
    <LogoPreviewContext.Provider value={value}>{children}</LogoPreviewContext.Provider>
  );
}

export function useLogoPreview() {
  const ctx = useContext(LogoPreviewContext);
  if (!ctx) {
    return {
      logoVariant: DEFAULT_LOGO_VARIANT,
      setLogoVariant: () => {},
      previewEnabled: false,
    };
  }
  return ctx;
}
