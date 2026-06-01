"use client";

import { ArrowDownAZ, ArrowUpAZ, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type MergeLayoutView = "grid" | "list";
export type MergeSortOrder = "asc" | "desc";

interface MergeSelectionBarProps {
  label: string;
  allSelected: boolean;
  someSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  layoutView: MergeLayoutView;
  sortOrder: MergeSortOrder;
  onSort: () => void;
  onLayoutChange: (view: MergeLayoutView) => void;
  trailing?: React.ReactNode;
}

export function MergeSelectionBar({
  label,
  allSelected,
  someSelected,
  onSelectAll,
  layoutView,
  sortOrder,
  onSort,
  onLayoutChange,
  trailing,
}: MergeSelectionBarProps) {
  const SortIcon = sortOrder === "asc" ? ArrowDownAZ : ArrowUpAZ;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-pd-border bg-[#d6e6f8] px-3 py-2 sm:px-4">
      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected;
          }}
          onChange={(e) => onSelectAll(e.target.checked)}
          className="h-4 w-4 rounded accent-pd-brand"
        />
        <span className="font-medium text-pd-foreground">{label}</span>
      </label>

      <div className="flex items-center gap-1">
        {trailing}
        <button
          type="button"
          onClick={onSort}
          className="rounded p-1.5 text-pd-muted transition-colors hover:bg-white/60 hover:text-pd-foreground"
          title={sortOrder === "asc" ? "Sort A–Z" : "Sort Z–A"}
          aria-label={sortOrder === "asc" ? "Sort A to Z" : "Sort Z to A"}
        >
          <SortIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onLayoutChange("list")}
          className={cn(
            "rounded p-1.5 transition-colors",
            layoutView === "list"
              ? "bg-white/70 text-pd-brand shadow-sm"
              : "text-pd-muted hover:bg-white/60 hover:text-pd-foreground"
          )}
          title="List view"
          aria-label="List view"
          aria-pressed={layoutView === "list"}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onLayoutChange("grid")}
          className={cn(
            "rounded p-1.5 transition-colors",
            layoutView === "grid"
              ? "bg-white/70 text-pd-brand shadow-sm"
              : "text-pd-muted hover:bg-white/60 hover:text-pd-foreground"
          )}
          title="Grid view"
          aria-label="Grid view"
          aria-pressed={layoutView === "grid"}
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

const FILE_LABEL_COLORS = [
  "bg-violet-100 text-violet-900",
  "bg-amber-100 text-amber-900",
  "bg-sky-100 text-sky-900",
  "bg-rose-100 text-rose-900",
  "bg-emerald-100 text-emerald-900",
  "bg-fuchsia-100 text-fuchsia-900",
] as const;

export function fileLabelColor(index: number): string {
  return FILE_LABEL_COLORS[index % FILE_LABEL_COLORS.length];
}
