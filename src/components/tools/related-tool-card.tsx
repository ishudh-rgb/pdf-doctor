import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ToolIconTile } from "@/components/tools/tool-icon-tile";

interface RelatedToolCardProps {
  name: string;
  href: string;
  slug: string;
  icon: LucideIcon;
  className?: string;
}

export function RelatedToolCard({ name, href, slug, icon, className }: RelatedToolCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "related-tool-card group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-pd-border/80 bg-pd-surface p-5 shadow-sm",
        className
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-pd-brand/0 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:from-pd-brand/[0.07] group-hover:opacity-100"
      />
      <ToolIconTile slug={slug} icon={icon} size="md" />
      <span className="relative text-center text-sm font-semibold text-pd-foreground transition-colors duration-300 group-hover:text-pd-brand">
        {name}
      </span>
    </Link>
  );
}
