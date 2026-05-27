"use client";

import Link from "next/link";
import {
  Layers,
  Scissors,
  Minimize2,
  FileText,
  FileUp,
  Image as ImageIcon,
  Pencil,
  PenTool,
  Sparkles,
  ScanLine,
  Unlock,
  Lock,
  Table,
  Presentation,
  FileSpreadsheet,
  Stamp,
  type LucideIcon,
} from "lucide-react";
import { TOOLS } from "@/config/constants";
import { MarketingPageShell } from "@/components/layout/marketing-page-shell";

const ICON_MAP: Record<string, LucideIcon> = {
  Layers,
  Scissors,
  Minimize2,
  FileText,
  FileUp,
  Image: ImageIcon,
  Pencil,
  PenTool,
  Sparkles,
  ScanLine,
  Unlock,
  Lock,
  Table,
  Presentation,
  FileSpreadsheet,
  Stamp,
};

const CATEGORY_LABELS: Record<string, string> = {
  organize: "Organize PDF",
  optimize: "Optimize PDF",
  "convert-from": "Convert from PDF",
  "convert-to": "Convert to PDF",
  edit: "Edit & Sign",
  security: "Security",
  ai: "AI Tools",
  scan: "Scan",
};

const CATEGORY_ORDER = [
  "organize",
  "optimize",
  "convert-from",
  "convert-to",
  "edit",
  "security",
  "ai",
  "scan",
];

export function AllToolsPageContent() {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    key: cat,
    label: CATEGORY_LABELS[cat] ?? cat,
    tools: TOOLS.filter((t) => t.category === cat),
  })).filter((g) => g.tools.length > 0);

  return (
    <MarketingPageShell
      title="All PDF Tools"
      description="Choose from our complete collection of free and premium PDF tools."
      eyebrow="Tools directory"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "All Tools" },
      ]}
    >
      {grouped.map((group) => (
        <section key={group.key} className="mt-12 first:mt-0">
          <h2 className="text-xl font-bold text-pd-foreground">{group.label}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {group.tools.map((tool) => {
              const Icon = ICON_MAP[tool.icon];
              return (
                <Link
                  key={tool.slug}
                  href={`/${tool.slug}`}
                  className="tool-card-glow group relative flex items-start gap-4 rounded-2xl border border-pd-border bg-pd-surface p-5 shadow-sm"
                >
                  {tool.isPro && (
                    <span className="absolute right-3 top-3 rounded-full bg-pd-brand px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      Pro
                    </span>
                  )}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pd-brand-muted text-pd-brand">
                    {Icon && <Icon className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-pd-foreground group-hover:text-pd-brand">
                      {tool.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-pd-muted">{tool.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </MarketingPageShell>
  );
}
