"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface MergeInsertDividerProps {
  onAddDocuments: () => void;
}

export function MergeInsertDivider({ onAddDocuments }: MergeInsertDividerProps) {
  return (
    <div className="group/insert relative mx-0.5 flex w-9 shrink-0 flex-col items-center justify-center self-end pb-10 sm:mx-1 sm:w-11 sm:pb-12">
      <div className="min-h-[36px] flex-1 sm:min-h-[48px]" />
      <button
        type="button"
        onClick={onAddDocuments}
        className={cn(
          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pd-brand text-white shadow-md transition-transform hover:scale-110 sm:h-9 sm:w-9"
        )}
        aria-label="Add documents"
      >
        <Plus className="h-4 w-4 stroke-[3] sm:h-[18px] sm:w-[18px]" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-[calc(50%-2.25rem)] z-20 -translate-x-1/2 whitespace-nowrap rounded bg-pd-foreground px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-md transition-opacity group-hover/insert:opacity-100"
      >
        Add documents
      </span>
      <div className="min-h-[36px] flex-1 sm:min-h-[48px]" />
    </div>
  );
}
