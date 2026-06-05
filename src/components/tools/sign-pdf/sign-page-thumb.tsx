"use client";

import { Copy, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SignPageThumbProps {
  pageNum: number;
  thumb?: string;
  isBlank?: boolean;
  active?: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onRotate: () => void;
  onRemove: () => void;
}

export function SignPageThumb({
  pageNum,
  thumb,
  isBlank,
  active,
  onSelect,
  onDuplicate,
  onRotate,
  onRemove,
}: SignPageThumbProps) {
  return (
    <div className="group/thumb relative">
      <div
        className={cn(
          "absolute inset-x-0 top-0 z-20 flex justify-center gap-0.5 rounded-t-lg bg-pd-foreground/90 px-0.5 py-0.5 opacity-0 transition-opacity group-hover/thumb:opacity-100",
          active && "opacity-100"
        )}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRotate();
          }}
          className="rounded p-0.5 text-white hover:bg-white/20"
          title="Rotate left"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="rounded p-0.5 text-white hover:bg-white/20"
          title="Duplicate"
        >
          <Copy className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="rounded p-0.5 text-white hover:bg-red-400/80"
          title="Delete page"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "relative w-full overflow-hidden rounded-lg border-2 bg-white shadow-sm",
          active ? "border-pd-brand ring-2 ring-pd-brand/20" : "border-transparent hover:border-pd-border"
        )}
      >
        {isBlank ? (
          <div className="flex aspect-[3/4] w-full items-center justify-center bg-slate-50 text-[10px] text-pd-muted">
            Blank
          </div>
        ) : thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={`Page ${pageNum}`} className="aspect-[3/4] w-full object-cover object-top" />
        ) : (
          <div className="aspect-[3/4] animate-pulse bg-pd-border/40" />
        )}
        <span
          className={cn(
            "absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-semibold",
            active ? "bg-pd-brand text-white" : "bg-black/60 text-white"
          )}
        >
          {pageNum}
        </span>
      </button>
    </div>
  );
}
