"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SignThumbScrollPanelProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Smallpdf-style thumbnail column: fixed-height panel with custom scrollbar rail.
 * Parent MUST constrain height (flex-1 min-h-0 or absolute inset-0).
 */
export function SignThumbScrollPanel({ children, className }: SignThumbScrollPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startScrollTop: number } | null>(null);
  const [thumb, setThumb] = useState({ height: 40, top: 0 });
  const [canScroll, setCanScroll] = useState(false);

  const updateThumb = useCallback(() => {
    const el = scrollRef.current;
    const rail = railRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const scrollable = scrollHeight > clientHeight + 2;
    setCanScroll(scrollable);

    const railHeight = rail?.clientHeight ?? clientHeight;
    if (!scrollable) {
      setThumb({ height: Math.max(32, railHeight * 0.35), top: 0 });
      return;
    }

    const thumbHeight = Math.max(28, (clientHeight / scrollHeight) * railHeight);
    const maxThumbTop = Math.max(0, railHeight - thumbHeight);
    const scrollRatio =
      scrollHeight - clientHeight > 0 ? scrollTop / (scrollHeight - clientHeight) : 0;
    setThumb({ height: thumbHeight, top: scrollRatio * maxThumbTop });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateThumb();

    const ro = new ResizeObserver(() => updateThumb());
    ro.observe(el);
    if (railRef.current) ro.observe(railRef.current);

    const mo = new MutationObserver(() => updateThumb());
    mo.observe(el, { childList: true, subtree: true, attributes: true });

    const onLoad = () => updateThumb();
    el.addEventListener("load", onLoad, true);

    const timers = [100, 400, 1000, 2500].map((ms) => window.setTimeout(updateThumb, ms));

    return () => {
      ro.disconnect();
      mo.disconnect();
      el.removeEventListener("load", onLoad, true);
      timers.forEach(clearTimeout);
    };
  }, [children, updateThumb]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      const el = scrollRef.current;
      const rail = railRef.current;
      if (!drag || !el || !rail || !canScroll) return;
      const railHeight = rail.clientHeight;
      const maxScroll = el.scrollHeight - el.clientHeight;
      const thumbHeight = Math.max(28, (el.clientHeight / el.scrollHeight) * railHeight);
      const maxThumbTop = railHeight - thumbHeight;
      const dy = e.clientY - drag.startY;
      const scrollDelta = maxThumbTop > 0 ? (dy / maxThumbTop) * maxScroll : 0;
      el.scrollTop = Math.min(maxScroll, Math.max(0, drag.startScrollTop + scrollDelta));
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [canScroll]);

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ top: delta, behavior: "smooth" });
  };

  const onRailClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    const rail = railRef.current;
    if (!el || !rail || !canScroll) return;
    const rect = rail.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const ratio = clickY / rect.height;
    el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
  };

  const onThumbMouseDown = (e: ReactMouseEvent) => {
    if (!canScroll) return;
    e.preventDefault();
    e.stopPropagation();
    const el = scrollRef.current;
    if (!el) return;
    dragRef.current = { startY: e.clientY, startScrollTop: el.scrollTop };
  };

  return (
    <div
      className={cn(
        "grid h-full min-h-0 w-full overflow-hidden",
        "grid-cols-[minmax(0,1fr)_14px] grid-rows-1",
        className
      )}
    >
      {/* Scrollable thumbnails — clipped inside panel */}
      <div
        ref={scrollRef}
        onScroll={updateThumb}
        className="scrollbar-hide min-h-0 overflow-x-hidden overflow-y-scroll overscroll-contain p-2 pr-0.5"
      >
        {children}
      </div>

      {/* Scrollbar rail — fixed to panel height */}
      <div className="flex min-h-0 flex-col border-l border-[#d8e0ea] bg-[#eef2f7]">
        <button
          type="button"
          onClick={() => scrollBy(-100)}
          disabled={!canScroll}
          className="flex h-[14px] shrink-0 items-center justify-center border-b border-[#d8e0ea] bg-[#eef2f7] text-[#6b7c93] hover:bg-[#e2e8f0] hover:text-[#334155] disabled:opacity-40"
          aria-label="Scroll up"
        >
          <ChevronUp className="h-2.5 w-2.5 stroke-[3]" />
        </button>

        <div
          ref={railRef}
          className="relative min-h-0 flex-1 cursor-pointer bg-[#eef2f7]"
          onClick={onRailClick}
          role="scrollbar"
          aria-orientation="vertical"
        >
          <div
            className={cn(
              "absolute left-[3px] right-[3px] rounded-[4px]",
              canScroll
                ? "cursor-grab bg-[#5a6b7d] shadow-sm active:cursor-grabbing"
                : "bg-[#b8c4d4]/60"
            )}
            style={{ height: thumb.height, top: thumb.top }}
            onMouseDown={onThumbMouseDown}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <button
          type="button"
          onClick={() => scrollBy(100)}
          disabled={!canScroll}
          className="flex h-[14px] shrink-0 items-center justify-center border-t border-[#d8e0ea] bg-[#eef2f7] text-[#6b7c93] hover:bg-[#e2e8f0] hover:text-[#334155] disabled:opacity-40"
          aria-label="Scroll down"
        >
          <ChevronDown className="h-2.5 w-2.5 stroke-[3]" />
        </button>
      </div>
    </div>
  );
}
