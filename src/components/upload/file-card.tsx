"use client";

import { FileText, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface FileCardFile {
  name: string;
  size: number;
  status: "idle" | "uploading" | "uploaded" | "error";
}

interface FileCardProps {
  file: FileCardFile;
  onRemove: () => void;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function truncateFilename(name: string, maxLen = 28): string {
  if (name.length <= maxLen) return name;
  const ext = name.lastIndexOf(".") !== -1 ? name.slice(name.lastIndexOf(".")) : "";
  const base = name.slice(0, name.lastIndexOf(".") !== -1 ? name.lastIndexOf(".") : name.length);
  const truncated = base.slice(0, maxLen - ext.length - 3);
  return `${truncated}...${ext}`;
}

const statusIcons = {
  idle: null,
  uploading: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
  uploaded: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  error: <AlertCircle className="h-4 w-4 text-red-500" />,
};

export function FileCard({ file, onRemove, className }: FileCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-shadow hover:shadow-sm",
        file.status === "error" && "border-red-200 bg-red-50",
        className
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
        <FileText className="h-5 w-5 text-red-600" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">
          {truncateFilename(file.name)}
        </p>
        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
      </div>

      <div className="flex items-center gap-2">
        {statusIcons[file.status]}
        <button
          onClick={onRemove}
          className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
          aria-label={`Remove ${file.name}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
