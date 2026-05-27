"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { formatFileSize } from "@/lib/utils/file";
import { ToolPageShell } from "@/components/layout/tool-page-shell";
import { WatermarkPreview } from "@/components/tools/previews/watermark-preview";
import {
  ToolDropzone,
  ToolErrorBanner,
  ToolPrimaryButton,
  ToolSuccessPanel,
} from "@/components/tools/tool-ui";

export default function AddWatermarkPage() {
  const [file, setFile] = useState<File | null>(null);
  const [watermarkType, setWatermarkType] = useState<"text" | "image">("text");
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.25);
  const [fontSize, setFontSize] = useState(48);
  const [rotation, setRotation] = useState(-35);
  const [watermarkImage, setWatermarkImage] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!watermarkImage) {
      setImagePreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(watermarkImage);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [watermarkImage]);

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "options",
        JSON.stringify({
          type: watermarkType,
          text: watermarkType === "text" ? text : undefined,
          opacity,
          fontSize,
          rotation,
          color: "#64748b",
          pages: "all",
        })
      );

      if (watermarkType === "image" && watermarkImage) {
        formData.append("watermarkImage", watermarkImage);
      }

      const res = await fetch("/api/tools/add-watermark", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add watermark.");
      }

      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
      setResultFilename(file.name.replace(/\.pdf$/i, "-watermarked.pdf"));
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolPageShell
      title="Add Watermark to PDF"
      description="Stamp text or image watermarks on every page"
      preview={
        !completed ? (
          <WatermarkPreview
            watermarkType={watermarkType}
            text={text}
            opacity={opacity}
            fontSize={fontSize}
            rotation={rotation}
            imagePreviewUrl={imagePreviewUrl}
          />
        ) : undefined
      }
    >
      {completed && resultUrl ? (
        <ToolSuccessPanel
          title="Watermark applied!"
          description="Your watermarked PDF is ready to download."
          downloadUrl={resultUrl}
          downloadFilename={resultFilename || "watermarked.pdf"}
          downloadLabel="Download PDF"
          resetLabel="Watermark another file"
          onReset={() => {
            setCompleted(false);
            setFile(null);
            setResultUrl(null);
          }}
        />
      ) : (
        <>
          <ToolDropzone
            hint="Upload PDF file"
            subHint={file ? `${file.name} · ${formatFileSize(file.size)}` : "Drop or click to select a PDF"}
            dragOver={dragOver}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) {
                setFile(f);
                setCompleted(false);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setCompleted(false);
            }}
          />

          <div className="mt-4 grid grid-cols-2 gap-3">
            {(["text", "image"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setWatermarkType(type)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition",
                  watermarkType === type
                    ? "border-pd-brand bg-pd-brand-muted text-pd-brand"
                    : "border-pd-border text-pd-muted hover:bg-pd-background"
                )}
              >
                {type} watermark
              </button>
            ))}
          </div>

          {watermarkType === "text" ? (
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-pd-foreground">Watermark text</label>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full rounded-xl border border-pd-border px-4 py-2.5 text-sm outline-none focus:border-pd-brand focus:ring-2 focus:ring-pd-brand/20"
                placeholder="CONFIDENTIAL"
              />
            </div>
          ) : (
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-pd-foreground">Watermark image (PNG/JPG)</label>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-full rounded-xl border border-pd-border px-4 py-2.5 text-left text-sm text-pd-muted hover:bg-pd-background"
              >
                {watermarkImage ? watermarkImage.name : "Choose image"}
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => setWatermarkImage(e.target.files?.[0] ?? null)}
              />
            </div>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pd-foreground">
                Opacity <span className="text-pd-muted">({Math.round(opacity * 100)}%)</span>
              </label>
              <input
                type="range"
                min={0.1}
                max={0.8}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full accent-pd-brand"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pd-foreground">Font size</label>
              <input
                type="number"
                min={18}
                max={96}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full rounded-xl border border-pd-border px-3 py-2 text-sm"
                disabled={watermarkType === "image"}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-pd-foreground">Rotation</label>
              <input
                type="number"
                min={-90}
                max={90}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full rounded-xl border border-pd-border px-3 py-2 text-sm"
              />
            </div>
          </div>

          {error && <ToolErrorBanner message={error} />}

          <ToolPrimaryButton
            onClick={handleProcess}
            disabled={!file || (watermarkType === "image" && !watermarkImage)}
            loading={processing}
            loadingLabel="Adding watermark..."
          >
            Apply Watermark
          </ToolPrimaryButton>
        </>
      )}
    </ToolPageShell>
  );
}
