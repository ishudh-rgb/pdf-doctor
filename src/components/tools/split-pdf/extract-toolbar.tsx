"use client";

import { ArrowRight, Copy, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExtractToolbarProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  someSelected: boolean;
  separatePdfs: boolean;
  processing: boolean;
  disabled: boolean;
  onSelectAll: (checked: boolean) => void;
  onRotateLeft: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onSeparatePdfsChange: (value: boolean) => void;
  onFinish: () => void;
}

export function ExtractToolbar({
  selectedCount,
  totalCount,
  allSelected,
  someSelected,
  separatePdfs,
  processing,
  disabled,
  onSelectAll,
  onRotateLeft,
  onDuplicateSelected,
  onDeleteSelected,
  onSeparatePdfsChange,
  onFinish,
}: ExtractToolbarProps) {
  const finishLabel =
    selectedCount === 0
      ? "Finish"
      : separatePdfs
        ? `Finish (${selectedCount} PDFs)`
        : "Finish";

  return (
    <>
      <label className="flex cursor-pointer items-center gap-2 text-xs sm:text-sm">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected;
          }}
          onChange={(e) => onSelectAll(e.target.checked)}
          className="accent-pd-brand"
        />
        <span className="font-medium text-pd-foreground">Select all</span>
      </label>

      <div className="flex items-center gap-0.5 rounded-lg border border-pd-border bg-pd-surface p-0.5">
        <button
          type="button"
          onClick={onRotateLeft}
          disabled={selectedCount === 0}
          className="rounded p-1.5 text-pd-muted hover:bg-pd-background hover:text-pd-foreground disabled:opacity-40"
          title="Rotate selected left"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDuplicateSelected}
          disabled={selectedCount === 0}
          className="rounded p-1.5 text-pd-muted hover:bg-pd-background hover:text-pd-foreground disabled:opacity-40"
          title="Duplicate selected"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={selectedCount === 0}
          className="rounded p-1.5 text-pd-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
          title="Remove selected pages"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <span className="hidden text-xs text-pd-muted sm:inline">
        {selectedCount} of {totalCount} selected
      </span>

      <div className="ml-auto flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs sm:text-sm">
          <input
            type="checkbox"
            checked={separatePdfs}
            onChange={(e) => onSeparatePdfsChange(e.target.checked)}
            className="accent-pd-brand"
          />
          <span className="text-pd-foreground">Separate PDFs</span>
        </label>

        <Button
          size="sm"
          onClick={onFinish}
          disabled={disabled || processing}
          className="gap-1.5"
        >
          {processing ? "Processing…" : finishLabel}
          {!processing && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </>
  );
}
