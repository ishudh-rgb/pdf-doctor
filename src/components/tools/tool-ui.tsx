"use client";

import { Upload, Loader2, Download, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

interface ToolDropzoneProps {
  hint: string;
  subHint?: string;
  dragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  className?: string;
}

export function ToolDropzone({
  hint,
  subHint,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  className,
}: ToolDropzoneProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200",
        dragOver
          ? "border-pd-brand bg-pd-brand-muted"
          : "border-pd-border hover:border-pd-brand/50 hover:bg-pd-background",
        className
      )}
    >
      <Upload className="mx-auto mb-3 h-10 w-10 text-pd-muted" />
      <p className="font-medium text-pd-foreground">{hint}</p>
      {subHint && <p className="mt-1 text-sm text-pd-muted">{subHint}</p>}
    </div>
  );
}

export function ToolErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

interface ToolSuccessPanelProps {
  title: string;
  description?: string;
  downloadUrl: string;
  downloadFilename: string;
  downloadLabel: string;
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
  onReset,
  resetLabel = "Process another file",
  children,
}: ToolSuccessPanelProps) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pd-brand-muted">
        <Download className="h-8 w-8 text-pd-brand" />
      </div>
      <h2 className="text-xl font-bold text-pd-foreground">{title}</h2>
      {description && <p className="mt-2 text-pd-muted">{description}</p>}
      {children}
      <a href={downloadUrl} download={downloadFilename} className="mt-6 inline-block">
        <Button size="lg">
          <Download className="h-5 w-5" />
          {downloadLabel}
        </Button>
      </a>
      <button
        type="button"
        onClick={onReset}
        className="mx-auto mt-4 block text-sm text-pd-muted transition hover:text-pd-foreground"
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
  children: React.ReactNode;
  className?: string;
}

export function ToolPrimaryButton({
  onClick,
  disabled,
  loading,
  loadingLabel,
  children,
  className,
}: ToolPrimaryButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      size="lg"
      className={cn("mt-6 w-full", className)}
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
