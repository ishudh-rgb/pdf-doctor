"use client";

import { useState, useCallback } from "react";

type ProcessingStatus = "idle" | "uploading" | "processing" | "completed" | "error";

interface ProcessingResult {
  blob: Blob | null;
  filename: string;
  originalSize: number;
  resultSize: number;
  metadata?: Record<string, unknown>;
}

interface UseToolProcessingOptions {
  toolEndpoint: string;
  onSuccess?: (result: ProcessingResult) => void;
  onError?: (error: string) => void;
}

export function useToolProcessing(options: UseToolProcessingOptions) {
  const { toolEndpoint, onSuccess, onError } = options;

  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);

  const processFiles = useCallback(
    async (files: File[], extraData?: Record<string, string>) => {
      setStatus("uploading");
      setProgress(10);
      setError(null);
      setResult(null);

      try {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        if (extraData) {
          Object.entries(extraData).forEach(([key, value]) =>
            formData.append(key, value)
          );
        }

        setProgress(30);
        setStatus("processing");

        const response = await fetch(`/api/tools/${toolEndpoint}`, {
          method: "POST",
          body: formData,
        });

        setProgress(70);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const message =
            errorData?.error || `Processing failed (${response.status})`;
          throw new Error(message);
        }

        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = "result.pdf";
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          if (match) filename = match[1];
        }

        const blob = await response.blob();
        const totalOriginalSize = files.reduce((sum, f) => sum + f.size, 0);

        setProgress(100);

        const processingResult: ProcessingResult = {
          blob,
          filename,
          originalSize: totalOriginalSize,
          resultSize: blob.size,
        };

        setResult(processingResult);
        setStatus("completed");
        onSuccess?.(processingResult);
        const { notifyActivityUpdated } = await import("@/lib/client/activity-events");
        notifyActivityUpdated();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Processing failed";
        setError(message);
        setStatus("error");
        onError?.(message);
      }
    },
    [toolEndpoint, onSuccess, onError]
  );

  const processWithJson = useCallback(
    async (files: File[], jsonData: Record<string, unknown>) => {
      setStatus("uploading");
      setProgress(10);
      setError(null);
      setResult(null);

      try {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        formData.append("data", JSON.stringify(jsonData));

        setProgress(30);
        setStatus("processing");

        const response = await fetch(`/api/tools/${toolEndpoint}`, {
          method: "POST",
          body: formData,
        });

        setProgress(70);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error || `Processing failed (${response.status})`
          );
        }

        const blob = await response.blob();
        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = "result.pdf";
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          if (match) filename = match[1];
        }

        const processingResult: ProcessingResult = {
          blob,
          filename,
          originalSize: files.reduce((sum, f) => sum + f.size, 0),
          resultSize: blob.size,
        };

        setProgress(100);
        setResult(processingResult);
        setStatus("completed");
        onSuccess?.(processingResult);
        const { notifyActivityUpdated } = await import("@/lib/client/activity-events");
        notifyActivityUpdated();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Processing failed";
        setError(message);
        setStatus("error");
        onError?.(message);
      }
    },
    [toolEndpoint, onSuccess, onError]
  );

  const downloadResult = useCallback(() => {
    if (!result?.blob) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result]);

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  return {
    status,
    progress,
    error,
    result,
    processFiles,
    processWithJson,
    downloadResult,
    reset,
    isProcessing: status === "uploading" || status === "processing",
    isCompleted: status === "completed",
    isError: status === "error",
  };
}
