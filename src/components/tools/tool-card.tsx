import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { ToolIconTile } from "@/components/tools/tool-icon-tile";
import { slugFromToolHref } from "@/components/tools/tool-helpers";

export interface ToolConfig {
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  isPro?: boolean;
}

interface ToolCardProps {
  tool: ToolConfig;
  className?: string;
}

export function ToolCard({ tool, className }: ToolCardProps) {
  return (
    <Link
      href={tool.href}
      className={cn(
        "tool-card-glow group relative flex flex-col rounded-2xl border border-pd-border bg-pd-surface p-5 shadow-sm",
        className
      )}
    >
      {tool.isPro && (
        <Badge variant="pro" className="absolute right-3 top-3">
          PRO
        </Badge>
      )}

      <div className="mb-4">
        <ToolIconTile slug={slugFromToolHref(tool.href)} icon={tool.icon} size="lg" />
      </div>

      <h3 className="text-sm font-semibold text-pd-foreground">{tool.name}</h3>
      <p className="mt-1 text-xs leading-relaxed text-pd-muted">
        {tool.description}
      </p>
    </Link>
  );
}
