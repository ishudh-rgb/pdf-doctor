import type { Metadata } from "next";
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
  ArrowRight,
  Table,
  Presentation,
  FileSpreadsheet,
  Stamp,
  type LucideIcon,
} from "lucide-react";
import { TOOLS } from "@/config/constants";
export const metadata: Metadata = {
  title: "All PDF Tools - PDF Doctor",
  description:
    "Browse every PDF tool available on PDF Doctor — merge, split, compress, convert, edit, sign, protect, unlock, scan, and AI-powered summarization.",
};

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

export default function AllToolsPage() {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    key: cat,
    label: CATEGORY_LABELS[cat] ?? cat,
    tools: TOOLS.filter((t) => t.category === cat),
  })).filter((g) => g.tools.length > 0);

  return (
    <>
      <main className="bg-gray-50">
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              All PDF Tools
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-center text-gray-500">
              Choose from our complete collection of free and premium PDF tools.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
          {grouped.map((group) => (
            <section key={group.key} className="mt-14 first:mt-8">
              <h2 className="text-xl font-bold text-gray-900">{group.label}</h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {group.tools.map((tool) => {
                  const Icon = ICON_MAP[tool.icon];
                  return (
                    <Link
                      key={tool.slug}
                      href={`/${tool.slug}`}
                      className="group relative flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      {tool.isPro && (
                        <span className="absolute right-3 top-3 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                          Pro
                        </span>
                      )}
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${tool.color}14` }}
                      >
                        {Icon && (
                          <Icon
                            className="h-5 w-5"
                            style={{ color: tool.color }}
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                          {tool.name}
                        </h3>
                        <p className="mt-0.5 text-sm text-gray-500">
                          {tool.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
