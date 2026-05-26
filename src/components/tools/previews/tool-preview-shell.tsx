import { Eye } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Full-height preview card — stretches to match the left tool panel in 2-column layouts */
export const PREVIEW_SHELL_CLASS =
  "flex h-full w-full flex-col rounded-2xl border border-gray-200 bg-slate-50 p-5 shadow-sm";

export function ToolPreviewShell({
  title = "Live Preview",
  children,
  hint,
  className,
  footer,
  stretch = true,
}: {
  title?: string;
  children: ReactNode;
  hint?: string;
  className?: string;
  footer?: ReactNode;
  stretch?: boolean;
}) {
  return (
    <div
      className={cn(
        stretch ? PREVIEW_SHELL_CLASS : "h-fit w-full self-start rounded-2xl border border-gray-200 bg-slate-50 p-5 shadow-sm",
        className
      )}
    >
      <div className="mb-4 flex shrink-0 items-center gap-2">
        <Eye className="h-4 w-4 text-cyan-700" />
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className={cn("flex flex-col", stretch ? "min-h-0 flex-1 justify-center" : "min-h-[260px] justify-center")}>
        {children}
      </div>
      {footer}
      {hint ? <p className="mt-3 shrink-0 text-center text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

export function PreviewStatGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="mt-4 grid shrink-0 grid-cols-3 gap-2 text-center text-xs">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-gray-100 bg-white px-2 py-2">
          <p className="text-gray-500">{item.label}</p>
          <p className="font-semibold text-gray-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function PreviewInnerFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[200px] w-full flex-col justify-center rounded-xl border border-gray-200 bg-white p-4",
        className
      )}
    >
      {children}
    </div>
  );
}
