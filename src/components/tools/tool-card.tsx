import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";

export interface ToolConfig {
  name: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  iconColor: string;
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
        "tool-card-glow group relative flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm",
        className
      )}
    >
      {tool.isPro && (
        <Badge variant="pro" className="absolute right-3 top-3">
          PRO
        </Badge>
      )}

      <div
        className={cn(
          "mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
          tool.iconColor
        )}
      >
        {tool.icon}
      </div>

      <h3 className="text-sm font-semibold text-slate-900">{tool.name}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        {tool.description}
      </p>
    </Link>
  );
}
