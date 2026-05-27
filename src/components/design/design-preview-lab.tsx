"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Palette, LayoutGrid, Lock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  BRAND_THEMES,
  LAYOUT_STYLES,
  type BrandThemeId,
  type LayoutStyleId,
} from "@/config/design-system";
import { useDesignPreview } from "@/components/design/design-preview-provider";
import { Button } from "@/components/ui/button";

function LayoutWireframe({ id, active }: { id: LayoutStyleId; active: boolean }) {
  const bar = active ? "bg-pd-brand" : "bg-pd-border";
  const block = active ? "bg-pd-brand/30" : "bg-pd-border/60";

  if (id === "A") {
    return (
      <div className="space-y-1 rounded border border-pd-border p-1.5">
        <div className={cn("h-1.5 w-full rounded", bar)} />
        <div className={cn("h-6 w-full rounded", block)} />
        <div className="grid grid-cols-4 gap-0.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={cn("h-3 rounded", block)} />
          ))}
        </div>
      </div>
    );
  }
  if (id === "B") {
    return (
      <div className="space-y-1 rounded border border-pd-border p-1.5">
        <div className={cn("h-1.5 w-full rounded", bar)} />
        <div className="grid grid-cols-2 gap-0.5">
          <div className={cn("h-5 rounded", block)} />
          <div className={cn("h-5 rounded", block)} />
        </div>
        <div className="grid grid-cols-2 gap-0.5">
          <div className={cn("h-4 rounded", block)} />
          <div className={cn("h-4 rounded", block)} />
        </div>
      </div>
    );
  }
  if (id === "C") {
    return (
      <div className="space-y-1 rounded border border-pd-border p-1.5">
        <div className={cn("h-4 w-full rounded", bar)} />
        <div className="flex gap-0.5">
          {[1, 2, 3].map((n) => (
            <div key={n} className={cn("h-2 flex-1 rounded-full", block)} />
          ))}
        </div>
        <div className={cn("h-5 w-full rounded", block)} />
      </div>
    );
  }
  if (id === "D") {
    return (
      <div className="mx-auto w-3/4 space-y-1 rounded border border-pd-border p-1.5">
        <div className={cn("h-3 w-full rounded", block)} />
        <div className={cn("h-2 w-full rounded", block)} />
        <div className={cn("h-2 w-full rounded", block)} />
        <div className={cn("h-2 w-full rounded", block)} />
      </div>
    );
  }
  return (
    <div className="space-y-1 rounded border border-pd-border p-1.5">
      <div className="grid grid-cols-2 gap-0.5">
        <div className={cn("h-4 rounded", block)} />
        <div className={cn("h-4 rounded", block)} />
      </div>
      <div className={cn("h-3 w-full rounded", block)} />
      <div className="grid grid-cols-3 gap-0.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={cn("h-3 rounded", block)} />
        ))}
      </div>
    </div>
  );
}

export function DesignPreviewLab() {
  const { brandTheme, layoutStyle, setBrandTheme, setLayoutStyle, previewEnabled } =
    useDesignPreview();
  const [open, setOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  if (!previewEnabled) return null;

  const comboLabel = `${BRAND_THEMES[brandTheme].name} + ${LAYOUT_STYLES[layoutStyle].name}`;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-[9998] w-[min(100vw-2rem,320px)] transition-transform duration-300",
        !open && "translate-x-[calc(100%+1rem)]"
      )}
      aria-label="Design preview lab"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "absolute -left-11 top-1/2 flex h-24 w-11 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-l-xl border border-r-0 border-pd-border bg-pd-surface text-[10px] font-semibold text-pd-muted shadow-md",
          !open && "-left-11"
        )}
      >
        <Palette className="h-4 w-4 text-pd-brand" />
        <span className="rotate-180 [writing-mode:vertical-rl]">Preview</span>
      </button>

      <div className="flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border border-pd-border bg-pd-surface shadow-lg">
        <div className="flex shrink-0 items-center justify-between border-b border-pd-border bg-pd-brand-muted px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-pd-brand">Design Lab</p>
            <p className="text-[11px] text-pd-muted">Preview only — not for production</p>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="rounded-lg p-1.5 text-pd-muted hover:bg-pd-background"
            aria-label={collapsed ? "Expand panel" : "Collapse panel"}
          >
            {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {!collapsed && (
          <>
            <div className="shrink-0 border-b border-pd-border p-4 pb-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-pd-foreground">
                <Palette className="h-3.5 w-3.5" /> Brand theme (4 options)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(BRAND_THEMES) as BrandThemeId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setBrandTheme(id)}
                    className={cn(
                      "rounded-lg border px-2.5 py-2 text-left text-xs transition-colors",
                      brandTheme === id
                        ? "border-pd-brand bg-pd-brand-muted font-semibold text-pd-brand"
                        : "border-pd-border text-pd-muted hover:border-pd-border-strong"
                    )}
                  >
                    <span className="font-bold">{id}</span> · {BRAND_THEMES[id].name}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-pd-foreground">
                <LayoutGrid className="h-3.5 w-3.5" /> UX layout (5 unique structures)
              </p>
              <div className="space-y-2">
                {(Object.keys(LAYOUT_STYLES) as LayoutStyleId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setLayoutStyle(id)}
                    className={cn(
                      "w-full rounded-lg border px-2.5 py-2 text-left text-xs transition-colors",
                      layoutStyle === id
                        ? "border-pd-brand bg-pd-brand-muted font-semibold text-pd-brand"
                        : "border-pd-border text-pd-muted hover:border-pd-border-strong"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-14 shrink-0 pt-0.5">
                        <LayoutWireframe id={id} active={layoutStyle === id} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold">{id}</span> · {LAYOUT_STYLES[id].name}
                        <span className="mt-0.5 block text-[10px] font-normal opacity-80">
                          {LAYOUT_STYLES[id].description}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="shrink-0 space-y-3 border-t border-pd-border p-4">
              <div className="rounded-lg bg-pd-background px-3 py-2.5 text-center">
                <p className="text-[10px] uppercase tracking-wide text-pd-muted">Current combo</p>
                <p className="mt-0.5 text-xs font-semibold text-pd-foreground">{comboLabel}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(`Lock Theme ${brandTheme} + Layout ${layoutStyle}`);
                }}
              >
                <Lock className="h-3.5 w-3.5" />
                Copy lock command
              </Button>
              <p className="text-center text-[10px] leading-relaxed text-pd-muted">
                Paste in chat: <strong>Lock Theme {brandTheme} + Layout {layoutStyle}</strong>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
