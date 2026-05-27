"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Download, Clock, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DashboardShell } from "@/components/layout/dashboard-shell";
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

const statusConfig = {
  completed: { label: "Completed", className: "bg-pd-brand-muted text-pd-brand" },
  processing: { label: "Processing", className: "bg-amber-100 text-amber-700" },
  failed: { label: "Failed", className: "bg-red-100 text-red-700" },
};

export default function MyFilesPage() {
  const [files, setFiles] = useState<FileJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchFiles() {
      try {
        const res = await fetch("/api/user/files");
        if (res.ok) {
          const json = await res.json();
          setFiles(json.files || []);
        } else {
          setError("Failed to load files. Please try again.");
        }
      } catch {
        setError("Failed to load files. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  }, []);

  return (
    <DashboardShell
      title="My Files"
      subtitle="View your file processing history and download results."
    >
          {loading ? (
            <div className="overflow-hidden rounded-xl border border-pd-border bg-pd-surface">
              <div className="animate-pulse">
                <div className="border-b border-pd-border bg-pd-background px-4 py-3">
                  <div className="flex gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-4 w-20 rounded bg-pd-border" />
                    ))}
                  </div>
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 border-b border-pd-border px-4 py-4">
                    <div className="h-4 w-32 rounded bg-pd-border/60" />
                    <div className="h-4 w-24 rounded bg-pd-border/60" />
                    <div className="h-4 w-20 rounded bg-pd-border/60" />
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
              <p className="mt-2 text-sm text-red-600">{error}</p>
            </div>
          ) : files.length === 0 ? (
            <div className="rounded-xl border border-pd-border bg-pd-surface p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-pd-muted" />
              <h2 className="mt-4 text-lg font-semibold text-pd-foreground">No files yet</h2>
              <p className="mt-2 text-sm text-pd-muted">Start using PDF tools to see your history here.</p>
              <Link href="/#tools" className="mt-6 inline-block">
                <Button>Browse Tools</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-pd-border bg-pd-surface">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-pd-border bg-pd-background">
                      <th className="px-4 py-3 font-medium text-pd-muted">File Name</th>
                      <th className="px-4 py-3 font-medium text-pd-muted">Tool</th>
                      <th className="hidden px-4 py-3 font-medium text-pd-muted sm:table-cell">Date</th>
                      <th className="px-4 py-3 font-medium text-pd-muted">Status</th>
                      <th className="hidden px-4 py-3 font-medium text-pd-muted md:table-cell">Size</th>
                      <th className="px-4 py-3 font-medium text-pd-muted">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pd-border">
                    {files.map((file) => {
                      const status = statusConfig[file.status];
                      return (
                        <tr key={file.id} className="transition-colors hover:bg-pd-background/80">
                          <td className="max-w-[200px] truncate px-4 py-3 font-medium text-pd-foreground">
                            {file.file_name}
                          </td>
                          <td className="px-4 py-3 text-pd-muted">{file.tool}</td>
                          <td className="hidden px-4 py-3 text-pd-muted sm:table-cell">
                            {formatDate(file.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", status.className)}>
                              {status.label}
                            </span>
                          </td>
                          <td className="hidden px-4 py-3 text-pd-muted md:table-cell">
                            {formatFileSize(file.file_size)}
                          </td>
                          <td className="px-4 py-3">
                            {file.status === "completed" && !file.expired && file.download_url ? (
                              <a
                                href={file.download_url}
                                className="inline-flex items-center gap-1 rounded-lg bg-pd-brand-muted px-3 py-1.5 text-xs font-medium text-pd-brand transition hover:opacity-90"
                              >
                                <Download className="h-3.5 w-3.5" />
                                Download
                              </a>
                            ) : file.status === "completed" && file.expired ? (
                              <span className="inline-flex items-center gap-1 text-xs text-pd-muted">
                                <Clock className="h-3.5 w-3.5" />
                                Expired
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
    </DashboardShell>
  );
}
