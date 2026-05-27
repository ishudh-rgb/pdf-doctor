"use client";

import Link from "next/link";
import {
  FileText,
  FileUp,
  Image as ImageIcon,
  Table,
  Presentation,
  FileSpreadsheet,
  ArrowRight,
} from "lucide-react";
import { MarketingPageShell } from "@/components/layout/marketing-page-shell";

const convertTools = [
  {
    name: "PDF to Word",
    slug: "pdf-to-word",
    description: "Convert PDF files to editable Word documents (.docx).",
    icon: FileText,
  },
  {
    name: "PDF to Excel",
    slug: "pdf-to-excel",
    description: "Extract PDF text and tables into an Excel spreadsheet (.xlsx).",
    icon: Table,
  },
  {
    name: "PDF to PowerPoint",
    slug: "pdf-to-ppt",
    description: "Turn PDF pages into an editable PowerPoint presentation (.pptx).",
    icon: Presentation,
  },
  {
    name: "Word to PDF",
    slug: "word-to-pdf",
    description: "Convert Word documents (.doc, .docx) to PDF format.",
    icon: FileUp,
  },
  {
    name: "Excel to PDF",
    slug: "excel-to-pdf",
    description: "Convert Excel spreadsheets (.xls, .xlsx) to PDF documents.",
    icon: FileSpreadsheet,
  },
  {
    name: "PowerPoint to PDF",
    slug: "ppt-to-pdf",
    description: "Convert PowerPoint presentations (.ppt, .pptx) to PDF.",
    icon: Presentation,
  },
  {
    name: "JPG to PDF",
    slug: "jpg-to-pdf",
    description: "Convert JPG, PNG, and other images to PDF.",
    icon: ImageIcon,
  },
];

export function ConvertPageContent() {
  return (
    <MarketingPageShell
      title="Convert PDF Files"
      description="Convert your documents to and from PDF format — free, fast, and secure."
      eyebrow="Convert"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Convert" }]}
    >
      <div className="grid gap-4">
        {convertTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.slug}
              href={`/${tool.slug}`}
              className="tool-card-glow group flex items-start gap-5 rounded-2xl border border-pd-border bg-pd-surface p-6 shadow-sm"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-pd-brand-muted text-pd-brand">
                <Icon className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-pd-foreground group-hover:text-pd-brand">
                  {tool.name}
                </h2>
                <p className="mt-1 text-sm text-pd-muted">{tool.description}</p>
              </div>
              <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-pd-muted group-hover:text-pd-brand" />
            </Link>
          );
        })}
      </div>
    </MarketingPageShell>
  );
}
