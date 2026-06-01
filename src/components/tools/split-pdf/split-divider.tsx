"use client";

import { Scissors } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SplitDividerProps {
  active: boolean;
  onToggle: () => void;
}

export function SplitDivider({ active, onToggle }: SplitDividerProps) {
  return (
    <div className="group/divider relative mx-0.5 flex w-9 flex-col items-center self-stretch sm:mx-1 sm:w-11">
      <div
        className={cn(
          "min-h-[36px] flex-1 border-l-2 transition-colors",
          active ? "border-pd-brand" : "border-dashed border-pd-brand/35"
        )}
      />
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 shadow-sm transition-all sm:h-9 sm:w-9",
          active
            ? "border-pd-brand bg-pd-brand text-white"
            : "border-pd-brand/50 bg-pd-surface text-pd-brand hover:border-pd-brand hover:bg-pd-brand-muted"
        )}
        aria-label={active ? "Remove split" : "Split here"}
      >
        <Scissors className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-[calc(50%-1.75rem)] z-20 -translate-x-1/2 whitespace-nowrap rounded bg-pd-foreground px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-md transition-opacity group-hover/divider:opacity-100"
      >
        {active ? "Remove split" : "Split here"}
      </span>
      <div
        className={cn(
          "min-h-[36px] flex-1 border-l-2 transition-colors",
          active ? "border-pd-brand" : "border-dashed border-pd-brand/35"
        )}
      />
    </div>
  );
}
