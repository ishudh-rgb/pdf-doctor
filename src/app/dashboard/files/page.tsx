"use client";

import { useState, useEffect } from "react";
import { Download, Clock, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
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
  completed: { label: "Completed", className: "bg-green-100 text-green-700" },
  processing: { label: "Processing", className: "bg-yellow-100 text-yellow-700" },
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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">My Files</h1>
            <p className="mt-1 text-sm text-gray-500">
              View your file processing history and download results.
            </p>
          </div>

          {loading ? (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="animate-pulse">
                <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3">
                  <div className="flex gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-4 w-20 rounded bg-gray-200" />
                    ))}
                  </div>
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 border-b border-gray-50 px-4 py-4">
                    <div className="h-4 w-32 rounded bg-gray-100" />
                    <div className="h-4 w-24 rounded bg-gray-100" />
                    <div className="h-4 w-20 rounded bg-gray-100" />
                    <div className="h-4 w-16 rounded bg-gray-100" />
                    <div className="h-4 w-16 rounded bg-gray-100" />
                    <div className="h-4 w-20 rounded bg-gray-100" />
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
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-300" />
              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                No files yet
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Start using PDF tools to see your history here.
              </p>
              <a
                href="/#tools"
                className="mt-6 inline-flex items-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Browse Tools
              </a>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-4 py-3 font-medium text-gray-500">File Name</th>
                      <th className="px-4 py-3 font-medium text-gray-500">Tool</th>
                      <th className="hidden px-4 py-3 font-medium text-gray-500 sm:table-cell">Date</th>
                      <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                      <th className="hidden px-4 py-3 font-medium text-gray-500 md:table-cell">Size</th>
                      <th className="px-4 py-3 font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {files.map((file) => {
                      const status = statusConfig[file.status];
                      return (
                        <tr key={file.id} className="transition-colors hover:bg-gray-50">
                          <td className="max-w-[200px] truncate px-4 py-3 font-medium text-gray-900">
                            {file.file_name}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{file.tool}</td>
                          <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                            {formatDate(file.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                                status.className
                              )}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td className="hidden px-4 py-3 text-gray-500 md:table-cell">
                            {formatFileSize(file.file_size)}
                          </td>
                          <td className="px-4 py-3">
                            {file.status === "completed" && !file.expired && file.download_url ? (
                              <a
                                href={file.download_url}
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
                              >
                                <Download className="h-3.5 w-3.5" />
                                Download
                              </a>
                            ) : file.status === "completed" && file.expired ? (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
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
      </div>
    </div>
  );
}
