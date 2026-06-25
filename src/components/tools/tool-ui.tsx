"use client";

import dynamic from "next/dynamic";
import { forwardRef, useId, type ChangeEvent, type InputHTMLAttributes, type RefObject } from "react";
import { Loader2, Download, AlertCircle, Upload, FileUp, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatFileSize } from "@/lib/utils/file";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/ui/circular-progress";

const CloudSourceButtons = dynamic(
  () =>
    import("@/components/upload/cloud-source-buttons").then((m) => ({
      default: m.CloudSourceButtons,
    })),
  { ssr: false }
);

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
  onCloudFiles?: (files: FileList | File[]) => void;
  onCloudError?: (message: string) => void;
  cloudAcceptExtensions?: string[];
  cloudMimeTypes?: string;
  cloudMultiple?: boolean;
  fileInputRef?: RefObject<HTMLInputElement | null>;
  fileInputAccept?: string;
  fileInputMultiple?: boolean;
  onFileInputChange?: (e: ChangeEvent<HTMLInputElement>) => void;
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
  onCloudFiles,
  onCloudError,
  cloudAcceptExtensions,
  cloudMimeTypes,
  cloudMultiple,
  fileInputRef,
  fileInputAccept,
  fileInputMultiple,
  onFileInputChange,
}: ToolDropzoneProps) {
  const zoneId = useId();
  const resolvedChooseLabel = chooseLabel;
  const resolvedHint = hint;

  return (
    <div className={cn("w-full", className)}>
      <div
        role="region"
        aria-labelledby={zoneId}
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
          {resolvedChooseLabel}
        </Button>

        <p id={zoneId} className="mt-2 text-sm text-pd-muted">
          {resolvedHint}
        </p>
        {subHint && <p className="mt-1 text-xs text-pd-muted/90">{subHint}</p>}
      </div>
      {fileInputRef ? (
        <ToolHiddenFileInput
          ref={fileInputRef}
          accept={fileInputAccept}
          multiple={fileInputMultiple}
          onChange={onFileInputChange}
          labelledBy={zoneId}
          ariaLabel="Choose file to upload"
        />
      ) : null}
      {onCloudFiles && (
        <CloudSourceButtons
          className="mt-3"
          onFilesSelected={(files) => onCloudFiles(files)}
          onError={onCloudError}
          acceptExtensions={cloudAcceptExtensions}
          mimeTypes={cloudMimeTypes}
          multiple={cloudMultiple}
        />
      )}
    </div>
  );
}

type ToolHiddenFileInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  ariaLabel: string;
  labelledBy?: string;
};

/** Screen-reader accessible off-screen file input for tool pages and workspaces. */
export const ToolHiddenFileInput = forwardRef<HTMLInputElement, ToolHiddenFileInputProps>(
  function ToolHiddenFileInput({ ariaLabel, labelledBy, type = "file", ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        {...props}
        aria-label={labelledBy ? undefined : ariaLabel}
        aria-labelledby={labelledBy}
        className="sr-only"
        tabIndex={-1}
      />
    );
  }
);

export function ToolErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mt-3 flex w-full items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
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
  originalSizeBytes?: number;
  savedPercent?: number;
  onReset: () => void;
  resetLabel?: string;
  children?: React.ReactNode;
}

function FileSizeComparison({
  originalSizeBytes,
  resultSizeBytes,
  savedPercent,
}: {
  originalSizeBytes: number;
  resultSizeBytes: number;
  savedPercent?: number;
}) {
  return (
    <div className="mt-5 w-full rounded-2xl border border-pd-border bg-pd-background p-4">
      <div
        className={cn(
          "grid items-center gap-3",
          savedPercent !== undefined
            ? "grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto_1fr]"
            : "grid-cols-1 sm:grid-cols-[1fr_auto_1fr]"
        )}
      >
        <div className="rounded-xl border border-pd-border/80 bg-pd-surface px-4 py-3 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-pd-muted">Original</p>
          <p className="mt-1 text-base font-bold tabular-nums text-pd-foreground">
            {formatFileSize(originalSizeBytes)}
          </p>
        </div>
        <div className="hidden text-lg text-pd-muted sm:block" aria-hidden>
          &rarr;
        </div>
        <div className="rounded-xl border border-pd-brand/25 bg-pd-brand-muted/50 px-4 py-3 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-pd-muted">Output</p>
          <p className="mt-1 text-base font-bold tabular-nums text-pd-brand">
            {formatFileSize(resultSizeBytes)}
          </p>
        </div>
        {savedPercent !== undefined && (
          <>
            <div className="hidden h-10 w-px bg-pd-border sm:block" aria-hidden />
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700/80">Saved</p>
              <p className="mt-1 text-base font-bold tabular-nums text-emerald-700">
                {savedPercent}%
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ToolSuccessPanel({
  title,
  description,
  downloadUrl,
  downloadFilename,
  downloadLabel,
  resultSizeBytes,
  originalSizeBytes,
  savedPercent,
  onReset,
  resetLabel,
  children,
}: ToolSuccessPanelProps) {
  const resolvedResetLabel = resetLabel ?? "Process another file";
  const showComparison =
    originalSizeBytes !== undefined &&
    originalSizeBytes > 0 &&
    resultSizeBytes !== undefined &&
    resultSizeBytes > 0;

  return (
    <div className="mx-auto w-full max-w-lg text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-pd-brand-muted">
        <Download className="h-7 w-7 text-pd-brand" />
      </div>
      <h2 className="text-lg font-bold text-pd-foreground">{title}</h2>
      {description && <p className="mt-2 text-sm text-pd-muted">{description}</p>}

      {showComparison ? (
        <FileSizeComparison
          originalSizeBytes={originalSizeBytes}
          resultSizeBytes={resultSizeBytes}
          savedPercent={savedPercent}
        />
      ) : resultSizeBytes !== undefined && resultSizeBytes > 0 ? (
        <ToolResultSizeBadge sizeBytes={resultSizeBytes} className="mt-3" />
      ) : null}

      {children ? <div className="mt-4 w-full text-left">{children}</div> : null}

      <div className="mt-6 flex w-full flex-col items-stretch gap-3">
        <a href={downloadUrl} download={downloadFilename} className="w-full">
          <Button size="lg" className="h-11 w-full gap-2 font-semibold">
            <Download className="h-4 w-4" />
            {downloadLabel}
          </Button>
        </a>
        <button
          type="button"
          onClick={onReset}
          className="text-sm text-pd-muted transition hover:text-pd-foreground"
        >
          {resolvedResetLabel}
        </button>
      </div>
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
  title,
  description,
  downloadUrl,
  downloadFilename,
  downloadLabel,
  resultSizeBytes,
  resetLabel,
  onReset,
}: ToolWorkspaceReadyPanelProps) {
  const resolvedTitle = title ?? "PDF ready";
  const resolvedDownloadLabel = downloadLabel ?? "Download";

  return (
    <div className="rounded-xl border border-pd-border bg-pd-surface p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-pd-brand-muted">
        <Check className="h-7 w-7 text-pd-brand" />
      </div>
      <h2 className="text-lg font-bold text-pd-foreground">{resolvedTitle}</h2>
      <p className="mt-2 text-sm text-pd-muted">{description}</p>
      {resultSizeBytes !== undefined && resultSizeBytes > 0 && (
        <ToolResultSizeBadge sizeBytes={resultSizeBytes} />
      )}
      <a href={downloadUrl} download={downloadFilename} className="mt-5 inline-block">
        <Button size="md">{resolvedDownloadLabel}</Button>
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
