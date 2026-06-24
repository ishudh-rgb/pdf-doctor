"use client";

import { memo, useEffect, useState } from "react";
import {
  Copy,
  RotateCcw,
  RotateCw,
  Trash2,
  ZoomIn,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * For 90°/270° rotations, scale the image by the A4 aspect ratio (~1.414)
 * so the rotated content fills the card without leaving empty space.
 */
function getRotationStyle(rotation: number): React.CSSProperties {
  const deg = ((rotation % 360) + 360) % 360;
  if (deg === 0) return {};
  if (deg === 180) return { transform: "rotate(180deg)" };
  const scale = 1.414;
  return {
    transform: `rotate(${deg}deg) scale(${scale})`,
    transformOrigin: "center center",
  };
}

interface RotatePageCardProps {
  pageNum: number;
  fileName: string;
  thumb?: string;
  loadingThumb?: boolean;
  isBlank?: boolean;
  rotation: number;
  selected: boolean;
  onSelect: () => void;
  onZoom: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

export const RotatePageCard = memo(function RotatePageCard({
  pageNum,
  fileName,
  thumb,
  loadingThumb,
  isBlank,
  rotation,
  selected,
  onSelect,
  onZoom,
  onRotateLeft,
  onRotateRight,
  onDuplicate,
  onRemove,
}: RotatePageCardProps) {
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
            ? "bg-blue-50 ring-2 ring-blue-500/30"
            : "bg-transparent hover:bg-gray-50"
        )}
      >
        {/* Checkbox */}
        <div className="absolute left-3 top-3 z-20">
          <label className="flex cursor-pointer">
            <input
              type="checkbox"
              checked={selected}
              onChange={onSelect}
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 accent-blue-600"
            />
          </label>
        </div>

        {/* Hover toolbar — Smallpdf style: icons appear on hover */}
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

        {/* Page thumbnail — Smallpdf-style: white card, shadow, image fills naturally */}
        <button
          type="button"
          onClick={onSelect}
          className="relative block w-full cursor-pointer overflow-hidden rounded-md border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
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
          </div>
        </button>

        {/* Rotate overlay — Smallpdf style: circular buttons at bottom center */}
        <div className="absolute bottom-14 left-1/2 z-20 flex -translate-x-1/2 gap-1 opacity-0 transition-opacity duration-150 group-hover/card:opacity-100">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRotateLeft(); }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:scale-110 hover:bg-blue-700"
            title="Rotate left"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRotateRight(); }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:scale-110 hover:bg-blue-700"
            title="Rotate right"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>

        {/* File label + page number */}
        <p
          className="mx-auto mt-2 max-w-full truncate rounded-full bg-emerald-100 px-2.5 py-0.5 text-center text-[10px] font-medium text-emerald-800"
          title={fileName}
        >
          {shortName}
        </p>
        <p className="mt-0.5 text-center text-xs font-semibold text-gray-700">
          {pageNum}
        </p>
      </div>
    </div>
  );
});
