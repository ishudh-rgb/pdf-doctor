"use client";

import { ToolsFilterGrid } from "@/components/marketing/tools-filter-grid";

/** Homepage tool grid — iLovePDF-style pills + colored cards */
export function PopularToolsGrid() {
  return <ToolsFilterGrid className="[&_[role=tablist]]:sm:justify-center" />;
}
