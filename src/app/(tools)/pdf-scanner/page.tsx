"use client";

import { useState, useRef, useCallback } from "react";
import {
  Camera,
  Upload,
  Download,
  Loader2,
  CheckCircle,
  X,
  ScanLine,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ToolPageShell } from "@/components/layout/tool-page-shell";
import { ScanFilterPreview } from "@/components/tools/previews/scan-filter-preview";
import { ToolErrorBanner, ToolPrimaryButton } from "@/components/tools/tool-ui";
import { Button } from "@/components/ui/button";

export default function PDFScannerPage() {
  const [images, setImages] = useState<{ id: string; file: File; preview: string }[]>([]);
  const [filter, setFilter] = useState<"original" | "bw" | "enhanced">("original");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addImages = useCallback((files: FileList | File[]) => {
    const newImages = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        preview: URL.createObjectURL(f),
      }));
    setImages((prev) => [...prev, ...newImages]);
    setResult(null);
    setError("");
  }, []);

  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setError("Camera access denied. Please allow camera permissions.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });
        addImages([file]);
      }
    }, "image/jpeg", 0.9);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleProcess = async () => {
    if (images.length === 0) return;
    setProcessing(true);
    setError("");
    setProgress(20);

    const formData = new FormData();
    images.forEach((img) => formData.append("files", img.file));
    formData.append("filter", filter);

    try {
      setProgress(50);
      const res = await fetch("/api/tools/pdf-scanner", { method: "POST", body: formData });
      setProgress(80);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Scanning failed");
      }

      const blob = await res.blob();
      setResult(blob);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = URL.createObjectURL(result);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scanned-document.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
    setResult(null);
    setError("");
    setProgress(0);
    stopCamera();
  };

  return (
    <ToolPageShell
      title="PDF Scanner"
      description="Scan documents to PDF using your camera or upload images. Works best on mobile devices."
      preview={
        images.length > 0 && !result ? (
          <ScanFilterPreview filter={filter} imagePreviewUrl={images[0]?.preview ?? null} />
        ) : undefined
      }
    >
      {result ? (
        <div className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-4 text-xl font-bold text-pd-foreground">Document Scanned!</h2>
          <p className="mt-2 text-pd-muted">{images.length} page(s) converted to PDF</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={reset}>
              Scan Again
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-pd-foreground">
              <Camera className="h-5 w-5" /> Camera Scan
            </h3>
            {cameraActive ? (
              <div>
                <video ref={videoRef} className="w-full rounded-xl bg-black" autoPlay playsInline />
                <canvas ref={canvasRef} className="hidden" />
                <div className="mt-4 flex justify-center gap-3">
                  <Button onClick={capturePhoto}>Capture</Button>
                  <Button variant="outline" onClick={stopCamera}>Close Camera</Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={startCamera}
                className="w-full cursor-pointer rounded-xl border-2 border-dashed border-pd-border p-8 text-center transition-colors hover:border-pd-brand hover:bg-pd-brand-muted/30"
              >
                <Camera className="mx-auto h-10 w-10 text-pd-muted" />
                <p className="mt-2 font-medium text-pd-foreground">Open Camera</p>
                <p className="text-sm text-pd-muted">Use your device camera to scan documents</p>
              </button>
            )}
          </div>

          <div>
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-pd-foreground">
              <ImageIcon className="h-5 w-5" /> Upload Images
            </h3>
            <div
              className={cn(
                "cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                isDragging ? "border-pd-brand bg-pd-brand-muted" : "border-pd-border hover:border-pd-brand"
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length) addImages(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-8 w-8 text-pd-muted" />
              <p className="mt-2 text-sm font-medium text-pd-foreground">Drag & drop images or click to browse</p>
              <p className="text-xs text-pd-muted">JPG, PNG supported</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => e.target.files && addImages(e.target.files)} className="hidden" />
          </div>

          {images.length > 0 && (
            <div>
              <h3 className="mb-4 font-semibold text-pd-foreground">Scanned Pages ({images.length})</h3>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((img, i) => (
                  <div key={img.id} className="group relative">
                    <img src={img.preview} alt={`Page ${i + 1}`} className="h-24 w-full rounded-lg border border-pd-border object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="absolute -right-2 -top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="mb-2 text-sm font-medium text-pd-foreground">Image Filter</h4>
                <div className="flex gap-3">
                  {[
                    { value: "original" as const, label: "Original" },
                    { value: "bw" as const, label: "Black & White" },
                    { value: "enhanced" as const, label: "Enhanced" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFilter(opt.value)}
                      className={cn(
                        "cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                        filter === opt.value
                          ? "bg-pd-brand text-white"
                          : "bg-pd-background text-pd-muted hover:bg-pd-border/50"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && <ToolErrorBanner message={error} />}

              {processing ? (
                <div className="py-6 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-pd-brand" />
                  <p className="mt-3 font-medium text-pd-foreground">Converting to PDF...</p>
                  <div className="mx-auto mt-3 max-w-xs">
                    <div className="h-2 rounded-full bg-pd-border">
                      <div className="h-2 rounded-full bg-pd-brand transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              ) : (
                <ToolPrimaryButton
                  onClick={handleProcess}
                  className="mt-6"
                >
                  <span className="inline-flex items-center gap-2">
                    <ScanLine className="h-5 w-5" /> Convert to PDF
                  </span>
                </ToolPrimaryButton>
              )}
            </div>
          )}

          <p className="text-center text-xs text-pd-muted">Your files are automatically deleted after 2 hours.</p>
        </div>
      )}
    </ToolPageShell>
  );
}
