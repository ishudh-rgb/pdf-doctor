"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  FileUp,
  LayoutGrid,
  List,
  Plus,
  RotateCcw,
  RotateCw,
  Square,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

export type MergeViewTab = "files" | "pages";

interface MergeToolbarProps {
  viewTab: MergeViewTab;
  selectedCount: number;
  totalCount: number;
  processing: boolean;
  canExport: boolean;
  onViewTabChange: (tab: MergeViewTab) => void;
  onAddDocuments: () => void;
  onAddBlankPage?: () => void;
  selectionLabel?: string;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onDeleteSelected: () => void;
  hideSelectionText?: boolean;
  onExport: () => void;
}

export function MergeToolbar({
  viewTab,
  selectedCount,
  totalCount,
  processing,
  canExport,
  onViewTabChange,
  onAddDocuments,
  onAddBlankPage,
  selectionLabel,
  onRotateLeft,
  onRotateRight,
  onDeleteSelected,
  hideSelectionText,
  onExport,
}: MergeToolbarProps) {
  const [addOpen, setAddOpen] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!addOpen) return;
    const close = (e: MouseEvent) => {
      if (addRef.current && !addRef.current.contains(e.target as Node)) {
        setAddOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [addOpen]);

  const disabledActions = selectedCount === 0;

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <div className="flex rounded-lg border border-pd-border bg-pd-surface p-0.5">
        <button
          type="button"
          onClick={() => onViewTabChange("files")}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm",
            viewTab === "files" ? "bg-pd-brand text-white" : "text-pd-muted hover:text-pd-foreground"
          )}
        >
          Files
        </button>
        <button
          type="button"
          onClick={() => onViewTabChange("pages")}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm",
            viewTab === "pages" ? "bg-pd-brand text-white" : "text-pd-muted hover:text-pd-foreground"
          )}
        >
          Pages
        </button>
      </div>

      <div className="hidden h-6 w-px bg-pd-border sm:block" />

      <div ref={addRef} className="relative">
        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-pd-border bg-pd-surface px-2.5 py-1.5 text-xs font-semibold text-pd-foreground hover:bg-pd-background sm:text-sm"
        >
          <Plus className="h-4 w-4 text-pd-brand" />
          Add
        </button>
        {addOpen && (
          <div className="absolute left-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-lg border border-pd-border bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setAddOpen(false);
                onAddDocuments();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-pd-foreground hover:bg-pd-brand-muted"
            >
              <FileUp className="h-4 w-4 shrink-0 text-pd-brand" />
              Add documents
            </button>
            {onAddBlankPage && (
              <button
                type="button"
                onClick={() => {
                  setAddOpen(false);
                  onAddBlankPage();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-pd-foreground hover:bg-pd-brand-muted"
              >
                <Square className="h-4 w-4 shrink-0 text-pd-muted" />
                Add blank page
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-0.5 rounded-lg border border-pd-border bg-pd-surface p-0.5">
        <button
          type="button"
          onClick={onRotateLeft}
          disabled={disabledActions}
          className="rounded p-1.5 text-pd-muted hover:bg-pd-background hover:text-pd-foreground disabled:opacity-40"
          title="Rotate selected"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRotateRight}
          disabled={disabledActions}
          className="rounded p-1.5 text-pd-muted hover:bg-pd-background hover:text-pd-foreground disabled:opacity-40"
          title="Rotate right"
        >
          <RotateCw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={disabledActions}
          className="rounded p-1.5 text-pd-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
          title="Remove selected"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {!hideSelectionText && (
        <span className="hidden text-xs text-pd-muted sm:inline">
          {selectionLabel ?? `${selectedCount} of ${totalCount} selected`}
        </span>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="hidden rounded p-1.5 text-pd-muted hover:bg-pd-background sm:block"
          title="Grid view"
          aria-label="Grid view"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="hidden rounded p-1.5 text-pd-muted hover:bg-pd-background sm:block"
          title="List view"
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </button>
        <Button
          size="sm"
          onClick={onExport}
          disabled={!canExport || processing}
          className="gap-1.5"
        >
          {processing ? "Processing…" : "Export"}
          {!processing && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
