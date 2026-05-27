"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useDesignPreview } from "@/components/design/design-preview-provider";
import type { LayoutStyleId } from "@/config/design-system";

const TOOL_SLUG_LABELS: Record<string, string> = {
  "merge-pdf": "Merge PDF",
  "split-pdf": "Split PDF",
  "compress-pdf": "Compress PDF",
  "edit-pdf": "Edit PDF",
  "sign-pdf": "Sign PDF",
  "protect-pdf": "Protect PDF",
  "unlock-pdf": "Unlock PDF",
  "pdf-to-word": "PDF to Word",
  "word-to-pdf": "Word to PDF",
  "pdf-to-excel": "PDF to Excel",
  "excel-to-pdf": "Excel to PDF",
  "pdf-to-ppt": "PDF to PowerPoint",
  "ppt-to-pdf": "PowerPoint to PDF",
  "jpg-to-pdf": "JPG to PDF",
  "add-watermark": "Add Watermark",
  "pdf-scanner": "PDF Scanner",
  "ai-pdf-summarizer": "AI PDF Summarizer",
};

function ToolStepBar({ layout }: { layout: LayoutStyleId }) {
  if (layout !== "C" && layout !== "E") return null;

  const steps = ["Upload", "Options", "Download"];
  return (
    <div className="border-b border-pd-border bg-pd-surface">
      <div className="pd-container flex items-center justify-center gap-2 py-3 sm:gap-4">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                i === 0 ? "bg-pd-brand text-white" : "bg-pd-brand-muted text-pd-brand"
              }`}
            >
              {i + 1}
            </span>
            <span className="hidden text-sm font-medium text-pd-foreground sm:inline">{step}</span>
            {i < steps.length - 1 && (
              <ChevronRight className="hidden h-4 w-4 text-pd-muted sm:inline" aria-hidden />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ToolLayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { layoutStyle } = useDesignPreview();

  const slug = pathname.replace(/^\//, "");
  const toolLabel = TOOL_SLUG_LABELS[slug];

  return (
    <div className="pd-tool-layout-root flex min-h-screen flex-col">
      {toolLabel && (
        <nav aria-label="Breadcrumb" className="border-b border-pd-border bg-pd-surface/80 py-2.5">
          <div className="pd-container">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-pd-muted sm:text-sm">
              <li>
                <Link href="/" className="hover:text-pd-brand">
                  Home
                </Link>
              </li>
              <li className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5" />
                <Link href="/all-tools" className="hover:text-pd-brand">
                  Tools
                </Link>
              </li>
              <li className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="font-medium text-pd-foreground">{toolLabel}</span>
              </li>
            </ol>
          </div>
        </nav>
      )}

      <ToolStepBar layout={layoutStyle} />

      <div className="pd-tool-layout-body flex-1">{children}</div>
    </div>
  );
}
