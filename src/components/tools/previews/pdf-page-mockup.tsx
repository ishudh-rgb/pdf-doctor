import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function PdfPageMockup({
  children,
  className,
  aspect = "portrait",
}: {
  children: ReactNode;
  className?: string;
  aspect?: "portrait" | "landscape";
}) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
        aspect === "portrait" ? "aspect-[3/4] max-w-[280px]" : "aspect-[16/10] max-w-[320px]",
        className
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(#f8fafc_1px,transparent_1px)] bg-[size:100%_28px] opacity-80" />
      <div className="absolute inset-x-6 top-8 h-2 rounded bg-slate-100" />
      <div className="absolute inset-x-6 top-14 h-2 rounded bg-slate-100" />
      <div className="absolute inset-x-6 top-20 h-2 w-2/3 rounded bg-slate-100" />
      {children}
    </div>
  );
}
