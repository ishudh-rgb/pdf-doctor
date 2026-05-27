"use client";

import { useDesignPreview } from "@/components/design/design-preview-provider";
import { HomeLayoutA } from "@/components/marketing/home/layouts/home-layout-a";
import { HomeLayoutB } from "@/components/marketing/home/layouts/home-layout-b";
import { HomeLayoutC } from "@/components/marketing/home/layouts/home-layout-c";
import { HomeLayoutD } from "@/components/marketing/home/layouts/home-layout-d";
import { HomeLayoutE } from "@/components/marketing/home/layouts/home-layout-e";
import type { LayoutStyleId } from "@/config/design-system";

const HOME_LAYOUTS: Record<LayoutStyleId, React.ComponentType> = {
  A: HomeLayoutA,
  B: HomeLayoutB,
  C: HomeLayoutC,
  D: HomeLayoutD,
  E: HomeLayoutE,
};

export function HomePageContent() {
  const { layoutStyle } = useDesignPreview();
  const Layout = HOME_LAYOUTS[layoutStyle];
  return <Layout />;
}
