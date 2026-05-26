"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";
import { Upload, Loader2, Download, AlertCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { formatFileSize } from "@/lib/utils/file";

interface RelatedTool {
  name: string;
  href: string;
  color: string;
}

interface ConvertToolPageProps {
  title: string;
  description: string;
  icon: ReactNode;
  accentColor: string;
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
}

export function ConvertToolPage({
  title,
  description,
  icon,
  accentColor,
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
}: ConvertToolPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetResult = useCallback(() => {
    setCompleted(false);
    setResultUrl(null);
    setResultFilename(null);
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
    setError(null);

    try {
      let formData = new FormData();
      formData.append("file", file);
      if (buildFormData) {
        formData = buildFormData(file, formData);
      }

      const res = await fetch(apiPath, { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Processing failed. Please try again.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultFilename(file.name.replace(/\.[^.]+$/, `.${outputExtension}`));
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ backgroundColor: `${accentColor}18` }}
          >
            {icon}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600 text-lg">{description}</p>
        </div>

        {!completed && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
            <div
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
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200",
                dragOver ? "bg-opacity-5" : "border-gray-300 hover:bg-gray-50"
              )}
              style={dragOver ? { borderColor: accentColor, backgroundColor: `${accentColor}10` } : undefined}
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-700 font-medium mb-1">Drop a file here or click to browse</p>
              <p className="text-sm text-gray-500">{uploadHint}</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />

            {file && (
              <div
                className="mt-4 p-3 rounded-lg flex items-center gap-3"
                style={{ backgroundColor: `${accentColor}10` }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
            )}

            {extraFields && <div className="mt-4">{extraFields}</div>}

            {error && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleProcess}
              disabled={!file || processing}
              className={cn(
                "mt-6 w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200",
                file && !processing ? "shadow-lg" : "bg-gray-300 cursor-not-allowed"
              )}
              style={
                file && !processing
                  ? { backgroundColor: accentColor, boxShadow: `0 10px 25px ${accentColor}40` }
                  : undefined
              }
            >
              {processing ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {processingLabel}
                </span>
              ) : (
                processLabel
              )}
            </button>
          </div>
        )}

        {completed && resultUrl && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <Download className="w-8 h-8" style={{ color: accentColor }} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{successTitle}</h2>
            <p className="text-gray-600 mb-6">{successDescription}</p>
            <a
              href={resultUrl}
              download={resultFilename || `converted.${outputExtension}`}
              className="inline-flex items-center gap-2 px-8 py-3.5 text-white font-semibold rounded-xl transition-all duration-200"
              style={{ backgroundColor: accentColor }}
            >
              <Download className="w-5 h-5" />
              {downloadLabel}
            </a>
            <button
              onClick={() => {
                resetResult();
                setFile(null);
              }}
              className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Process another file
            </button>
          </div>
        )}

        {relatedTools.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Tools</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {relatedTools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tool.color }} />
                  <span className="text-sm font-medium text-gray-700">{tool.name}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 ml-auto" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
