"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Eraser,
  Hand,
  Highlighter,
  ImageIcon,
  MousePointer2,
  PenLine,
  PenTool,
  Shapes,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  EDIT_PDF_COLORS,
  EDIT_PDF_FONT_SIZES,
  EDIT_PDF_FONTS,
  fontCssFamily,
} from "@/lib/edit-pdf/fonts";
import type { EditTool, TextAlign, TextDecoration, TextStyle } from "./edit-pdf-types";

function ToolBtn({
  active,
  onClick,
  title,
  label,
  children,
  pro,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  label?: string;
  children: React.ReactNode;
  pro?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "relative flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm transition-colors",
        active
          ? "bg-pd-brand text-white shadow-sm"
          : "text-pd-muted hover:bg-pd-background hover:text-pd-foreground"
      )}
    >
      {children}
      {label && <span className="hidden text-xs font-medium lg:inline">{label}</span>}
      {pro && (
        <Sparkles className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 text-amber-400" />
      )}
    </button>
  );
}

function DropdownMenu({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      className={cn(
        "absolute left-0 top-full z-50 mt-1 min-w-[10rem] rounded-xl border border-pd-border bg-white py-1 shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

interface EditPdfToolbarProps {
  tool: EditTool;
  onToolChange: (tool: EditTool) => void;
  selectedTextStyle: TextStyle | null;
  onStyleChange: (patch: Partial<TextStyle>) => void;
  onDeleteSelected: () => void;
  hasSelection: boolean;
  onSignClick: () => void;
  onImageClick: () => void;
}

export function EditPdfToolbar({
  tool,
  onToolChange,
  selectedTextStyle,
  onStyleChange,
  onDeleteSelected,
  hasSelection,
  onSignClick,
  onImageClick,
}: EditPdfToolbarProps) {
  const [drawOpen, setDrawOpen] = useState(false);
  const [decoOpen, setDecoOpen] = useState(false);

  const drawActive = tool === "draw-pencil" || tool === "draw-highlighter" || tool === "draw-eraser";

  return (
    <div className="border-b border-pd-border bg-white shadow-sm">
      {/* Primary tools row */}
      <div className="flex flex-wrap items-center justify-center gap-1 px-2 py-2 sm:px-4">
        <div className="flex items-center gap-0.5 rounded-xl border border-pd-border bg-pd-surface p-1">
          <ToolBtn active={tool === "select"} onClick={() => onToolChange("select")} title="Select">
            <MousePointer2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn active={tool === "hand"} onClick={() => onToolChange("hand")} title="Pan">
            <Hand className="h-4 w-4" />
          </ToolBtn>

          <div className="mx-0.5 h-5 w-px bg-pd-border" />

          <ToolBtn
            active={tool === "edit-text"}
            onClick={() => onToolChange("edit-text")}
            title="Edit existing PDF text"
            label="Edit Text"
            pro
          >
            <Type className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={tool === "add-text"}
            onClick={() => onToolChange("add-text")}
            title="Add new text box"
          >
            <span className="text-base font-serif font-bold leading-none">T</span>
          </ToolBtn>

          <div className="relative">
            <ToolBtn
              active={drawActive}
              onClick={() => setDrawOpen((v) => !v)}
              title="Draw tools"
            >
              <PenLine className="h-4 w-4" />
              <ChevronDown className="h-3 w-3 opacity-60" />
            </ToolBtn>
            <DropdownMenu open={drawOpen} onClose={() => setDrawOpen(false)}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-pd-background"
                onClick={() => {
                  onToolChange("draw-pencil");
                  setDrawOpen(false);
                }}
              >
                <PenLine className="h-4 w-4" /> Pencil
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-pd-background"
                onClick={() => {
                  onToolChange("draw-highlighter");
                  setDrawOpen(false);
                }}
              >
                <Highlighter className="h-4 w-4 text-yellow-500" /> Highlighter
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-pd-background"
                onClick={() => {
                  onToolChange("draw-eraser");
                  setDrawOpen(false);
                }}
              >
                <Eraser className="h-4 w-4" /> Eraser
              </button>
            </DropdownMenu>
          </div>

          <ToolBtn
            active={tool === "shape-rect"}
            onClick={() => onToolChange("shape-rect")}
            title="Add rectangle shape"
          >
            <Shapes className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn active={tool === "image"} onClick={onImageClick} title="Add image">
            <ImageIcon className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn active={tool === "sign"} onClick={onSignClick} title="Add signature">
            <PenTool className="h-4 w-4" />
          </ToolBtn>

          {hasSelection && (
            <>
              <div className="mx-0.5 h-5 w-px bg-pd-border" />
              <ToolBtn active={false} onClick={onDeleteSelected} title="Delete selection">
                <Trash2 className="h-4 w-4 text-red-500" />
              </ToolBtn>
            </>
          )}
        </div>
      </div>

      {/* Contextual text formatting bar */}
      {selectedTextStyle && (
        <div className="flex flex-wrap items-center gap-2 border-t border-pd-border bg-[#fafafa] px-3 py-2 sm:px-4">
          <select
            value={selectedTextStyle.fontId}
            onChange={(e) => onStyleChange({ fontId: e.target.value })}
            className="max-w-[8.5rem] rounded-lg border border-pd-border bg-white px-2 py-1.5 text-xs"
            style={{ fontFamily: fontCssFamily(selectedTextStyle.fontId) }}
          >
            {EDIT_PDF_FONTS.map((f) => (
              <option key={f.id} value={f.id} style={{ fontFamily: f.cssFamily }}>
                {f.label}
              </option>
            ))}
          </select>

          <select
            value={selectedTextStyle.fontSize}
            onChange={(e) => onStyleChange({ fontSize: Number(e.target.value) })}
            className="w-20 rounded-lg border border-pd-border bg-white px-2 py-1.5 text-xs"
          >
            {EDIT_PDF_FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {Number.isInteger(s) ? s : s.toFixed(1)}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={6}
            max={144}
            step={0.1}
            value={selectedTextStyle.fontSize}
            onChange={(e) => onStyleChange({ fontSize: Number(e.target.value) || 11 })}
            className="w-16 rounded-lg border border-pd-border bg-white px-1 py-1.5 text-xs"
            title="Exact font size"
          />

          <div className="flex items-center gap-1">
            {EDIT_PDF_COLORS.slice(0, 8).map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => onStyleChange({ color: c })}
                className={cn(
                  "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                  selectedTextStyle.color === c ? "border-pd-brand" : "border-gray-200"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={selectedTextStyle.color}
              onChange={(e) => onStyleChange({ color: e.target.value })}
              className="h-6 w-6 cursor-pointer rounded border-0 p-0"
              title="Custom color"
            />
          </div>

          <div className="flex rounded-lg border border-pd-border bg-white p-0.5">
            <button
              type="button"
              onClick={() => onStyleChange({ bold: !selectedTextStyle.bold })}
              className={cn(
                "rounded px-2 py-1 text-xs font-bold",
                selectedTextStyle.bold ? "bg-pd-brand text-white" : "hover:bg-pd-background"
              )}
            >
              B
            </button>
            <button
              type="button"
              onClick={() => onStyleChange({ italic: !selectedTextStyle.italic })}
              className={cn(
                "rounded px-2 py-1 text-xs italic",
                selectedTextStyle.italic ? "bg-pd-brand text-white" : "hover:bg-pd-background"
              )}
            >
              I
            </button>
          </div>

          <div className="flex rounded-lg border border-pd-border bg-white p-0.5">
            {(["left", "center", "right"] as TextAlign[]).map((align) => (
              <button
                key={align}
                type="button"
                onClick={() => onStyleChange({ align })}
                className={cn(
                  "rounded px-2 py-1 text-[10px] uppercase",
                  selectedTextStyle.align === align ? "bg-pd-brand text-white" : "hover:bg-pd-background"
                )}
              >
                {align[0]}
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setDecoOpen((v) => !v)}
              className="flex items-center gap-1 rounded-lg border border-pd-border bg-white px-2 py-1.5 text-xs hover:bg-pd-background"
            >
              <span className="font-medium underline decoration-2">Ab</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            <DropdownMenu open={decoOpen} onClose={() => setDecoOpen(false)} className="min-w-[9rem]">
              {(
                [
                  ["none", "None", ""],
                  ["highlight", "Highlight", "bg-yellow-200"],
                  ["underline", "Underline", "underline"],
                  ["strikethrough", "Strikethrough", "line-through"],
                  ["squiggle", "Squiggle", "underline decoration-wavy"],
                ] as [TextDecoration, string, string][]
              ).map(([value, label, cls]) => (
                <button
                  key={value}
                  type="button"
                  className={cn(
                    "flex w-full px-3 py-2 text-left text-sm hover:bg-pd-background",
                    selectedTextStyle.decoration === value && "bg-pd-brand-muted"
                  )}
                  onClick={() => {
                    onStyleChange({ decoration: value });
                    setDecoOpen(false);
                  }}
                >
                  <span className={cls}>{label === "None" ? "Ab" : "Ab"}</span>
                  <span className="ml-2 text-pd-muted">{label}</span>
                </button>
              ))}
            </DropdownMenu>
          </div>
        </div>
      )}
    </div>
  );
}
