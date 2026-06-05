"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Download,
  RefreshCcw,
  ChevronRight,
  Minimize2,
  Layers,
  PenTool,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/utils/file";

interface PdfResultPreviewProps {
  blobUrl: string;
  filename: string;
  fileSize?: number;
  pageCount?: number;
  onReset: () => void;
  resetLabel?: string;
}

const CONTINUE_TOOLS = [
  { name: "Compress", href: "/compress-pdf", icon: Minimize2, color: "text-emerald-600 bg-emerald-100" },
  { name: "Merge", href: "/merge-pdf", icon: Layers, color: "text-blue-600 bg-blue-100" },
  { name: "Sign", href: "/sign-pdf", icon: PenTool, color: "text-rose-600 bg-rose-100" },
  { name: "Protect", href: "/protect-pdf", icon: Lock, color: "text-amber-600 bg-amber-100" },
];

export function PdfResultPreview({
  blobUrl,
  filename,
  fileSize,
  pageCount,
  onReset,
  resetLabel = "Start over",
}: PdfResultPreviewProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      {/* Left: PDF preview via native browser viewer */}
      <div className="flex-1 min-w-0">
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner">
          {!iframeLoaded && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-pd-brand border-t-transparent" />
                <p className="text-sm text-pd-muted">Loading preview…</p>
              </div>
            </div>
          )}
          <iframe
            src={`${blobUrl}#toolbar=0&navpanes=0`}
            title="PDF Preview"
            className="h-[600px] w-full"
            onLoad={() => setIframeLoaded(true)}
          />
        </div>
      </div>

      {/* Right: Action panel */}
      <div className="w-full shrink-0 lg:w-[280px]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {/* Status */}
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            <span className="text-lg font-bold text-pd-foreground">Done</span>
          </div>

          {/* File info */}
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="truncate text-sm font-medium text-pd-foreground">{filename}</p>
            <p className="mt-0.5 text-xs text-pd-muted">
              {fileSize ? formatFileSize(fileSize) : ""}
              {pageCount && pageCount > 0 ? ` · ${pageCount} page${pageCount > 1 ? "s" : ""}` : ""}
            </p>
          </div>

          {/* Download */}
          <a href={blobUrl} download={filename} className="mt-4 block">
            <Button className="w-full gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
          </a>

          {/* Continue tools */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-pd-muted">
              Or continue in
            </p>
            <div className="space-y-1">
              {CONTINUE_TOOLS.map((tool) => (
                <Link
                  key={tool.name}
                  href={tool.href}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-pd-foreground transition-colors hover:bg-slate-50"
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-md ${tool.color}`}>
                    <tool.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex-1">{tool.name}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-pd-muted" />
                </Link>
              ))}
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={onReset}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-pd-muted transition-colors hover:bg-slate-50 hover:text-pd-foreground"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            {resetLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
