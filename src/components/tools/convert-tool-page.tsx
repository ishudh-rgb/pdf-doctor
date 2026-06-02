"use client";

import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { FileText } from "lucide-react";
import { formatFileSize } from "@/lib/utils/file";
import { ToolPageShell } from "@/components/layout/tool-page-shell";
import {
  ToolDropzone,
  ToolErrorBanner,
  ToolPrimaryButton,
  ToolSuccessPanel,
} from "@/components/tools/tool-ui";
import { mapRelatedTools } from "@/components/tools/tool-helpers";

interface RelatedTool {
  name: string;
  href: string;
  color?: string;
}

interface ConvertToolPageProps {
  title: string;
  description: string;
  icon?: ReactNode;
  accept: string;
  uploadHint: string;
  processLabel: string;
  processingLabel: string;
  successTitle: string;
  successDescription: string;
  downloadLabel: string;
  outputExtension: string;
  apiPath: string;
  relatedTools?: RelatedTool[];
  extraFields?: ReactNode;
  buildFormData?: (file: File, formData: FormData) => FormData;
  showOutputSize?: boolean;
  /** Client fetch timeout in ms (default 120s). */
  fetchTimeoutMs?: number;
  /** Cap for fake progress bar while waiting on server (default 92). */
  progressCap?: number;
}

export function ConvertToolPage({
  title,
  description,
  accept,
  uploadHint,
  processLabel,
  processingLabel,
  successTitle,
  successDescription,
  downloadLabel,
  outputExtension,
  apiPath,
  relatedTools = [],
  extraFields,
  buildFormData,
  showOutputSize = false,
  fetchTimeoutMs = 120_000,
  progressCap = 92,
}: ConvertToolPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopProgressTimer = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopProgressTimer(), [stopProgressTimer]);

  const resetResult = useCallback(() => {
    setCompleted(false);
    setResultUrl(null);
    setResultFilename(null);
    setResultSize(null);
    setProgress(0);
    setError(null);
  }, []);

  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const selected = Array.from(newFiles)[0];
      if (selected) {
        setFile(selected);
        resetResult();
      }
    },
    [resetResult]
  );

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setError(null);
    stopProgressTimer();
    progressTimerRef.current = setInterval(() => {
      setProgress((current) => {
        if (current >= progressCap) return current;
        const step = current < 40 ? 4 : current < 75 ? 2 : 1;
        return Math.min(progressCap, current + step);
      });
    }, 450);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), fetchTimeoutMs);

    try {
      let formData = new FormData();
      formData.append("file", file);
      if (buildFormData) {
        formData = buildFormData(file, formData);
      }

      const res = await fetch(apiPath, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Processing failed. Please try again.");
      }

      const blob = await res.blob();
      setProgress(100);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFilename(file.name.replace(/\.[^.]+$/, `.${outputExtension}`));
      setResultSize(blob.size);
      setCompleted(true);
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "AbortError"
          ? "Conversion timed out. Large spreadsheets can take 2–3 minutes — please try again."
          : err instanceof TypeError && /failed to fetch/i.test(err.message)
            ? "Server not reachable. Make sure `npm run dev` is running, wait for conversion, then retry."
            : err instanceof Error
              ? err.message
              : "An unexpected error occurred.";
      setError(message);
    } finally {
      window.clearTimeout(timeoutId);
      stopProgressTimer();
      setProcessing(false);
    }
  };

  return (
    <ToolPageShell
      title={title}
      description={description}
      relatedTools={mapRelatedTools(relatedTools)}
    >
      {completed && resultUrl ? (
        <ToolSuccessPanel
          title={successTitle}
          description={successDescription}
          downloadUrl={resultUrl}
          downloadFilename={resultFilename || `converted.${outputExtension}`}
          downloadLabel={downloadLabel}
          onReset={() => {
            resetResult();
            setFile(null);
          }}
        >
          {showOutputSize && resultSize !== null ? (
            <p className="mt-3 text-xs text-pd-muted">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-pd-border bg-pd-background px-3 py-1 font-medium text-pd-foreground">
                <span className="uppercase tracking-wide text-pd-muted">{outputExtension}</span>
                <span className="text-pd-border">·</span>
                <span>{formatFileSize(resultSize)}</span>
              </span>
            </p>
          ) : null}
        </ToolSuccessPanel>
      ) : (
        <>
          <ToolDropzone
            hint="Drop a file here or click to browse"
            subHint={uploadHint}
            dragOver={dragOver}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            onChooseFiles={() => fileInputRef.current?.click()}
            onCloudFiles={(incoming) => handleFiles(incoming)}
            onCloudError={setError}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />

          {file && (
            <div className="mt-4 flex items-center gap-3 rounded-lg bg-pd-brand-muted p-3">
              <FileText className="h-4 w-4 shrink-0 text-pd-brand" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-pd-foreground">{file.name}</p>
                <p className="text-xs text-pd-muted">{formatFileSize(file.size)}</p>
              </div>
            </div>
          )}

          {extraFields && <div className="mt-4">{extraFields}</div>}
          {error && <ToolErrorBanner message={error} />}

          <ToolPrimaryButton
            onClick={handleProcess}
            disabled={!file}
            loading={processing}
            loadingLabel={processingLabel}
            loadingProgress={processing ? progress : undefined}
          >
            {processLabel}
          </ToolPrimaryButton>
        </>
      )}
    </ToolPageShell>
  );
}
