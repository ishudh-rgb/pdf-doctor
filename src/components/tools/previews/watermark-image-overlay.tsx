"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { WatermarkOverlayToolbar } from "@/components/tools/previews/watermark-overlay-toolbar";

const MIN_SCALE = 0.1;
const MAX_SCALE = 0.75;
const SCALE_STEP = 0.05;
const ROTATE_STEP = 15;

interface WatermarkImageOverlayProps {
  imageUrl: string;
  opacity: number;
  rotation: number;
  scale: number;
  widthPx: number;
  onScaleChange: (scale: number) => void;
  onRotationChange: (rotation: number) => void;
  onRemove: () => void;
}

export function WatermarkImageOverlay({
  imageUrl,
  opacity,
  rotation,
  scale,
  widthPx,
  onScaleChange,
  onRotationChange,
  onRemove,
}: WatermarkImageOverlayProps) {
  const [selected, setSelected] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selected) return;
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setSelected(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [selected]);

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 flex items-center justify-center overflow-visible"
      onClick={() => setSelected(false)}
    >
      <div
        className="relative"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {selected && (
          <WatermarkOverlayToolbar
            onShrink={() => onScaleChange(Math.max(MIN_SCALE, scale - SCALE_STEP))}
            onGrow={() => onScaleChange(Math.min(MAX_SCALE, scale + SCALE_STEP))}
            onRotate={() => onRotationChange(rotation - ROTATE_STEP)}
            onDelete={() => {
              setSelected(false);
              onRemove();
            }}
            shrinkDisabled={scale <= MIN_SCALE}
            growDisabled={scale >= MAX_SCALE}
            deleteTitle="Remove watermark image"
          />
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Watermark"
          draggable={false}
          onClick={() => setSelected(true)}
          className={cn(
            "cursor-pointer object-contain transition-shadow",
            selected && "ring-2 ring-pd-brand ring-offset-2"
          )}
          style={{
            opacity,
            transform: `rotate(${rotation}deg)`,
            width: `${widthPx}px`,
            maxWidth: "75%",
            maxHeight: "75%",
          }}
        />
      </div>
    </div>
  );
}
