"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { WatermarkOverlayToolbar } from "@/components/tools/previews/watermark-overlay-toolbar";

const MIN_FONT_SIZE = 18;
const MAX_FONT_SIZE = 96;
const FONT_STEP = 4;
const ROTATE_STEP = 15;

interface WatermarkTextOverlayProps {
  text: string;
  color: string;
  opacity: number;
  rotation: number;
  fontSize: number;
  fontSizePx: number;
  onFontSizeChange: (size: number) => void;
  onRotationChange: (rotation: number) => void;
  onClear: () => void;
}

export function WatermarkTextOverlay({
  text,
  color,
  opacity,
  rotation,
  fontSize,
  fontSizePx,
  onFontSizeChange,
  onRotationChange,
  onClear,
}: WatermarkTextOverlayProps) {
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

  if (!text.trim()) return null;

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
            onShrink={() => onFontSizeChange(Math.max(MIN_FONT_SIZE, fontSize - FONT_STEP))}
            onGrow={() => onFontSizeChange(Math.min(MAX_FONT_SIZE, fontSize + FONT_STEP))}
            onRotate={() => onRotationChange(rotation - ROTATE_STEP)}
            onDelete={() => {
              setSelected(false);
              onClear();
            }}
            shrinkDisabled={fontSize <= MIN_FONT_SIZE}
            growDisabled={fontSize >= MAX_FONT_SIZE}
            deleteTitle="Clear watermark text"
          />
        )}

        <span
          role="button"
          tabIndex={0}
          onClick={() => setSelected(true)}
          onKeyDown={(e) => e.key === "Enter" && setSelected(true)}
          className={cn(
            "cursor-pointer select-none font-bold tracking-wide",
            selected && "rounded ring-2 ring-pd-brand ring-offset-2"
          )}
          style={{
            opacity,
            color,
            transform: `rotate(${rotation}deg)`,
            fontSize: `${fontSizePx}px`,
            fontFamily: "Helvetica, Arial, sans-serif",
            whiteSpace: "nowrap",
            display: "inline-block",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}
