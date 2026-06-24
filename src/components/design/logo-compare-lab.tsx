"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ImageIcon, Lock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  LOGO_VARIANTS,
  type LogoVariantId,
} from "@/config/brand-logos";
import { useLogoPreview } from "@/components/providers/logo-preview-provider";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";

export function LogoCompareLab() {
  const { logoVariant, setLogoVariant, previewEnabled } = useLogoPreview();
  const [open, setOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  if (!previewEnabled) return null;

  const current = LOGO_VARIANTS[logoVariant];

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-[9998] w-[min(100vw-2rem,340px)] transition-transform duration-300",
        !open && "-translate-x-[calc(100%+1rem)]"
      )}
      aria-label="Logo compare lab"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="absolute -right-11 top-1/2 flex h-24 w-11 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-r-xl border border-l-0 border-pd-border bg-pd-surface text-[10px] font-semibold text-pd-muted shadow-md"
      >
        <ImageIcon className="h-4 w-4 text-pd-brand" />
        <span className="[writing-mode:vertical-rl]">Logos</span>
      </button>

      <div className="flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border border-pd-border bg-pd-surface shadow-lg">
        <div className="flex shrink-0 items-center justify-between border-b border-pd-border bg-pd-brand-muted px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-pd-brand">
              Logo Compare
            </p>
            <p className="text-[11px] text-pd-muted">Switch to preview on the live site</p>
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
            <div className="shrink-0 border-b border-pd-border p-4">
              <p className="mb-3 text-xs font-semibold text-pd-foreground">
                Pick a logo (4 options)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(LOGO_VARIANTS) as LogoVariantId[]).map((id) => {
                  const option = LOGO_VARIANTS[id];
                  const active = logoVariant === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setLogoVariant(id)}
                      className={cn(
                        "rounded-xl border p-2 text-left transition-all",
                        active
                          ? "border-pd-brand bg-pd-brand-muted ring-2 ring-pd-brand/30"
                          : "border-pd-border hover:border-pd-brand/40"
                      )}
                    >
                      <div className="mb-2 flex h-20 items-center justify-center rounded-lg bg-white px-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={option.src}
                          alt={option.name}
                          className="max-h-16 w-auto max-w-full object-contain"
                          style={{ transform: "scale(1.35)" }}
                        />
                      </div>
                      <p className="text-[11px] font-bold text-pd-foreground">
                        {id} · {option.name}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[10px] text-pd-muted">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 pt-0">
              <p className="mb-2 text-xs font-semibold text-pd-foreground">Header preview</p>
              <div className="rounded-xl border border-pd-border bg-white px-4 py-3">
                <Logo variant="wordmark" />
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-pd-muted">
                Scroll the page and check header, footer, login, and admin — all update instantly.
              </p>
            </div>

            <div className="shrink-0 space-y-3 border-t border-pd-border p-4">
              <div className="rounded-lg bg-pd-background px-3 py-2.5 text-center">
                <p className="text-[10px] uppercase tracking-wide text-pd-muted">Selected</p>
                <p className="mt-0.5 text-xs font-semibold text-pd-foreground">
                  Logo {logoVariant} — {current.name}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(`Lock Logo ${logoVariant}`);
                }}
              >
                <Lock className="h-3.5 w-3.5" />
                Copy lock command
              </Button>
              <p className="text-center text-[10px] leading-relaxed text-pd-muted">
                When you decide, paste in chat:{" "}
                <strong>Lock Logo {logoVariant}</strong>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
