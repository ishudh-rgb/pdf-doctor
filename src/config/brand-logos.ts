export type LogoVariantId = "A" | "B" | "C" | "D";

export type LogoDisplaySlot = {
  maxHeight: number;
  maxWidth: number;
};

export type LogoWordmarkStyle = {
  primary: string;
  accent: string;
  primaryClass: string;
  accentClass: string;
};

export type LogoLayout = "image" | "split";

export const DEFAULT_LOGO_VARIANT: LogoVariantId = "D";

export const LOGO_PREVIEW_STORAGE_KEY = "pdf-doctor-preview-logo";

type LogoVariantBase = {
  id: LogoVariantId;
  name: string;
  description: string;
  src: string;
  footer: LogoDisplaySlot;
  icon: LogoDisplaySlot;
};

export type LogoVariantConfig = LogoVariantBase &
  (
    | {
        layout: "image";
        header: LogoDisplaySlot;
      }
    | {
        layout: "split";
        iconSrc: string;
        wordmark: LogoWordmarkStyle;
        headerIcon: LogoDisplaySlot;
      }
  );

export const LOGO_VARIANTS: Record<LogoVariantId, LogoVariantConfig> = {
  A: {
    id: "A",
    name: "Horizontal + Lock",
    description: "Icon left, OnlyMyPDF + tagline — best for header",
    src: "/logos/clean/logo-a-horizontal-clean.png",
    layout: "image",
    header: { maxHeight: 48, maxWidth: 210 },
    footer: { maxHeight: 56, maxWidth: 260 },
    icon: { maxHeight: 64, maxWidth: 64 },
  },
  B: {
    id: "B",
    name: "Stacked Classic",
    description: "OM icon on top, OnlyMyPDF below — clean stacked mark",
    src: "/logos/clean/logo-b-stacked-clean.png",
    layout: "image",
    header: { maxHeight: 70, maxWidth: 158 },
    footer: { maxHeight: 80, maxWidth: 157 },
    icon: { maxHeight: 88, maxWidth: 88 },
  },
  C: {
    id: "C",
    name: "Stacked 3D",
    description: "Embossed OM mark with gradient text",
    src: "/logos/clean/logo-c-embossed-clean.png",
    layout: "image",
    header: { maxHeight: 99, maxWidth: 202 },
    footer: { maxHeight: 124, maxWidth: 248 },
    icon: { maxHeight: 133, maxWidth: 133 },
  },
  D: {
    id: "D",
    name: "Stacked Gradient",
    description: "Bold OM icon with full gradient wordmark",
    src: "/logos/clean/logo-d-gradient-clean.png",
    layout: "image",
    header: { maxHeight: 85, maxWidth: 165 },
    footer: { maxHeight: 105, maxWidth: 202 },
    icon: { maxHeight: 111, maxWidth: 111 },
  },
};

export function isLogoPreviewEnabled() {
  return false;
}

export function getLogoSlot(
  variantId: LogoVariantId,
  placement: "header" | "footer" | "icon"
): LogoDisplaySlot {
  const v = LOGO_VARIANTS[variantId];
  if (placement === "header") {
    if (v.layout === "split") return v.headerIcon;
    return v.header;
  }
  return v[placement];
}

export function isSplitLogo(variantId: LogoVariantId): boolean {
  return LOGO_VARIANTS[variantId].layout === "split";
}
