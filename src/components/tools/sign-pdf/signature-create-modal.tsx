"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, ImageIcon, PenTool, Redo2, Type, Undo2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { canvasToPngDataUrl, trimCanvasToContent } from "@/lib/utils/canvas-trim";
import { useFocusTrap } from "@/lib/a11y/use-focus-trap";

type Tab = "draw" | "type" | "upload";
type InkColor = "#000000" | "#2563eb" | "#dc2626";

const INK_COLORS: { value: InkColor; label: string }[] = [
  { value: "#000000", label: "Black" },
  { value: "#2563eb", label: "Blue" },
  { value: "#dc2626", label: "Red" },
];

const SIGNATURE_FONTS = [
  { id: "cursive", label: "Cursive", css: "italic 48px 'Segoe Script', 'Brush Script MT', cursive" },
  { id: "elegant", label: "Elegant", css: "italic 44px Georgia, 'Times New Roman', serif" },
  { id: "modern", label: "Modern", css: "48px 'Arial', Helvetica, sans-serif" },
];

interface SignatureCreateModalProps {
  kind: "signature" | "initials";
  onClose: () => void;
  onCreate: (dataUrl: string, label: string) => void;
}

export function SignatureCreateModal({ kind, onClose, onCreate }: SignatureCreateModalProps) {
  const [tab, setTab] = useState<Tab>("draw");
  const [inkColor, setInkColor] = useState<InkColor>("#000000");
  const [typedText, setTypedText] = useState("");
  const [fontId, setFontId] = useState(SIGNATURE_FONTS[0].id);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawHistory, setDrawHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const dialogRef = useFocusTrap(true);
  const titleId = "signature-create-modal-title";

  const title = kind === "signature" ? "Create signature" : "Create initials";

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setDrawHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      next.push(snap);
      return next;
    });
    setHistoryIndex((i) => i + 1);
  }, [historyIndex]);

  const restoreHistory = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const snap = drawHistory[index];
    if (!canvas || !ctx || !snap) return;
    ctx.putImageData(snap, 0, 0);
    setHistoryIndex(index);
    setHasDrawn(index > 0);
  }, [drawHistory]);

  useEffect(() => {
    if (tab !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const blank = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setDrawHistory([blank]);
    setHistoryIndex(0);
    setHasDrawn(false);
  }, [tab]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || tab !== "draw") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = kind === "initials" ? 3 : 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [inkColor, tab, kind]);

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getCanvasPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (isDrawing) pushHistory();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    pushHistory();
  };

  const typedPreviewUrl = useCallback((): string | null => {
    if (!typedText.trim()) return null;
    const font = SIGNATURE_FONTS.find((f) => f.id === fontId) ?? SIGNATURE_FONTS[0];
    const canvas = document.createElement("canvas");
    canvas.width = kind === "initials" ? 200 : 400;
    canvas.height = kind === "initials" ? 120 : 150;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = inkColor;
    ctx.font = font.css;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedText.trim(), canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL("image/png");
  }, [typedText, fontId, inkColor, kind]);

  const canCreate =
    (tab === "draw" && hasDrawn) ||
    (tab === "type" && typedText.trim().length > 0) ||
    (tab === "upload" && uploadPreview !== null);

  const handleCreate = async () => {
    let dataUrl: string | null = null;
    let label = kind === "signature" ? "Signature" : "Initials";

    if (tab === "draw") {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      const trimmed = trimCanvasToContent(canvas);
      dataUrl = canvasToPngDataUrl(trimmed);
    } else if (tab === "type") {
      dataUrl = typedPreviewUrl();
      label = typedText.trim() || label;
    } else if (tab === "upload" && uploadPreview) {
      dataUrl = uploadPreview;
    }

    if (!dataUrl) return;
    onCreate(dataUrl, label);
    onClose();
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setUploadPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-pd-border px-5 py-4">
          <h3 id={titleId} className="text-lg font-semibold text-pd-foreground">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close signature dialog"
            className="rounded-lg p-1.5 text-pd-muted hover:bg-pd-background"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-pd-border px-5 pt-3">
          {([
            { id: "draw" as const, label: "Draw", icon: PenTool },
            { id: "type" as const, label: "Type", icon: Type },
            { id: "upload" as const, label: "Upload", icon: Upload },
          ]).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors",
                tab === t.id
                  ? "bg-pd-brand-muted text-pd-brand"
                  : "text-pd-muted hover:text-pd-foreground"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "draw" && (
            <div>
              <div className="mb-3 flex gap-2">
                {INK_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    aria-label={`Ink color ${c.label}`}
                    onClick={() => setInkColor(c.value)}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition-transform",
                      inkColor === c.value ? "scale-110 border-pd-brand" : "border-transparent"
                    )}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
              <div className="relative overflow-hidden rounded-xl border border-pd-border bg-[repeating-linear-gradient(45deg,#f3f4f6,#f3f4f6_8px,#e5e7eb_8px,#e5e7eb_16px)]">
                <canvas
                  ref={canvasRef}
                  width={480}
                  height={kind === "initials" ? 140 : 180}
                  className="mx-auto block w-full max-w-md cursor-crosshair touch-none bg-white"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <div className="pointer-events-none absolute bottom-10 left-1/2 w-3/4 -translate-x-1/2 border-b border-pd-brand/40" />
                <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-pd-muted">
                  Draw here
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={historyIndex <= 0}
                    onClick={() => restoreHistory(historyIndex - 1)}
                    aria-label="Undo"
                    className="rounded-lg p-2 text-pd-muted hover:bg-pd-background disabled:opacity-30"
                  >
                    <Undo2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={historyIndex >= drawHistory.length - 1}
                    onClick={() => restoreHistory(historyIndex + 1)}
                    aria-label="Redo"
                    className="rounded-lg p-2 text-pd-muted hover:bg-pd-background disabled:opacity-30"
                  >
                    <Redo2 className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="flex items-center gap-1.5 text-sm text-pd-muted hover:text-pd-foreground"
                >
                  <Eraser className="h-3.5 w-3.5" />
                  Clear
                </button>
              </div>
            </div>
          )}

          {tab === "type" && (
            <div className="space-y-4">
              <input
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder={kind === "initials" ? "Your initials" : "Your full name"}
                className="w-full rounded-xl border border-pd-border px-4 py-3 text-lg focus:border-pd-brand focus:outline-none focus:ring-2 focus:ring-pd-brand/20"
              />
              <div className="flex flex-wrap gap-2">
                {SIGNATURE_FONTS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFontId(f.id)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-sm",
                      fontId === f.id ? "border-pd-brand bg-pd-brand-muted text-pd-brand" : "border-pd-border"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="mb-3 flex gap-2">
                {INK_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setInkColor(c.value)}
                    className={cn(
                      "h-7 w-7 rounded-full border-2",
                      inkColor === c.value ? "border-pd-brand scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
              {typedText.trim() && (
                <div className="rounded-xl border border-dashed border-pd-border bg-pd-background p-6 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={typedPreviewUrl() ?? ""} alt="Preview" className="mx-auto max-h-20" />
                </div>
              )}
            </div>
          )}

          {tab === "upload" && (
            <div
              onClick={() => uploadRef.current?.click()}
              className="cursor-pointer rounded-xl border-2 border-dashed border-pd-border p-10 text-center transition-colors hover:border-pd-brand hover:bg-pd-background"
            >
              {uploadPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={uploadPreview} alt="Upload" className="mx-auto max-h-28" />
              ) : (
                <>
                  <ImageIcon className="mx-auto mb-2 h-10 w-10 text-pd-muted" />
                  <p className="text-sm text-pd-muted">Click to upload an image</p>
                </>
              )}
              <input ref={uploadRef} type="file" accept="image/*" className="sr-only" onChange={handleUpload} aria-label="Upload signature image" />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-pd-border px-5 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!canCreate}>
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}
