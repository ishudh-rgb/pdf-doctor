"use client";

import { useState, useEffect } from "react";
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Job {
  id: string;
  user_email: string | null;
  tool: string;
  status: "pending" | "processing" | "completed" | "failed";
  file_size: number;
  processing_time_ms: number | null;
  created_at: string;
  error_message?: string;
  input_file_name?: string;
  output_file_name?: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-pd-border text-pd-muted",
  processing: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const toolOptions = [
  "All",
  "merge-pdf",
  "split-pdf",
  "compress-pdf",
  "pdf-to-word",
  "word-to-pdf",
  "jpg-to-pdf",
  "edit-pdf",
  "sign-pdf",
  "ai-pdf-summarizer",
  "pdf-scanner",
  "unlock-pdf",
  "protect-pdf",
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PAGE_SIZE = 15;

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [toolFilter, setToolFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (statusFilter !== "All") params.set("status", statusFilter.toLowerCase());
        if (toolFilter !== "All") params.set("tool", toolFilter);
        const res = await fetch(`/api/admin/jobs?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setJobs(json.jobs || []);
        }
      } catch {
        // Keep empty
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, [statusFilter, toolFilter]);

  const totalPages = Math.ceil(jobs.length / PAGE_SIZE);
  const paginatedJobs = jobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-pd-foreground">Tool Jobs</h2>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 rounded-xl border border-pd-border bg-pd-surface pl-3 pr-8 text-sm text-pd-muted focus:border-pd-brand focus:outline-none focus:ring-2 focus:ring-pd-brand/20"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
        <div className="relative">
          <select
            value={toolFilter}
            onChange={(e) => { setToolFilter(e.target.value); setPage(1); }}
            className="h-10 rounded-xl border border-pd-border bg-pd-surface pl-3 pr-8 text-sm text-pd-muted focus:border-pd-brand focus:outline-none focus:ring-2 focus:ring-pd-brand/20"
          >
            {toolOptions.map((tool) => (
              <option key={tool} value={tool}>
                {tool === "All" ? "All Tools" : tool}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-pd-surface border border-pd-border shadow-sm overflow-hidden">
          <div className="animate-pulse">
            <div className="border-b border-pd-border bg-pd-background/50 px-4 py-3">
              <div className="flex gap-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-4 w-16 rounded bg-pd-border" />
                ))}
              </div>
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4 border-b border-pd-border px-4 py-4">
                <div className="h-4 w-20 rounded bg-pd-border/60" />
                <div className="h-4 w-32 rounded bg-pd-border/60" />
                <div className="h-4 w-24 rounded bg-pd-border/60" />
                <div className="h-4 w-16 rounded bg-pd-border/60" />
                <div className="h-4 w-16 rounded bg-pd-border/60" />
                <div className="h-4 w-16 rounded bg-pd-border/60" />
                <div className="h-4 w-24 rounded bg-pd-border/60" />
              </div>
            ))}
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl bg-pd-surface border border-pd-border shadow-sm p-12 text-center">
          <Search className="mx-auto h-10 w-10 text-pd-muted" />
          <h3 className="mt-4 text-lg font-semibold text-pd-foreground">No jobs found</h3>
          <p className="mt-1 text-sm text-pd-muted">
            No jobs match the current filters.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-pd-surface border border-pd-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-pd-border bg-pd-background/50">
                    <th className="px-4 py-3 font-medium text-pd-muted">Job ID</th>
                    <th className="px-4 py-3 font-medium text-pd-muted">User</th>
                    <th className="px-4 py-3 font-medium text-pd-muted">Tool</th>
                    <th className="px-4 py-3 font-medium text-pd-muted">Status</th>
                    <th className="hidden px-4 py-3 font-medium text-pd-muted md:table-cell">Size</th>
                    <th className="hidden px-4 py-3 font-medium text-pd-muted lg:table-cell">Time</th>
                    <th className="px-4 py-3 font-medium text-pd-muted">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pd-border">
                  {paginatedJobs.map((job) => (
                    <>
                      <tr
                        key={job.id}
                        onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                        className="cursor-pointer transition-colors hover:bg-pd-background"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-pd-muted">
                          {job.id.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-pd-muted">
                          {job.user_email || "Guest"}
                        </td>
                        <td className="px-4 py-3 text-pd-foreground font-medium">
                          {job.tool}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", statusColors[job.status])}>
                            {job.status}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 text-pd-muted md:table-cell">
                          {formatFileSize(job.file_size)}
                        </td>
                        <td className="hidden px-4 py-3 text-pd-muted lg:table-cell">
                          {job.processing_time_ms ? `${(job.processing_time_ms / 1000).toFixed(1)}s` : "—"}
                        </td>
                        <td className="px-4 py-3 text-pd-muted">
                          {formatDate(job.created_at)}
                        </td>
                      </tr>
                      {expandedJob === job.id && (
                        <tr key={`${job.id}-detail`}>
                          <td colSpan={7} className="bg-pd-background px-4 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                              <div>
                                <p className="text-xs text-pd-muted">Full Job ID</p>
                                <p className="font-mono text-xs text-pd-foreground">{job.id}</p>
                              </div>
                              <div>
                                <p className="text-xs text-pd-muted">Input File</p>
                                <p className="text-pd-foreground">{job.input_file_name || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-pd-muted">Output File</p>
                                <p className="text-pd-foreground">{job.output_file_name || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-pd-muted">Error</p>
                                <p className="text-red-600">{job.error_message || "None"}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-pd-muted">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, jobs.length)} of {jobs.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-pd-border bg-pd-surface text-pd-muted transition hover:bg-pd-background disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-pd-muted">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-pd-border bg-pd-surface text-pd-muted transition hover:bg-pd-background disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
