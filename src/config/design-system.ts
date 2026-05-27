export type BrandThemeId = "A" | "B" | "C" | "D";
export type LayoutStyleId = "A" | "B" | "C" | "D" | "E";

/** Production lock — Theme A (Enterprise Navy) + Layout B (Split panel) */
export const DESIGN_LOCKED = true;
export const LOCKED_BRAND_THEME: BrandThemeId = "A";
export const LOCKED_LAYOUT_STYLE: LayoutStyleId = "B";

export const DEFAULT_BRAND_THEME: BrandThemeId = LOCKED_BRAND_THEME;
export const DEFAULT_LAYOUT_STYLE: LayoutStyleId = LOCKED_LAYOUT_STYLE;

export const LAYOUT_BODY_CLASS: Record<LayoutStyleId, string> = {
  A: "layout-upload-first",
  B: "layout-split-panel",
  C: "layout-visual-wizard",
  D: "layout-calm-cards",
  E: "layout-expert-mix",
};

export const BRAND_THEMES: Record<
  BrandThemeId,
  { id: BrandThemeId; name: string; description: string }
> = {
  A: {
    id: "A",
    name: "Enterprise Navy",
    description: "Deep navy, formal grids, trust-focused",
  },
  B: {
    id: "B",
    name: "Modern Neutral",
    description: "Slate + violet accent, sharp SaaS feel",
  },
  C: {
    id: "C",
    name: "Clean Teal",
    description: "Teal + soft cards, friendly enterprise",
  },
  D: {
    id: "D",
    name: "Bold Minimal",
    description: "High contrast black/white + strong accent",
  },
};

export const LAYOUT_STYLES: Record<
  LayoutStyleId,
  { id: LayoutStyleId; name: string; description: string }
> = {
  A: {
    id: "A",
    name: "Tool-first",
    description: "Smallpdf — upload hero, dense tool grid, minimal nav",
  },
  B: {
    id: "B",
    name: "Split panel",
    description: "Stripe — 2-col hero, category rows, split workspace",
  },
  C: {
    id: "C",
    name: "Visual wizard",
    description: "Adobe — bold band hero, step bar, rich categories",
  },
  D: {
    id: "D",
    name: "Calm cards",
    description: "Notion — narrow column, stacked cards, quiet UI",
  },
  E: {
    id: "E",
    name: "Expert mix",
    description: "Balanced hero + tools + step bar on tool pages",
  },
};

export const DESIGN_PREVIEW_STORAGE = {
  theme: "pdf-doctor-preview-theme",
  layout: "pdf-doctor-preview-layout",
} as const;

export function isDesignPreviewEnabled() {
  if (DESIGN_LOCKED) return false;
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DESIGN_PREVIEW === "true"
  );
}
