"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  Trash2,
  X,
} from "lucide-react";

interface PageZoomModalProps {
  pageNum: number;
  totalPages: number;
  imageUrl?: string;
  rotation: number;
  thumbnails?: string[];
  onClose: () => void;
  onNavigate?: (pageNum: number) => void;
  onRotateLeft?: () => void;
  onRotateRight?: () => void;
  onDelete?: () => void;
}

/**
 * Upgrade a low-res thumbnail URL to a high-res (1200px) version
 * by appending or replacing the width parameter.
 */
function toHiRes(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.includes("/api/tools/pdf-thumb")) {
    const sep = url.includes("?") ? "&" : "?";
    if (url.includes("width=")) {
      return url.replace(/width=\d+/, "width=1200");
    }
    return `${url}${sep}width=1200`;
  }
  return url;
}

export function PageZoomModal({
  pageNum,
  totalPages,
  imageUrl,
  rotation,
  thumbnails,
  onClose,
  onNavigate,
  onRotateLeft,
  onRotateRight,
  onDelete,
}: PageZoomModalProps) {
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const [hiResLoaded, setHiResLoaded] = useState(false);
  const hiResUrl = toHiRes(imageUrl);

  useEffect(() => {
    setHiResLoaded(false);
  }, [imageUrl]);

  const goPrev = useCallback(() => {
    if (pageNum > 1 && onNavigate) onNavigate(pageNum - 1);
  }, [pageNum, onNavigate]);

  const goNext = useCallback(() => {
    if (pageNum < totalPages && onNavigate) onNavigate(pageNum + 1);
  }, [pageNum, totalPages, onNavigate]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goPrev, goNext]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (thumbStripRef.current) {
      const active = thumbStripRef.current.querySelector("[data-active='true']");
      if (active) active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [pageNum]);

  const rotStyle: React.CSSProperties | undefined =
    rotation === 0
      ? undefined
      : { transform: `rotate(${rotation}deg)`, transformOrigin: "center center" };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
      role="dialog"
      aria-modal
      aria-label={`Page ${pageNum} preview`}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Main preview area — fills viewport */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onClick={onClose}
      >
        {/* Prev arrow */}
        {onNavigate && pageNum > 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-white"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
        )}

        {/* Page image — large, filling the screen */}
        <div
          className="flex h-full w-full items-center justify-center px-16 py-6"
          onClick={(e) => e.stopPropagation()}
        >
          {imageUrl ? (
            <div className="relative flex items-center justify-center" style={rotStyle}>
              {/* Low-res placeholder shown immediately */}
              {!hiResLoaded && (
                <img
                  src={imageUrl}
                  alt={`Page ${pageNum}`}
                  className="max-h-[calc(100vh-160px)] max-w-[calc(100vw-120px)] rounded-lg bg-white object-contain shadow-2xl"
                  draggable={false}
                />
              )}
              {/* High-res image loads on top */}
              {hiResUrl && (
                <img
                  src={hiResUrl}
                  alt={`Page ${pageNum}`}
                  className={`max-h-[calc(100vh-160px)] max-w-[calc(100vw-120px)] rounded-lg bg-white object-contain shadow-2xl ${hiResLoaded ? "" : "absolute inset-0 m-auto opacity-0"}`}
                  draggable={false}
                  onLoad={() => setHiResLoaded(true)}
                />
              )}
            </div>
          ) : (
            <div className="flex h-[70vh] w-[50vw] max-w-2xl items-center justify-center rounded-lg bg-white text-gray-400 shadow-2xl">
              Preview not available
            </div>
          )}
        </div>

        {/* Next arrow */}
        {onNavigate && pageNum < totalPages && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-white"
            aria-label="Next page"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        )}
      </div>

      {/* Bottom controls bar */}
      <div className="flex shrink-0 flex-col items-center gap-3 bg-gradient-to-t from-black/80 to-black/40 px-4 pb-4 pt-3 backdrop-blur-md">
        {/* Navigation + actions */}
        <div className="flex items-center gap-2">
          {/* Prev */}
          <button
            type="button"
            onClick={goPrev}
            disabled={pageNum <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Page counter */}
          <div className="flex items-center gap-1.5 text-white">
            <span className="min-w-[2.5ch] rounded-md bg-white/15 px-2.5 py-1 text-center text-sm font-semibold tabular-nums">
              {pageNum}
            </span>
            <span className="text-sm text-white/50">/{totalPages}</span>
          </div>

          {/* Next */}
          <button
            type="button"
            onClick={goNext}
            disabled={pageNum >= totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {(onRotateLeft || onRotateRight || onDelete) && (
            <div className="mx-2 h-6 w-px bg-white/20" />
          )}

          {onRotateLeft && (
            <button
              type="button"
              onClick={onRotateLeft}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
              title="Rotate left"
            >
              <RotateCcw className="h-4.5 w-4.5" />
            </button>
          )}

          {onRotateRight && (
            <button
              type="button"
              onClick={onRotateRight}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
              title="Rotate right"
            >
              <RotateCw className="h-4.5 w-4.5" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-red-600/80"
              title="Delete page"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          )}
        </div>

        {/* Thumbnail strip */}
        {thumbnails && thumbnails.length > 0 && (
          <div
            ref={thumbStripRef}
            className="flex max-w-full gap-1.5 overflow-x-auto px-2 py-1"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.2) transparent" }}
          >
            {thumbnails.map((thumb, i) =>
              thumb ? (
                <button
                  key={i}
                  type="button"
                  data-active={i + 1 === pageNum}
                  onClick={() => onNavigate?.(i + 1)}
                  className={`shrink-0 overflow-hidden rounded border-2 transition-all ${
                    i + 1 === pageNum
                      ? "border-white shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                      : "border-transparent opacity-40 hover:opacity-70"
                  }`}
                >
                  <img
                    src={thumb}
                    alt={`Page ${i + 1}`}
                    className="h-14 w-auto object-contain"
                    draggable={false}
                  />
                </button>
              ) : (
                <div
                  key={i}
                  className={`flex h-14 w-10 shrink-0 items-center justify-center rounded border-2 text-[9px] text-white/40 ${
                    i + 1 === pageNum ? "border-white" : "border-transparent opacity-40"
                  }`}
                >
                  {i + 1}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
