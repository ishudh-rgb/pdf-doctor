"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Layers,
  Minimize2,
  Printer,
  Scissors,
  Share2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/utils/file";
import Link from "next/link";

interface ExtractResultViewProps {
  originalFile: File;
  resultUrl: string;
  extractedCount: number;
  onStartOver: () => void;
}

interface ResultPageThumb {
  url: string;
  width: number;
}

const CONTINUE_TOOLS = [
  { name: "Compress", slug: "compress-pdf", icon: Minimize2, color: "text-orange-500", bg: "bg-orange-50" },
  { name: "Merge", slug: "merge-pdf", icon: Layers, color: "text-green-500", bg: "bg-green-50" },
  { name: "Split", slug: "split-pdf", icon: Scissors, color: "text-blue-500", bg: "bg-blue-50" },
  { name: "Delete Pages", slug: "delete-pdf", icon: Trash2, color: "text-red-500", bg: "bg-red-50" },
];

const SMART_TIPS = [
  { name: "Split", slug: "split-pdf", icon: Scissors, color: "text-purple-600", bg: "bg-purple-50" },
  { name: "Delete Pages", slug: "delete-pdf", icon: Trash2, color: "text-red-600", bg: "bg-red-50" },
];

export function ExtractResultView({
  originalFile,
  resultUrl,
  extractedCount,
  onStartOver,
}: ExtractResultViewProps) {
  const [resultThumbs, setResultThumbs] = useState<ResultPageThumb[]>([]);
  const [resultPages, setResultPages] = useState(0);
  const [resultSize, setResultSize] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);
  const resultFileName = originalFile.name.replace(/\.pdf$/i, "-pages.pdf");

  useEffect(() => {
    let cancelled = false;

    async function loadResultPreview() {
      try {
        const res = await fetch(resultUrl);
        const blob = await res.blob();
        setResultSize(blob.size);

        const file = new File([blob], resultFileName, { type: "application/pdf" });
        const formData = new FormData();
        formData.append("file", file, resultFileName);

        const sessionRes = await fetch("/api/tools/pdf-session", {
          method: "POST",
          body: formData,
        });
        const sessionData = await sessionRes.json() as {
          sessionId?: string;
          totalPages?: number;
        };

        if (cancelled || !sessionData.sessionId || !sessionData.totalPages) return;

        setResultPages(sessionData.totalPages);

        const thumbs: ResultPageThumb[] = [];
        for (let i = 1; i <= sessionData.totalPages; i++) {
          thumbs.push({
            url: `/api/tools/pdf-thumb?session=${encodeURIComponent(sessionData.sessionId)}&page=${i}&width=800`,
            width: 800,
          });
        }
        if (!cancelled) setResultThumbs(thumbs);
      } catch {
        // Preview failed — non-critical
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    }

    loadResultPreview();
    return () => { cancelled = true; };
  }, [resultUrl, resultFileName]);

  const handlePrint = () => {
    const printWindow = window.open(resultUrl, "_blank");
    if (printWindow) {
      printWindow.addEventListener("load", () => {
        printWindow.print();
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        const res = await fetch(resultUrl);
        const blob = await res.blob();
        const file = new File([blob], resultFileName, { type: "application/pdf" });
        await navigator.share({ files: [file], title: resultFileName });
      } catch { /* user cancelled */ }
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col lg:flex-row">
        {/* Left: Live page preview */}
        <div
          ref={previewRef}
          className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 p-6 lg:max-h-[calc(100vh-200px)]"
        >
          {loadingPreview ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-300 border-t-blue-600" />
              <p className="text-sm text-gray-500">Loading preview…</p>
            </div>
          ) : resultThumbs.length > 0 ? (
            <div className="mx-auto flex max-w-2xl flex-col gap-4">
              {resultThumbs.map((thumb, i) => (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md"
                >
                  <img
                    src={thumb.url}
                    alt={`Page ${i + 1}`}
                    className="w-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                  {/* Page watermark */}
                  <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/80 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
                    {i + 1}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <FileText className="h-12 w-12 text-gray-300" />
              <p className="text-sm text-gray-400">Preview not available</p>
            </div>
          )}
        </div>

        {/* Right: Info sidebar */}
        <div className="w-full shrink-0 border-t border-gray-200 bg-white p-6 lg:w-80 lg:border-l lg:border-t-0 xl:w-96">
          {/* Done header */}
          <div className="mb-5 flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-green-500" />
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900">Done</h2>
              <p className="mt-0.5 truncate text-sm font-medium text-gray-700" title={resultFileName}>
                {resultFileName}
              </p>
              <p className="mt-0.5 text-sm text-gray-400">
                {resultSize > 0 ? formatFileSize(resultSize) : ""}{" "}
                {resultPages > 0 ? `· ${resultPages} page${resultPages !== 1 ? "s" : ""}` : `${extractedCount} page${extractedCount !== 1 ? "s" : ""} extracted`}
              </p>
            </div>
          </div>

          {/* Download button */}
          <a
            href={resultUrl}
            download={resultFileName}
            className="block"
          >
            <Button className="w-full gap-2 rounded-xl py-3 text-base font-semibold">
              <Download className="h-5 w-5" />
              Download
            </Button>
          </a>

          {/* Action icons */}
          <div className="mt-4 flex items-center justify-center gap-1 border-b border-gray-100 pb-4">
            {navigator.share && (
              <button
                type="button"
                onClick={handleShare}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                title="Share"
              >
                <Share2 className="h-4.5 w-4.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="Print"
            >
              <Printer className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Smart tip */}
          {extractedCount >= 3 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <p className="mb-2 text-sm font-semibold text-gray-800">
                Smart tip! <span className="text-amber-500">💡</span>
              </p>
              <p className="mb-3 text-xs text-gray-500">
                That&apos;s a lot of pages in one document. Why not try:
              </p>
              <div className="flex flex-col gap-1.5">
                {SMART_TIPS.map((tip) => (
                  <Link
                    key={tip.slug}
                    href={`/${tip.slug}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-white"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${tip.bg}`}>
                        <tip.icon className={`h-3.5 w-3.5 ${tip.color}`} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{tip.name}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Continue in */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Continue in
            </p>
            <div className="flex flex-col gap-1">
              {CONTINUE_TOOLS.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/${tool.slug}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${tool.bg}`}>
                      <tool.icon className={`h-3.5 w-3.5 ${tool.color}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{tool.name}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </Link>
              ))}
            </div>
          </div>

          {/* Start over */}
          <button
            type="button"
            onClick={onStartOver}
            className="mt-6 w-full rounded-lg border border-gray-200 py-2.5 text-center text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            Extract from another file
          </button>
        </div>
      </div>
    </div>
  );
}
