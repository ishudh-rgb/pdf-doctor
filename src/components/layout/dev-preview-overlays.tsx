"use client";

import dynamic from "next/dynamic";

const DesignPreviewLab = dynamic(
  () =>
    import("@/components/design/design-preview-lab").then((m) => ({
      default: m.DesignPreviewLab,
    })),
  { ssr: false }
);

const HeroVariantSwitch = dynamic(
  () =>
    import("@/components/marketing/hero-variant-switch").then((m) => ({
      default: m.HeroVariantSwitch,
    })),
  { ssr: false }
);

export function DevPreviewOverlays() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_DESIGN_PREVIEW !== "true"
  ) {
    return null;
  }

  return (
    <>
      <DesignPreviewLab />
      <HeroVariantSwitch />
    </>
  );
}
