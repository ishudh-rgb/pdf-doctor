"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface MergeSelectionCheckboxProps {
  selected: boolean;
  onToggle: () => void;
  className?: string;
  inline?: boolean;
}

/** Smallpdf-style card checkbox — always visible, blue when checked */
export function MergeSelectionCheckbox({
  selected,
  onToggle,
  className,
  inline,
}: MergeSelectionCheckboxProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "z-30 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border-2 shadow-sm transition-colors",
        inline ? "relative" : "absolute left-2 top-2",
        selected
          ? "border-pd-brand bg-pd-brand text-white"
          : "border-slate-300 bg-white hover:border-pd-brand/50",
        className
      )}
      aria-label={selected ? "Deselect" : "Select"}
      aria-pressed={selected}
    >
      {selected && <Check className="h-3 w-3 stroke-[3]" />}
    </button>
  );
}
