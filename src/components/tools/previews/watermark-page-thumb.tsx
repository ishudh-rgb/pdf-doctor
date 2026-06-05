"use client";

import { cn } from "@/lib/utils/cn";

interface WatermarkPageThumbProps {
  displayIndex: number;
  thumb: string;
  active?: boolean;
  landscape?: boolean;
  rotationDeg?: number;
  onSelect: () => void;
  onThumbLoad?: (naturalWidth: number, naturalHeight: number) => void;
}

export function WatermarkPageThumb({
  displayIndex,
  thumb,
  active,
  landscape,
  rotationDeg = 0,
  onSelect,
  onThumbLoad,
}: WatermarkPageThumbProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative w-full overflow-hidden rounded-md border-2 bg-white shadow-sm transition",
        active ? "border-pd-brand ring-2 ring-pd-brand/20" : "border-transparent hover:border-pd-border"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumb}
        alt={`Page ${displayIndex}`}
        className={cn(
          "block w-full object-contain bg-white",
          landscape === undefined ? "aspect-[3/4]" : landscape ? "aspect-[4/3]" : "aspect-[3/4]"
        )}
        style={rotationDeg ? { transform: `rotate(${rotationDeg}deg)` } : undefined}
        onLoad={(e) => {
          const img = e.currentTarget;
          onThumbLoad?.(img.naturalWidth, img.naturalHeight);
        }}
      />
      <span
        className={cn(
          "absolute bottom-1 left-1 rounded px-1 py-0.5 text-[9px] font-semibold",
          active ? "bg-pd-brand text-white" : "bg-black/60 text-white"
        )}
      >
        {displayIndex}
      </span>
    </button>
  );
}
