"use client";

import { ToolLayoutChrome } from "@/components/layout/tool-layout-chrome";
import { ToolSeoProvider } from "@/lib/seo/tool-seo-context";

export function ToolLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ToolSeoProvider>
      <ToolLayoutChrome>{children}</ToolLayoutChrome>
    </ToolSeoProvider>
  );
}
