"use client";

import { memo, useEffect, useState } from "react";
import {
  Copy,
  RotateCcw,
  Trash2,
  ZoomIn,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { MergeSelectionCheckbox } from "@/components/tools/merge-pdf/merge-selection-checkbox";

interface SplitPageCardProps {
  pageNum: number;
  fileName: string;
  thumb?: string;
  loadingThumb?: boolean;
  isBlank?: boolean;
  rotation: number;
  mode: "split" | "extract";
  selected?: boolean;
  showCheckbox?: boolean;
  onSelect?: () => void;
  onZoom: () => void;
  onRotateLeft: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

export const SplitPageCard = memo(function SplitPageCard({
  pageNum,
  fileName,
  thumb,
  loadingThumb,
  isBlank,
  rotation,
  mode,
  selected,
  showCheckbox = true,
  onSelect,
  onZoom,
  onRotateLeft,
  onDuplicate,
  onRemove,
}: SplitPageCardProps) {
  const shortName =
    fileName.length > 18 ? `${fileName.slice(0, 15)}…` : fileName;
  const [imageReady, setImageReady] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageReady(false);
    setImageFailed(false);
  }, [thumb]);

  const showLoading = Boolean(thumb) && !imageReady && !imageFailed;
  const showImage = Boolean(thumb) && imageReady;

  return (
    <div className="group/card relative w-[128px] sm:w-[148px]">
      <div
        className={cn(
          "relative rounded-xl px-2 pb-2 pt-3 transition-all",
          mode === "extract" && showCheckbox && selected
            ? "bg-[#d4e4f7] shadow-sm ring-1 ring-pd-brand/25"
            : mode === "extract"
              ? "bg-white/70"
              : "bg-transparent"
        )}
      >
        {mode === "extract" && showCheckbox && onSelect && (
          <MergeSelectionCheckbox
            selected={Boolean(selected)}
            onToggle={onSelect}
          />
        )}

        <div
          className={cn(
            "relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all",
            mode === "extract"
              ? selected
                ? "border-pd-brand/40"
                : "border-pd-border/80 group-hover/card:border-pd-brand/30"
              : "border-2 border-pd-border group-hover/card:border-pd-brand/40"
          )}
        >
        {/* Hover toolbar — Smallpdf-style */}
        <div className="absolute inset-x-0 top-0 z-20 flex justify-center gap-0.5 bg-pd-foreground/85 px-1 py-1 opacity-0 transition-opacity group-hover/card:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onZoom();
            }}
            className="rounded p-1 text-white hover:bg-white/20"
            title="Zoom"
            aria-label="Zoom"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRotateLeft();
            }}
            className="rounded p-1 text-white hover:bg-white/20"
            title="Rotate left"
            aria-label="Rotate left"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="rounded p-1 text-white hover:bg-white/20"
            title="Duplicate"
            aria-label="Duplicate page"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="rounded p-1 text-white hover:bg-red-400/80"
            title="Remove page"
            aria-label="Remove page"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={mode === "extract" && showCheckbox ? onSelect : undefined}
          className={cn(
            "block w-full text-left",
            mode === "extract" && showCheckbox && "cursor-pointer"
          )}
        >
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-50">
            {thumb && !imageFailed ? (
              <>
                {showLoading && (
                  <div className="absolute inset-0 z-0 animate-pulse bg-gradient-to-b from-slate-100 to-slate-200" />
                )}
                <img
                  src={thumb}
                  alt={`Page ${pageNum}`}
                  className={cn(
                    "relative z-10 h-full w-full object-contain transition-all duration-200",
                    showImage ? "opacity-100" : "opacity-0"
                  )}
                  style={{
                    transform: `rotate(${rotation}deg)${rotation % 180 !== 0 ? " scale(1.414)" : ""}`,
                    transformOrigin: "center center",
                  }}
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => setImageReady(true)}
                  onError={() => setImageFailed(true)}
                />
              </>
            ) : isBlank ? (
              <div className="flex h-full w-full items-center justify-center bg-white">
                <span className="text-[10px] font-medium uppercase tracking-wide text-slate-300">
                  Blank
                </span>
              </div>
            ) : loadingThumb ? (
              <div className="h-full w-full animate-pulse bg-gradient-to-b from-slate-100 to-slate-200" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 text-xs text-pd-muted">
                …
              </div>
            )}
          </div>
        </button>
        </div>

        {mode === "extract" && (
          <>
            <p
              className="mx-auto mt-2 max-w-full truncate rounded-full bg-rose-100/90 px-2 py-0.5 text-center text-[10px] font-medium text-rose-800"
              title={fileName}
            >
              {shortName}
            </p>
            <p className="mt-0.5 text-center text-xs font-semibold text-pd-foreground">{pageNum}</p>
          </>
        )}
      </div>

      {mode !== "extract" && (
        <>
          <p
            className="mx-auto mt-1.5 max-w-full truncate rounded-full bg-rose-100 px-2 py-0.5 text-center text-[10px] font-medium text-rose-800"
            title={fileName}
          >
            {shortName}
          </p>
          <p className="mt-0.5 text-center text-xs font-semibold text-pd-foreground">{pageNum}</p>
        </>
      )}
    </div>
  );
});
