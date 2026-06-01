"use client";

import { Plus } from "lucide-react";

interface MergeAddPlaceholderProps {
  onClick: () => void;
}

export function MergeAddPlaceholder({ onClick }: MergeAddPlaceholderProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[220px] w-[136px] shrink-0 flex-col items-center justify-center self-end rounded-2xl border-2 border-dashed border-pd-brand/35 bg-white/50 px-3 text-center transition-colors hover:border-pd-brand hover:bg-white/80 sm:h-[236px] sm:w-[156px]"
    >
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#c5daf5] text-pd-brand">
        <Plus className="h-6 w-6 stroke-[2.5]" />
      </span>
      <span className="text-[11px] font-medium leading-snug text-pd-muted">
        Add PDF, image, Word, Excel, and PowerPoint files
      </span>
    </button>
  );
}
