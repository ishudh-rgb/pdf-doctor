"use client";

import type { MouseEvent as ReactMouseEvent } from "react";
import { cn } from "@/lib/utils/cn";
import type { PlacedAnnotation } from "@/components/tools/sign-pdf/sign-pdf-types";

export type ResizeHandle = "nw" | "ne" | "sw" | "se";

const HANDLES: { id: ResizeHandle; className: string; cursor: string }[] = [
  { id: "nw", className: "left-0 top-0 -translate-x-1/2 -translate-y-1/2", cursor: "cursor-nw-resize" },
  { id: "ne", className: "right-0 top-0 translate-x-1/2 -translate-y-1/2", cursor: "cursor-ne-resize" },
  { id: "sw", className: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2", cursor: "cursor-sw-resize" },
  { id: "se", className: "right-0 bottom-0 translate-x-1/2 translate-y-1/2", cursor: "cursor-se-resize" },
];

interface SignImageAnnotationProps {
  ann: PlacedAnnotation;
  selected: boolean;
  onSelect: (id: string) => void;
  onDragStart: (e: ReactMouseEvent, id: string, xNorm: number, yNorm: number) => void;
  onResizeStart: (e: ReactMouseEvent, id: string, handle: ResizeHandle, ann: PlacedAnnotation) => void;
}

export function SignImageAnnotation({
  ann,
  selected,
  onSelect,
  onDragStart,
  onResizeStart,
}: SignImageAnnotationProps) {
  if (!ann.dataUrl) return null;

  return (
    <div
      className="absolute"
      style={{
        left: `${ann.xNorm * 100}%`,
        top: `${ann.yNorm * 100}%`,
        width: `${ann.widthNorm * 100}%`,
        height: `${ann.heightNorm * 100}%`,
      }}
      onMouseDown={(e) => {
        onSelect(ann.id);
        onDragStart(e, ann.id, ann.xNorm, ann.yNorm);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ann.dataUrl}
        alt=""
        draggable={false}
        className="h-full w-full cursor-move object-contain"
      />
      {selected && (
        <>
          <div className="pointer-events-none absolute inset-0 border-2 border-pd-brand" />
          {HANDLES.map((handle) => (
            <div
              key={handle.id}
              role="presentation"
              className={cn(
                "absolute z-10 h-2.5 w-2.5 rounded-sm border-2 border-pd-brand bg-white shadow-sm",
                handle.className,
                handle.cursor
              )}
              onMouseDown={(e) => {
                e.stopPropagation();
                onResizeStart(e, ann.id, handle.id, ann);
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
