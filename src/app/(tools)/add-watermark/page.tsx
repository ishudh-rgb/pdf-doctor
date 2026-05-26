"use client";

import { useState, useRef, useEffect } from "react";
import { Stamp, Upload, Loader2, Download, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatFileSize } from "@/lib/utils/file";
import { WatermarkPreview } from "@/components/tools/previews/watermark-preview";

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
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-100 mb-4">
            <Stamp className="w-8 h-8 text-cyan-700" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Watermark to PDF</h1>
          <p className="text-gray-600 text-lg">Stamp text or image watermarks on every page</p>
        </div>

        {!completed ? (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-500 hover:bg-cyan-50/40 transition"
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
              <p className="font-medium text-gray-700">Upload PDF file</p>
              {file && (
                <p className="mt-2 text-sm text-gray-500">
                  {file.name} · {formatFileSize(file.size)}
                </p>
              )}
            </div>
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

            <div className="grid grid-cols-2 gap-3">
              {(["text", "image"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setWatermarkType(type)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition",
                    watermarkType === type
                      ? "border-cyan-500 bg-cyan-50 text-cyan-800"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {type} watermark
                </button>
              ))}
            </div>

            {watermarkType === "text" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Watermark text</label>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="CONFIDENTIAL"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Watermark image (PNG/JPG)</label>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-left text-gray-600 hover:bg-gray-50"
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

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Opacity <span className="text-gray-400">({Math.round(opacity * 100)}%)</span>
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={0.8}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full accent-cyan-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Font size</label>
                <input
                  type="number"
                  min={18}
                  max={96}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  disabled={watermarkType === "image"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rotation</label>
                <input
                  type="number"
                  min={-90}
                  max={90}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={handleProcess}
              disabled={!file || processing || (watermarkType === "image" && !watermarkImage)}
              className={cn(
                "w-full py-3.5 rounded-xl font-semibold text-white transition",
                file && !processing ? "bg-cyan-700 hover:bg-cyan-800" : "bg-gray-300 cursor-not-allowed"
              )}
            >
              {processing ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Adding watermark...
                </span>
              ) : (
                "Apply Watermark"
              )}
            </button>
            </div>

            <WatermarkPreview
              watermarkType={watermarkType}
              text={text}
              opacity={opacity}
              fontSize={fontSize}
              rotation={rotation}
              imagePreviewUrl={imagePreviewUrl}
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <Download className="w-10 h-10 mx-auto mb-4 text-cyan-700" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Watermark applied!</h2>
            <a
              href={resultUrl!}
              download={resultFilename || "watermarked.pdf"}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-cyan-700 text-white font-semibold rounded-xl"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </a>
            <button
              onClick={() => {
                setCompleted(false);
                setFile(null);
                setResultUrl(null);
              }}
              className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-700"
            >
              Watermark another file
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
