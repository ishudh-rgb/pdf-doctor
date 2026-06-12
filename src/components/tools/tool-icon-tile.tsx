import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { TOOL_ACCENT, TOOL_GRADIENT } from "@/components/marketing/home/home-shared";

type ToolIconTileSize = "sm" | "md" | "lg";

const SIZE_STYLES: Record<ToolIconTileSize, { box: string; icon: string }> = {
  sm: { box: "h-10 w-10 rounded-xl", icon: "h-4 w-4" },
  md: { box: "h-14 w-14 rounded-2xl", icon: "h-5 w-5" },
  lg: { box: "h-11 w-11 rounded-xl", icon: "h-5 w-5" },
};

interface ToolIconTileProps {
  slug: string;
  icon: LucideIcon;
  size?: ToolIconTileSize;
  className?: string;
}

export function ToolIconTile({ slug, icon: Icon, size = "md", className }: ToolIconTileProps) {
  const gradient = TOOL_GRADIENT[slug];
  const accent = TOOL_ACCENT[slug] ?? "bg-pd-brand";
  const s = SIZE_STYLES[size];

  return (
    <div
      className={cn(
        "tool-icon-tile relative flex shrink-0 items-center justify-center text-white",
        s.box,
        gradient ? `bg-gradient-to-br ${gradient}` : accent,
        "shadow-[0_8px_20px_-6px_rgba(0,0,0,0.4)]",
        className
      )}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/40 via-white/10 to-transparent" />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-1 left-1/2 h-2 w-[72%] -translate-x-1/2 rounded-full bg-black/25 blur-[3px]"
      />
      <Icon className={cn("relative z-[1] drop-shadow-sm", s.icon)} strokeWidth={2.25} />
    </div>
  );
}
