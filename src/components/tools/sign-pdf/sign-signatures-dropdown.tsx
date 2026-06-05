"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, PenLine, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { SavedSignature } from "@/components/tools/sign-pdf/sign-pdf-types";

interface SignSignaturesDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  active: boolean;
  signatureItems: SavedSignature[];
  initialsItems: SavedSignature[];
  onPick: (sig: SavedSignature) => void;
  onNewSignature: () => void;
  onNewInitials: () => void;
}

export function SignSignaturesDropdown({
  open,
  onOpenChange,
  active,
  signatureItems,
  initialsItems,
  onPick,
  onNewSignature,
  onNewInitials,
}: SignSignaturesDropdownProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  const updateMenuPos = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 8, left: rect.left });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateMenuPos();
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      onOpenChange(false);
    };
    const reposition = () => updateMenuPos();
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, onOpenChange, updateMenuPos]);

  const menu =
    open && menuPos
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[200] w-[17.5rem] rounded-xl border border-[#e5e7eb] bg-white p-3 shadow-2xl"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            <p className="mb-2 text-sm font-semibold text-[#111827]">Signatures</p>
            {signatureItems.length > 0 && (
              <div className="mb-2 space-y-1">
                {signatureItems.map((sig) => (
                  <button
                    key={sig.id}
                    type="button"
                    onClick={() => {
                      onPick(sig);
                      onOpenChange(false);
                    }}
                    className="flex w-full items-center rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 hover:bg-[#f9fafb]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sig.dataUrl} alt={sig.label} className="h-9 max-w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                onNewSignature();
                onOpenChange(false);
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#d1d5db] bg-white px-4 py-3 text-sm font-medium text-[#111827] transition-colors hover:bg-[#f9fafb]"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              New signature
            </button>

            <p className="mb-2 mt-4 text-sm font-semibold text-[#111827]">Initials</p>
            {initialsItems.length > 0 && (
              <div className="mb-2 space-y-1">
                {initialsItems.map((sig) => (
                  <button
                    key={sig.id}
                    type="button"
                    onClick={() => {
                      onPick(sig);
                      onOpenChange(false);
                    }}
                    className="flex w-full items-center rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 hover:bg-[#f9fafb]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sig.dataUrl} alt={sig.label} className="h-8 max-w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                onNewInitials();
                onOpenChange(false);
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#d1d5db] bg-white px-4 py-3 text-sm font-medium text-[#111827] transition-colors hover:bg-[#f9fafb]"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              New initials
            </button>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          const btn = buttonRef.current;
          if (!open && btn) {
            const rect = btn.getBoundingClientRect();
            setMenuPos({ top: rect.bottom + 8, left: rect.left });
          }
          onOpenChange(!open);
        }}
        aria-expanded={open}
        className={cn(
          "flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium",
          active || open
            ? "bg-pd-brand-muted text-pd-brand"
            : "text-pd-foreground hover:bg-pd-background"
        )}
      >
        <PenLine className="h-4 w-4" />
        Signatures
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {menu}
    </>
  );
}
