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
  BRAND_THEMES,
  DEFAULT_BRAND_THEME,
  DEFAULT_LAYOUT_STYLE,
  DESIGN_LOCKED,
  DESIGN_PREVIEW_STORAGE,
  isDesignPreviewEnabled,
  LAYOUT_BODY_CLASS,
  LAYOUT_STYLES,
  type BrandThemeId,
  type LayoutStyleId,
} from "@/config/design-system";

type DesignPreviewContextValue = {
  brandTheme: BrandThemeId;
  layoutStyle: LayoutStyleId;
  setBrandTheme: (theme: BrandThemeId) => void;
  setLayoutStyle: (layout: LayoutStyleId) => void;
  previewEnabled: boolean;
};

const DesignPreviewContext = createContext<DesignPreviewContextValue | null>(null);

function readStoredTheme(): BrandThemeId {
  if (DESIGN_LOCKED || typeof window === "undefined") return DEFAULT_BRAND_THEME;
  const stored = localStorage.getItem(DESIGN_PREVIEW_STORAGE.theme);
  if (stored && stored in BRAND_THEMES) return stored as BrandThemeId;
  return DEFAULT_BRAND_THEME;
}

function readStoredLayout(): LayoutStyleId {
  if (DESIGN_LOCKED || typeof window === "undefined") return DEFAULT_LAYOUT_STYLE;
  const stored = localStorage.getItem(DESIGN_PREVIEW_STORAGE.layout);
  if (stored && stored in LAYOUT_STYLES) return stored as LayoutStyleId;
  return DEFAULT_LAYOUT_STYLE;
}

export function DesignPreviewProvider({ children }: { children: ReactNode }) {
  const previewEnabled = isDesignPreviewEnabled();
  const [brandTheme, setBrandThemeState] = useState<BrandThemeId>(DEFAULT_BRAND_THEME);
  const [layoutStyle, setLayoutStyleState] = useState<LayoutStyleId>(DEFAULT_LAYOUT_STYLE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setBrandThemeState(readStoredTheme());
    setLayoutStyleState(readStoredLayout());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.dataset.brandTheme = brandTheme;
    root.dataset.layoutStyle = layoutStyle;
    if (previewEnabled) {
      root.dataset.designPreview = "true";
    } else {
      delete root.dataset.designPreview;
    }
    root.classList.remove(
      "layout-upload-first",
      "layout-split-panel",
      "layout-visual-wizard",
      "layout-calm-cards",
      "layout-expert-mix"
    );
    root.classList.add(LAYOUT_BODY_CLASS[layoutStyle]);
    if (!DESIGN_LOCKED && previewEnabled) {
      localStorage.setItem(DESIGN_PREVIEW_STORAGE.theme, brandTheme);
      localStorage.setItem(DESIGN_PREVIEW_STORAGE.layout, layoutStyle);
    }
  }, [brandTheme, layoutStyle, hydrated, previewEnabled]);

  const setBrandTheme = useCallback((theme: BrandThemeId) => {
    setBrandThemeState(theme);
  }, []);

  const setLayoutStyle = useCallback((layout: LayoutStyleId) => {
    setLayoutStyleState(layout);
  }, []);

  const value = useMemo(
    () => ({
      brandTheme,
      layoutStyle,
      setBrandTheme,
      setLayoutStyle,
      previewEnabled,
    }),
    [brandTheme, layoutStyle, setBrandTheme, setLayoutStyle, previewEnabled]
  );

  return (
    <DesignPreviewContext.Provider value={value}>{children}</DesignPreviewContext.Provider>
  );
}

export function useDesignPreview() {
  const ctx = useContext(DesignPreviewContext);
  if (!ctx) {
    throw new Error("useDesignPreview must be used within DesignPreviewProvider");
  }
  return ctx;
}
