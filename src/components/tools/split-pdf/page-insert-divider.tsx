"use client";

import { useEffect, useRef, useState } from "react";
import { FileUp, Plus, Square } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface PageInsertDividerProps {
  onAddDocuments: () => void;
  onAddBlank: () => void;
}

export function PageInsertDivider({ onAddDocuments, onAddBlank }: PageInsertDividerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="group/insert relative mx-0.5 flex w-9 shrink-0 flex-col items-center justify-center self-center sm:mx-1 sm:w-11"
    >
      <div className="min-h-[36px] flex-1 sm:min-h-[48px]" />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pd-brand text-white shadow-md transition-transform hover:scale-110 sm:h-9 sm:w-9",
          open && "ring-2 ring-pd-brand/40 ring-offset-1"
        )}
        aria-label="Add documents"
        aria-expanded={open}
      >
        <Plus className="h-4 w-4 stroke-[3] sm:h-[18px] sm:w-[18px]" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-[calc(50%-2.25rem)] z-20 -translate-x-1/2 whitespace-nowrap rounded bg-pd-foreground px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-md transition-opacity group-hover/insert:opacity-100"
      >
        Add documents
      </span>

      {open && (
        <div className="absolute left-1/2 top-[calc(50%+1.25rem)] z-30 w-44 -translate-x-1/2 overflow-hidden rounded-lg border border-pd-border bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onAddDocuments();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-pd-foreground hover:bg-pd-brand-muted"
          >
            <FileUp className="h-4 w-4 shrink-0 text-pd-brand" />
            Add documents
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onAddBlank();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-pd-foreground hover:bg-pd-brand-muted"
          >
            <Square className="h-4 w-4 shrink-0 text-pd-muted" />
            Add blank page
          </button>
        </div>
      )}

      <div className="min-h-[36px] flex-1 sm:min-h-[48px]" />
    </div>
  );
}
