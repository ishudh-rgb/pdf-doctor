"use client";

import { Loader2, Download, AlertCircle, Upload, FileUp, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatFileSize } from "@/lib/utils/file";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/ui/circular-progress";

export function ToolResultSizeBadge({
  sizeBytes,
  className,
}: {
  sizeBytes: number;
  className?: string;
}) {
  return (
    <p className={cn("mt-2 text-xs text-pd-muted", className)}>
      Output size{" "}
      <span className="font-semibold tabular-nums text-pd-foreground">
        {formatFileSize(sizeBytes)}
      </span>
    </p>
  );
}
interface ToolDropzoneProps {
  hint?: string;
  subHint?: string;
  dragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onChooseFiles: () => void;
  chooseLabel?: string;
  className?: string;
}

export function ToolDropzone({
  hint = "or drag and drop your file here",
  subHint,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onChooseFiles,
  chooseLabel = "Select file",
  className,
}: ToolDropzoneProps) {
  return (
    <div className={cn("w-full", className)}>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "rounded-xl border-2 border-dashed px-4 py-5 text-center transition-all duration-200",
          dragOver
            ? "border-pd-brand bg-pd-brand-muted/80"
            : "border-pd-border bg-pd-background hover:border-pd-brand/40 hover:bg-pd-brand-muted/30"
        )}
      >
        <div
          className={cn(
            "mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
            dragOver ? "bg-pd-brand text-white" : "bg-pd-brand-muted text-pd-brand"
          )}
        >
          <Upload className="h-5 w-5" strokeWidth={2} />
        </div>

        <Button type="button" size="md" className="gap-2" onClick={onChooseFiles}>
          <FileUp className="h-4 w-4" />
          {chooseLabel}
        </Button>

        <p className="mt-2 text-sm text-pd-muted">{hint}</p>
        {subHint && <p className="mt-1 text-xs text-pd-muted/90">{subHint}</p>}
      </div>
    </div>
  );
}

export function ToolErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-3 flex w-full items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

interface ToolSuccessPanelProps {
  title: string;
  description?: string;
  downloadUrl: string;
  downloadFilename: string;
  downloadLabel: string;
  resultSizeBytes?: number;
  onReset: () => void;
  resetLabel?: string;
  children?: React.ReactNode;
}

export function ToolSuccessPanel({
  title,
  description,
  downloadUrl,
  downloadFilename,
  downloadLabel,
  resultSizeBytes,
  onReset,
  resetLabel = "Process another file",
  children,
}: ToolSuccessPanelProps) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-pd-brand-muted">
        <Download className="h-7 w-7 text-pd-brand" />
      </div>
      <h2 className="text-lg font-bold text-pd-foreground">{title}</h2>
      {description && <p className="mt-2 text-sm text-pd-muted">{description}</p>}
      {resultSizeBytes !== undefined && resultSizeBytes > 0 && (
        <ToolResultSizeBadge sizeBytes={resultSizeBytes} />
      )}
      {children}
      <a href={downloadUrl} download={downloadFilename} className="mt-5 inline-block">
        <Button size="md">{downloadLabel}</Button>
      </a>
      <button
        type="button"
        onClick={onReset}
        className="mx-auto mt-3 block text-sm text-pd-muted transition hover:text-pd-foreground"
      >
        {resetLabel}
      </button>
    </div>
  );
}

interface ToolWorkspaceReadyPanelProps {
  title?: string;
  description: string;
  downloadUrl: string;
  downloadFilename: string;
  downloadLabel?: string;
  resultSizeBytes?: number;
  resetLabel: string;
  onReset: () => void;
}

export function ToolWorkspaceReadyPanel({
  title = "PDF ready",
  description,
  downloadUrl,
  downloadFilename,
  downloadLabel = "Download",
  resultSizeBytes,
  resetLabel,
  onReset,
}: ToolWorkspaceReadyPanelProps) {
  return (
    <div className="rounded-xl border border-pd-border bg-pd-surface p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-pd-brand-muted">
        <Check className="h-7 w-7 text-pd-brand" />
      </div>
      <h2 className="text-lg font-bold text-pd-foreground">{title}</h2>
      <p className="mt-2 text-sm text-pd-muted">{description}</p>
      {resultSizeBytes !== undefined && resultSizeBytes > 0 && (
        <ToolResultSizeBadge sizeBytes={resultSizeBytes} />
      )}
      <a href={downloadUrl} download={downloadFilename} className="mt-5 inline-block">
        <Button size="md">{downloadLabel}</Button>
      </a>
      <button
        type="button"
        onClick={onReset}
        className="mx-auto mt-3 block text-sm text-pd-muted transition hover:text-pd-foreground"
      >
        {resetLabel}
      </button>
    </div>
  );
}

interface ToolPrimaryButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  loadingProgress?: number;
  children: React.ReactNode;
  className?: string;
}

export function ToolPrimaryButton({
  onClick,
  disabled,
  loading,
  loadingLabel,
  loadingProgress,
  children,
  className,
}: ToolPrimaryButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      size="md"
      className={cn("mt-4 h-10 w-full font-semibold", className)}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2.5">
          {typeof loadingProgress === "number" ? (
            <CircularProgress value={loadingProgress} size={30} strokeWidth={2.5} />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {loadingLabel}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
