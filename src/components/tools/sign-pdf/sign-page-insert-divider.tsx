"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileUp, Plus, Square } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SignPageInsertDividerProps {
  onAddDocuments: () => void;
  onAddBlank: () => void;
}

/** Compact + button for vertical thumbnail sidebar (between pages). */
export function SignPageInsertDivider({ onAddDocuments, onAddBlank }: SignPageInsertDividerProps) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuPos = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 6, left: rect.left + rect.width / 2 });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateMenuPos();
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onScroll = () => updateMenuPos();
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, updateMenuPos]);

  const menu =
    open && menuPos
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[200] w-44 -translate-x-1/2 overflow-hidden rounded-lg border border-pd-border bg-white py-1 shadow-xl"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
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
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onAddBlank();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-pd-foreground hover:bg-pd-brand-muted"
            >
              <Square className="h-4 w-4 shrink-0 text-pd-muted" />
              Add blank page
            </button>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className="relative flex justify-center py-1.5">
        <button
          ref={buttonRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full bg-pd-brand text-white shadow-md transition-transform hover:scale-105",
            open && "ring-2 ring-pd-brand/40 ring-offset-1"
          )}
          aria-label="Add page"
          aria-expanded={open}
        >
          <Plus className="h-3.5 w-3.5 stroke-[3]" />
        </button>
      </div>
      {menu}
    </>
  );
}
