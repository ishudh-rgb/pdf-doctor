"use client";

import { RotateCcw, Trash2, ZoomIn, ZoomOut } from "lucide-react";

interface WatermarkOverlayToolbarProps {
  onShrink: () => void;
  onGrow: () => void;
  onRotate: () => void;
  onDelete: () => void;
  shrinkDisabled?: boolean;
  growDisabled?: boolean;
  deleteTitle?: string;
}

export function WatermarkOverlayToolbar({
  onShrink,
  onGrow,
  onRotate,
  onDelete,
  shrinkDisabled,
  growDisabled,
  deleteTitle = "Remove watermark",
}: WatermarkOverlayToolbarProps) {
  return (
    <div className="absolute left-1/2 top-full z-50 mt-2 flex -translate-x-1/2 items-center gap-0.5 rounded-lg bg-[#1f2937]/95 p-1 shadow-lg">
      <button
        type="button"
        onClick={onShrink}
        disabled={shrinkDisabled}
        className="rounded-md p-1.5 text-white transition hover:bg-white/15 disabled:opacity-40"
        title="Make smaller"
      >
        <ZoomOut className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onGrow}
        disabled={growDisabled}
        className="rounded-md p-1.5 text-white transition hover:bg-white/15 disabled:opacity-40"
        title="Make bigger"
      >
        <ZoomIn className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onRotate}
        className="rounded-md p-1.5 text-white transition hover:bg-white/15"
        title="Rotate left"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded-md p-1.5 text-white transition hover:bg-red-500/80"
        title={deleteTitle}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
