"use client";

import { createContext, useContext, useMemo } from "react";
import { usePathname } from "next/navigation";
import { getToolSEO } from "@/config/tools";
import type { ToolSEO } from "@/types";

const ToolSeoContext = createContext<ToolSEO | undefined>(undefined);

export function ToolSeoProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const slug = pathname.replace(/^\//, "").split("/")[0] ?? "";
  const seo = useMemo(() => getToolSEO(slug), [slug]);

  return <ToolSeoContext.Provider value={seo}>{children}</ToolSeoContext.Provider>;
}

export function useToolSeo(): ToolSEO | undefined {
  return useContext(ToolSeoContext);
}
