"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Code2,
  Download,
  FileText,
  Globe,
  Settings2,
  Upload,
  X,
  CheckCircle2,
  ChevronRight,
  Eye,
  Layers,
  Minimize2,
  Scissors,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatFileSize } from "@/lib/utils/file";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CircularProgress } from "@/components/ui/circular-progress";
import { useConversionProgress } from "@/hooks/use-conversion-progress";
import { PdfResultWorkspaceViewer } from "@/components/tools/pdf-result-workspace-viewer";
import { ToolHiddenFileInput } from "@/components/tools/tool-ui";

type PageSize = "a4" | "letter" | "auto";
type Orientation = "portrait" | "landscape";
type Margin = "none" | "small" | "medium";

const RELATED_TOOLS = [
  { name: "Compress", slug: "compress-pdf", icon: Minimize2, color: "text-orange-500", bg: "bg-orange-50" },
  { name: "Merge", slug: "merge-pdf", icon: Layers, color: "text-green-500", bg: "bg-green-50" },
  { name: "Split", slug: "split-pdf", icon: Scissors, color: "text-blue-500", bg: "bg-blue-50" },
  { name: "Delete Pages", slug: "delete-pdf", icon: Trash2, color: "text-red-500", bg: "bg-red-50" },
];

const ACCEPTED_EXTENSIONS = ".html,.htm,.xhtml,.mhtml,.svg";

export default function HtmlToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [previewSessionId, setPreviewSessionId] = useState<string | null>(null);
  const [previewTotalPages, setPreviewTotalPages] = useState(0);

  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [margin, setMargin] = useState<Margin>("small");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { progress, start: startProgress, complete: completeProgress, stop: stopProgress, reset: resetProgress } =
    useConversionProgress({ cap: 96, intervalMs: 400 });

  const handleFile = useCallback((picked: File) => {
    const ext = picked.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["html", "htm", "xhtml", "mhtml", "svg"].includes(ext)) {
      setError("Invalid file type. Only HTML, HTM, XHTML, MHTML, and SVG files are accepted.");
      return;
    }
    setFile(picked);
    setError(null);
    setCompleted(false);
    setResultUrl(null);
    setPreviewSessionId(null);
    setPreviewTotalPages(0);

    const reader = new FileReader();
    reader.onload = () => {
      setHtmlPreview(reader.result as string);
    };
    reader.readAsText(picked);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile]
  );

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    startProgress();

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 320_000);

    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      formData.append("pageSize", pageSize);
      formData.append("orientation", orientation);
      formData.append("margin", margin);

      const res = await fetch("/api/tools/html-to-pdf", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Failed to convert HTML to PDF.");
      }

      const blob = await res.blob();
      completeProgress();
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      setPreviewSessionId(res.headers.get("X-Pdf-Session-Id"));
      setPreviewTotalPages(
        parseInt(res.headers.get("X-Pdf-Total-Pages") ?? "0", 10) || 0
      );
      setCompleted(true);
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "AbortError"
          ? "Conversion timed out. Large HTML files can take 3–5 minutes — please try again."
          : err instanceof Error
            ? err.message
            : "An unexpected error occurred.";
      setError(message);
      stopProgress();
    } finally {
      window.clearTimeout(timeoutId);
      setProcessing(false);
    }
  };

  const reset = () => {
    resetProgress();
    setFile(null);
    setHtmlPreview(null);
    setCompleted(false);
    setResultUrl(null);
    setPreviewSessionId(null);
    setPreviewTotalPages(0);
    setResultSize(0);
    setPreviewSessionId(null);
    setPreviewTotalPages(0);
    setError(null);
  };

  const resultFileName = file?.name.replace(/\.(html?|xhtml|mhtml|svg)$/i, ".pdf") ?? "converted.pdf";

  useEffect(() => {
    if (htmlPreview && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlPreview);
        doc.close();
      }
    }
  }, [htmlPreview]);

  /* ─── Result View ─── */
  if (completed && resultUrl) {
    return (
      <div className="mx-auto flex h-[calc(100vh-var(--pd-header-height))] min-h-0 w-full max-w-[100rem] flex-col px-2 sm:px-3">
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
            <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
              <PdfResultWorkspaceViewer
                blobUrl={resultUrl}
                filename={resultFileName}
                initialSessionId={previewSessionId}
                initialTotalPages={previewTotalPages}
                className="h-full w-full"
              />
            </div>

            <div className="w-full shrink-0 overflow-y-auto border-t border-gray-200 bg-white p-5 lg:h-full lg:w-72 lg:border-l lg:border-t-0 xl:w-80">
              {/* Done header */}
              <div className="mb-5 flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-green-500" />
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900">Done</h2>
                  <p className="mt-0.5 truncate text-sm font-medium text-gray-700" title={resultFileName}>
                    {resultFileName}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-400">
                    {resultSize > 0 && formatFileSize(resultSize)}
                    {file && ` · from ${formatFileSize(file.size)} HTML`}
                  </p>
                </div>
              </div>

              {/* Download */}
              <a href={resultUrl} download={resultFileName} className="block">
                <Button className="w-full gap-2 rounded-xl py-3 text-base font-semibold">
                  <Download className="h-5 w-5" />
                  Download PDF
                </Button>
              </a>

              {/* Continue in */}
              <div className="mt-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Continue in
                </p>
                <div className="flex flex-col gap-1">
                  {RELATED_TOOLS.map((tool) => (
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
                onClick={reset}
                className="mt-6 w-full rounded-lg border border-gray-200 py-2.5 text-center text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
              >
                Convert another file
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Main Upload / Preview UI ─── */
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-200">
          <Code2 className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">HTML to PDF</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Convert HTML pages to pixel-perfect PDF documents
        </p>
      </div>

      {!file ? (
        /* ─── Dropzone ─── */
        <div
          className={cn(
            "mx-auto max-w-2xl cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200",
            dragOver
              ? "border-orange-400 bg-orange-50 shadow-lg shadow-orange-100"
              : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/30 hover:shadow-md"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-red-100">
            <Upload className="h-7 w-7 text-orange-500" />
          </div>
          <p className="text-lg font-semibold text-gray-700">
            Drop your HTML file here
          </p>
          <p className="mt-1 text-sm text-gray-400">
            or click to browse · Supports HTML, HTM, XHTML, SVG
          </p>
          <button
            type="button"
            className="mt-5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-200 transition-all hover:shadow-lg hover:shadow-orange-300"
          >
            Choose File
          </button>
        </div>
      ) : (
        /* ─── File loaded: Preview + toolbar ─── */
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Toolbar — file info, options, convert (same row) */}
          <div className="flex flex-wrap items-center gap-2.5 border-b border-gray-100 bg-white px-4 py-3 sm:gap-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                <Globe className="h-4.5 w-4.5 text-orange-600" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
              </div>
            </div>

            <span className="hidden h-5 w-px bg-gray-200 sm:block" />

            <div className="flex flex-wrap items-center gap-1.5">
              {(["a4", "letter", "auto"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  disabled={processing}
                  onClick={() => setPageSize(v)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50",
                    pageSize === v
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {v === "a4" ? "A4" : v === "letter" ? "Letter" : "Auto"}
                </button>
              ))}
            </div>

            <span className="hidden h-5 w-px bg-gray-200 md:block" />

            <div className="flex items-center gap-1.5">
              {(["portrait", "landscape"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  disabled={processing}
                  onClick={() => setOrientation(v)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-all disabled:opacity-50",
                    orientation === v
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>

            <span className="hidden h-5 w-px bg-gray-200 md:block" />

            <div className="flex items-center gap-1.5">
              {(["none", "small", "medium"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  disabled={processing}
                  onClick={() => setMargin(v)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-all disabled:opacity-50",
                    margin === v
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {v === "none" ? "No margin" : v}
                </button>
              ))}
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Button
                onClick={handleConvert}
                disabled={processing || !file}
                size="sm"
                className="h-9 gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 text-sm font-semibold shadow-sm shadow-orange-200 hover:from-orange-600 hover:to-red-600"
              >
                {processing ? (
                  <>
                    <CircularProgress value={progress} size={26} strokeWidth={2.5} className="text-white" />
                    Converting…
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Convert to PDF
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={reset}
                disabled={processing}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Live HTML preview */}
          <div className="bg-gradient-to-b from-gray-50 to-gray-100 px-5 py-5">
            <div className="mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Live Preview
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
              {htmlPreview ? (
                <iframe
                  ref={iframeRef}
                  sandbox="allow-same-origin"
                  className="h-[50vh] w-full"
                  title="HTML Preview"
                />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                  Loading preview…
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-5 mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      <ToolHiddenFileInput
        ref={fileInputRef}
        accept={ACCEPTED_EXTENSIONS}
        ariaLabel="Choose HTML or MHTML file to convert"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          e.target.value = "";
          if (picked) handleFile(picked);
        }}
      />

      {/* Features section */}
      <div className="mx-auto mt-12 max-w-3xl">
        <h2 className="mb-6 text-center text-xl font-bold text-gray-900">
          Why use our HTML to PDF converter?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Globe, title: "Pixel Perfect", desc: "Renders HTML exactly as a browser does — CSS, images, fonts, layouts" },
            { icon: Code2, title: "Full CSS Support", desc: "Handles Flexbox, Grid, animations, media queries, and print styles" },
            { icon: Eye, title: "Live Preview", desc: "See your HTML rendered before converting — what you see is what you get" },
            { icon: Settings2, title: "Customizable", desc: "Choose page size, orientation, and margins for your PDF output" },
            { icon: FileText, title: "Any HTML", desc: "Works with complex pages, SVGs, charts, dashboards, and reports" },
            { icon: CheckCircle2, title: "Privacy First", desc: "Files are processed on our servers and auto-deleted after 2 hours" },
          ].map((feat) => (
            <div
              key={feat.title}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100">
                <feat.icon className="h-4.5 w-4.5 text-orange-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800">{feat.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
