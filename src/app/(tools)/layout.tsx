"use client";

import { ToolLayoutChrome } from "@/components/layout/tool-layout-chrome";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ToolLayoutChrome>{children}</ToolLayoutChrome>;
}
