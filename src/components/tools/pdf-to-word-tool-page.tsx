"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { FileText, Info } from "lucide-react";
import { formatFileSize } from "@/lib/utils/file";
import { ToolPageShell } from "@/components/layout/tool-page-shell";
import {
  ToolDropzone,
  ToolErrorBanner,
  ToolPrimaryButton,
  ToolSuccessPanel,
} from "@/components/tools/tool-ui";
import { mapRelatedTools } from "@/components/tools/tool-helpers";
import { PdfPasswordModal } from "@/components/tools/pdf-password-modal";

interface RelatedTool {
  name: string;
  href: string;
  color?: string;
}

function clientTimeoutMs(fileSizeBytes: number): number {
  const sizeMb = fileSizeBytes / (1024 * 1024);
  return Math.min(1_800_000, Math.max(900_000, 120_000 + Math.ceil(sizeMb) * 120_000));
}

function progressLabel(percent: number): string {
  if (percent >= 100) return "Finishing download…";
  if (percent >= 92) return "Finalizing Word document…";
  if (percent >= 87) return `Merging sections… ${percent}%`;
  if (percent >= 10 && percent < 20) return `Processing sections… ${percent}%`;
  if (percent >= 5) return `Converting to Word… ${percent}%`;
  return "Preparing conversion…";
}

export function PdfToWordToolPage({
  relatedTools = [],
}: {
  relatedTools?: RelatedTool[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pdfPassword, setPdfPassword] = useState<string | null>(null);
  const [passwordPrompt, setPasswordPrompt] = useState<{
    fileName: string;
    errorMsg?: string;
    loading?: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetResult = useCallback(() => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setCompleted(false);
    setResultUrl(null);
    setResultFilename(null);
    setResultSize(null);
    setProgress(0);
    setError(null);
  }, [resultUrl]);

  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const selected = Array.from(newFiles)[0];
      if (selected) {
        setFile(selected);
        setPdfPassword(null);
        resetResult();
      }
    },
    [resetResult]
  );

  const runConversion = async (password?: string | null) => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setError(null);

    const controller = new AbortController();
    const timeoutMs = clientTimeoutMs(file.size);
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
      });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "options",
        JSON.stringify(password ? { password } : {})
      );

      const startRes = await fetch("/api/tools/pdf-to-word", {
        method: "POST",
        body: formData,
        headers: { "X-Pdf-To-Word-Job": "1" },
        signal: controller.signal,
      });

      if (!startRes.ok) {
        const err = (await startRes.json().catch(() => ({}))) as {
          error?: string;
          code?: string;
        };
        if (err.code === "PASSWORD_REQUIRED" || err.code === "WRONG_PASSWORD") {
          setPasswordPrompt({
            fileName: file.name,
            errorMsg:
              err.code === "WRONG_PASSWORD"
                ? err.error || "Incorrect password."
                : undefined,
            loading: false,
          });
          return;
        }
        throw new Error(err.error || "Conversion failed. Please try again.");
      }

      const { jobId } = (await startRes.json()) as { jobId?: string };
      if (!jobId) {
        throw new Error("Server did not start conversion. Please retry.");
      }

      if (password) {
        setPdfPassword(password);
        setPasswordPrompt(null);
      }

      while (true) {
        const statusRes = await fetch(
          `/api/tools/pdf-to-word/status?jobId=${encodeURIComponent(jobId)}`,
          { signal: controller.signal, cache: "no-store" }
        );

        if (!statusRes.ok) {
          throw new Error("Lost conversion progress. Please try again.");
        }

        const status = (await statusRes.json()) as {
          progress: number;
          status: string;
          error?: string | null;
        };

        setProgress(Math.min(99, Math.max(0, status.progress ?? 0)));

        if (status.status === "error") {
          const errText = status.error || "Conversion failed.";
          if (
            errText === "PASSWORD_REQUIRED" ||
            errText.includes("PASSWORD_REQUIRED") ||
            errText.includes("password-protected")
          ) {
            setPasswordPrompt({ fileName: file.name, loading: false });
            return;
          }
          if (errText === "WRONG_PASSWORD" || /incorrect password/i.test(errText)) {
            setPasswordPrompt({
              fileName: file.name,
              errorMsg: "Incorrect password.",
              loading: false,
            });
            return;
          }
          throw new Error(errText);
        }

        if (status.status === "done") {
          break;
        }

        await sleep(400);
      }

      const downloadRes = await fetch(
        `/api/tools/pdf-to-word/download?jobId=${encodeURIComponent(jobId)}`,
        { signal: controller.signal }
      );

      if (!downloadRes.ok) {
        throw new Error("Download failed. Please try again.");
      }

      const blob = await downloadRes.blob();
      const filename =
        file.name.replace(/\.pdf$/i, ".docx") || "converted.docx";

      setProgress(100);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFilename(filename);
      setResultSize(blob.size);
      setCompleted(true);
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "AbortError"
          ? "Conversion timed out. Large or complex PDFs can take several minutes — please try again and keep this tab open."
          : err instanceof TypeError && /failed to fetch/i.test(err.message)
            ? "Server not reachable. Make sure `npm run dev` is running, then retry."
            : err instanceof Error
              ? err.message
              : "An unexpected error occurred.";
      setError(message);
    } finally {
      window.clearTimeout(timeoutId);
      setProcessing(false);
    }
  };

  const handleConvert = async () => {
    await runConversion(pdfPassword);
  };

  const extraFields: ReactNode = (
    <div className="flex items-start gap-2 rounded-lg bg-pd-brand-muted/50 p-3 text-sm text-pd-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-pd-brand" />
      <p>For scanned PDFs, OCR will be used to extract text. Password-protected PDFs will ask for your password.</p>
    </div>
  );

  return (
    <>
    <ToolPageShell
      title="PDF to Word"
      description="Convert PDF documents to editable Word format"
      relatedTools={mapRelatedTools(relatedTools)}
    >
      {completed && resultUrl ? (
        <ToolSuccessPanel
          title="Converted Successfully!"
          description="Your Word document is ready to download."
          downloadUrl={resultUrl}
          downloadFilename={resultFilename || "converted.docx"}
          downloadLabel="Download DOCX"
          onReset={() => {
            resetResult();
            setFile(null);
          }}
        >
          {resultSize !== null ? (
            <p className="mt-2 text-xs text-pd-muted">
              File size:{" "}
              <span className="font-semibold text-pd-foreground">
                {formatFileSize(resultSize)}
              </span>
            </p>
          ) : null}
        </ToolSuccessPanel>
      ) : (
        <>
          <ToolDropzone
            hint="Drop a file here or click to browse"
            subHint="Select a PDF file to convert to Word"
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
            fileInputRef={fileInputRef}
            fileInputAccept=".pdf,application/pdf"
            onFileInputChange={(e) => e.target.files && handleFiles(e.target.files)}
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
            onClick={handleConvert}
            disabled={!file}
            loading={processing}
            loadingLabel={progressLabel(progress)}
            loadingProgress={processing ? progress : undefined}
          >
            Convert to Word
          </ToolPrimaryButton>
        </>
      )}
    </ToolPageShell>
    {passwordPrompt && (
      <PdfPasswordModal
        fileName={passwordPrompt.fileName}
        errorMessage={passwordPrompt.errorMsg}
        loading={passwordPrompt.loading}
        onCancel={() => setPasswordPrompt(null)}
        onSubmit={(password) => {
          setPasswordPrompt((prev) =>
            prev ? { ...prev, loading: true, errorMsg: undefined } : prev
          );
          void runConversion(password);
        }}
      />
    )}
  </>
  );
}
