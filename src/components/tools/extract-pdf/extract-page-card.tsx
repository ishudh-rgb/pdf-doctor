"use client";

import { useEffect, useState } from "react";
import {
  Copy,
  RotateCw,
  Trash2,
  ZoomIn,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ExtractPageCardProps {
  pageNum: number;
  fileName: string;
  thumb?: string;
  loadingThumb?: boolean;
  isBlank?: boolean;
  selected: boolean;
  rotation?: number;
  onSelect: () => void;
  onZoom: () => void;
  onRotateRight: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

function getRotationStyle(rotation: number): React.CSSProperties | undefined {
  if (!rotation) return undefined;
  const is90or270 = rotation === 90 || rotation === 270;
  return {
    transform: `rotate(${rotation}deg)${is90or270 ? " scale(1.414)" : ""}`,
    transformOrigin: "center center",
  };
}

export function ExtractPageCard({
  pageNum,
  fileName,
  thumb,
  loadingThumb,
  isBlank,
  selected,
  rotation = 0,
  onSelect,
  onZoom,
  onRotateRight,
  onDuplicate,
  onRemove,
}: ExtractPageCardProps) {
  const shortName =
    fileName.length > 16 ? `${fileName.slice(0, 13)}…` : fileName;
  const [imageReady, setImageReady] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageReady(false);
    setImageFailed(false);
  }, [thumb]);

  return (
    <div className="group/card relative w-[152px] sm:w-[172px]">
      <div
        className={cn(
          "relative rounded-lg p-2 transition-all duration-150",
          selected
            ? "bg-blue-50 ring-2 ring-blue-500/40"
            : "bg-transparent hover:bg-gray-50"
        )}
      >
        {/* Checkbox — Smallpdf-style blue filled */}
        <div className="absolute left-3 top-3 z-20">
          <label className="flex cursor-pointer">
            <input
              type="checkbox"
              checked={selected}
              onChange={onSelect}
              className="h-[18px] w-[18px] cursor-pointer rounded border-gray-300 text-blue-600 accent-blue-600"
            />
          </label>
        </div>

        {/* Hover toolbar — top-right icons */}
        <div className="absolute right-2 top-3 z-20 flex gap-0.5 opacity-0 transition-opacity duration-150 group-hover/card:opacity-100">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onZoom(); }}
            className="rounded-md bg-gray-900/75 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-gray-900/90"
            title="Zoom"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRotateRight(); }}
            className="rounded-md bg-gray-900/75 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-gray-900/90"
            title="Rotate right"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="rounded-md bg-gray-900/75 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-gray-900/90"
            title="Duplicate"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="rounded-md bg-gray-900/75 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-red-600/90"
            title="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Page thumbnail — click to toggle selection */}
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            "relative block w-full cursor-pointer overflow-hidden rounded-md border bg-white transition-all",
            selected
              ? "border-blue-400 shadow-[0_0_0_1px_rgba(59,130,246,0.3),0_4px_12px_rgba(59,130,246,0.15)]"
              : "border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
          )}
        >
          <div className="relative w-full overflow-hidden bg-white" style={{ paddingBottom: "141.4%" }}>
            {thumb && !imageFailed ? (
              <img
                src={thumb}
                alt={`Page ${pageNum}`}
                className={cn(
                  "absolute inset-0 h-full w-full object-contain transition-all duration-300",
                  imageReady ? "opacity-100" : "opacity-0"
                )}
                style={getRotationStyle(rotation)}
                draggable={false}
                loading="lazy"
                decoding="async"
                onLoad={() => setImageReady(true)}
                onError={() => setImageFailed(true)}
              />
            ) : isBlank ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
                  Blank
                </span>
              </div>
            ) : loadingThumb ? (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-gray-50 to-gray-100" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 text-xs text-gray-400">
                …
              </div>
            )}

            {!imageReady && thumb && !imageFailed && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-gray-50 to-gray-100" />
            )}

            {/* Unselected overlay — dim unselected pages */}
            {!selected && (
              <div className="absolute inset-0 bg-white/40 transition-opacity" />
            )}
          </div>
        </button>

        {/* File label + page number */}
        <p
          className={cn(
            "mx-auto mt-2 max-w-full truncate rounded-full px-2.5 py-0.5 text-center text-[10px] font-medium transition-colors",
            selected
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-500"
          )}
          title={fileName}
        >
          {shortName}
        </p>
        <p className={cn(
          "mt-0.5 text-center text-xs font-semibold transition-colors",
          selected ? "text-blue-700" : "text-gray-400"
        )}>
          {pageNum}
        </p>
      </div>
    </div>
  );
}
