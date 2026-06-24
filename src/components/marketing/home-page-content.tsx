"use client";

import dynamic from "next/dynamic";
import { HomeLayoutB } from "@/components/marketing/home/layouts/home-layout-b";
import { useDesignPreview } from "@/components/design/design-preview-provider";
import { DESIGN_LOCKED } from "@/config/design-system";

const HomeLayoutPreview = dynamic(
  () => import("@/components/marketing/home-layout-preview"),
  { ssr: false }
);

export function HomePageContent() {
  const { previewEnabled } = useDesignPreview();

  if (DESIGN_LOCKED && !previewEnabled) {
    return <HomeLayoutB />;
  }

  return <HomeLayoutPreview />;
}
