"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Download, Clock, FileText, AlertCircle, Search, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useTranslation } from "@/i18n";
import { DashboardMobileNav } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";

interface FileJob {
  id: string;
  file_name: string;
  tool: string;
  created_at: string;
  status: "completed" | "failed" | "processing";
  file_size: number;
  download_url: string | null;
  expired: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  if (diffHours < 48) return "Yesterday";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MyFilesPage() {
  const { t } = useTranslation();
  const [files, setFiles] = useState<FileJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const statusConfig = {
    completed: { label: t("dashboard.completed"), className: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/60" },
    processing: { label: t("dashboard.processing"), className: "bg-amber-100 text-amber-800 ring-1 ring-amber-200/60" },
    failed: { label: t("dashboard.failed"), className: "bg-red-100 text-red-700 ring-1 ring-red-200/60" },
  };

  useEffect(() => {
    async function fetchFiles() {
      try {
        const res = await fetch("/api/user/files");
        if (res.ok) {
          const json = await res.json();
          setFiles(json.files || []);
        } else if (res.status === 401) {
          setError(t("dashboard.filesAuthError"));
        } else {
          setFiles([]);
        }
      } catch {
        setError(t("dashboard.filesLoadError"));
      } finally {
        setLoading(false);
      }
    }
    void fetchFiles();
  }, [t]);

  const filtered = files.filter(
    (f) =>
      !search.trim() ||
      f.file_name.toLowerCase().includes(search.toLowerCase()) ||
      f.tool.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <DashboardMobileNav />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/dashboard"
            className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-pd-muted hover:text-pd-brand"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("dashboard.backToOverview")}
          </Link>
          <h1 className="text-2xl font-bold text-pd-foreground">{t("dashboard.myFiles")}</h1>
          <p className="mt-1 text-sm text-pd-muted">{t("dashboard.myFilesSubtitle")}</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pd-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("dashboard.searchFiles")}
            className="h-10 w-full rounded-xl border border-pd-border bg-pd-surface pl-9 pr-3 text-sm outline-none focus:border-pd-brand focus:ring-2 focus:ring-pd-brand/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-pd-border bg-pd-surface shadow-sm">
          <div className="animate-pulse p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-pd-border/40" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
          <p className="mt-2 text-sm text-red-600">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-pd-border bg-pd-surface p-12 text-center shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-pd-muted" />
          <h2 className="mt-4 text-lg font-bold text-pd-foreground">{t("dashboard.noActivity")}</h2>
          <p className="mt-2 text-sm text-pd-muted">{t("dashboard.noActivityDescription")}</p>
          <Link href="/#tools" className="mt-6 inline-block">
            <Button>{t("dashboard.browseTools")}</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-pd-border/70 bg-pd-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-pd-border bg-pd-background/80">
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-pd-muted">{t("dashboard.fileName")}</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-pd-muted">{t("dashboard.tool")}</th>
                  <th className="hidden px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-pd-muted sm:table-cell">{t("dashboard.date")}</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-pd-muted">{t("dashboard.status")}</th>
                  <th className="hidden px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-pd-muted md:table-cell">Size</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-pd-muted">{t("dashboard.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pd-border/60">
                {filtered.map((file) => {
                  const status = statusConfig[file.status];
                  return (
                    <tr key={file.id} className="transition-colors hover:bg-pd-background/50">
                      <td className="max-w-[200px] truncate px-5 py-4 font-semibold text-pd-foreground">
                        {file.file_name}
                      </td>
                      <td className="px-5 py-4 text-pd-muted">{file.tool}</td>
                      <td className="hidden px-5 py-4 text-pd-muted sm:table-cell">
                        {formatDate(file.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold", status.className)}>
                          {status.label}
                        </span>
                      </td>
                      <td className="hidden px-5 py-4 text-pd-muted md:table-cell">
                        {formatFileSize(file.file_size)}
                      </td>
                      <td className="px-5 py-4">
                        {file.status === "completed" && !file.expired && file.download_url ? (
                          <a
                            href={file.download_url}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-pd-brand-muted px-3 py-1.5 text-xs font-bold text-pd-brand transition hover:bg-pd-brand hover:text-white"
                          >
                            <Download className="h-3.5 w-3.5" />
                            {t("dashboard.download")}
                          </a>
                        ) : file.status === "completed" && file.expired ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-pd-muted">
                            <Clock className="h-3.5 w-3.5" />
                            {t("dashboard.expired")}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
