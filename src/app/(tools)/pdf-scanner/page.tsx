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
  AlertCircle,
} from "lucide-react";
import { ScanFilterPreview } from "@/components/tools/previews/scan-filter-preview";

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
    <div className="min-h-[70vh] bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">PDF Scanner</h1>
          <p className="mt-3 text-gray-600">Scan documents to PDF using your camera or upload images</p>
          <p className="mt-1 text-sm text-gray-500">Works best on mobile devices</p>
        </div>

        {result ? (
          <div className="rounded-2xl bg-white p-8 shadow-sm text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">Document Scanned!</h2>
            <p className="mt-2 text-gray-600">{images.length} page(s) converted to PDF</p>
            <div className="mt-6 flex gap-3 justify-center">
              <button onClick={handleDownload} className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">
                <Download className="h-4 w-4" /> Download PDF
              </button>
              <button onClick={reset} className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
                Scan Again
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Camera Section */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="h-5 w-5" /> Camera Scan
              </h3>
              {cameraActive ? (
                <div>
                  <video ref={videoRef} className="w-full rounded-xl bg-black" autoPlay playsInline />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="mt-4 flex gap-3 justify-center">
                    <button onClick={capturePhoto} className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">
                      Capture
                    </button>
                    <button onClick={stopCamera} className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium hover:bg-gray-50 cursor-pointer">
                      Close Camera
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={startCamera} className="w-full rounded-xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
                  <Camera className="mx-auto h-10 w-10 text-gray-400" />
                  <p className="mt-2 font-medium text-gray-700">Open Camera</p>
                  <p className="text-sm text-gray-500">Use your device camera to scan documents</p>
                </button>
              )}
            </div>

            {/* Upload Section */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5" /> Upload Images
              </h3>
              <div
                className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
                  isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400"
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length) addImages(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm font-medium text-gray-700">Drag & drop images or click to browse</p>
                <p className="text-xs text-gray-500">JPG, PNG supported</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => e.target.files && addImages(e.target.files)} className="hidden" />
            </div>

            {/* Image List */}
            {images.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Scanned Pages ({images.length})</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {images.map((img, i) => (
                    <div key={img.id} className="relative group">
                      <img src={img.preview} alt={`Page ${i + 1}`} className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                        {i + 1}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Filter Options */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Image Filter</h4>
                  <div className="flex gap-3">
                    {[
                      { value: "original" as const, label: "Original" },
                      { value: "bw" as const, label: "Black & White" },
                      { value: "enhanced" as const, label: "Enhanced" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFilter(opt.value)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                          filter === opt.value
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <ScanFilterPreview filter={filter} imagePreviewUrl={images[0]?.preview ?? null} />
                </div>

                {error && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                  </div>
                )}

                {processing ? (
                  <div className="mt-6 text-center py-6">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                    <p className="mt-3 font-medium text-gray-700">Converting to PDF...</p>
                    <div className="mt-3 mx-auto max-w-xs">
                      <div className="h-2 rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleProcess}
                    className="mt-6 w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white hover:bg-blue-700 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ScanLine className="h-5 w-5" /> Convert to PDF
                  </button>
                )}
              </div>
            )}

            <p className="text-center text-xs text-gray-400">Your files are automatically deleted after 2 hours.</p>
          </div>
        )}
      </div>
    </div>
  );
}
