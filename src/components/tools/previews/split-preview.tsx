import { ToolPreviewShell, PreviewInnerFrame } from "@/components/tools/previews/tool-preview-shell";
import { cn } from "@/lib/utils/cn";

export function SplitRangePreview({
  splitMode,
  startPage,
  endPage,
  totalPages,
}: {
  splitMode: "all" | "range";
  startPage: string;
  endPage: string;
  totalPages: number | null;
}) {
  const total = totalPages && totalPages > 0 ? totalPages : 8;
  const start = Math.max(1, parseInt(startPage, 10) || 1);
  const end =
    splitMode === "all"
      ? total
      : Math.min(total, Math.max(start, parseInt(endPage, 10) || start));

  const selectedPages =
    splitMode === "all"
      ? Array.from({ length: total }, (_, i) => i + 1)
      : Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <ToolPreviewShell
      className="h-full"
      hint="Highlighted pages will be included in the output"
    >
      <PreviewInnerFrame className="min-h-0 flex-1 justify-start p-3">
        <p className="mb-2 shrink-0 text-center text-xs font-medium text-pd-foreground">
          {splitMode === "all"
            ? `All ${total} pages → separate PDFs (ZIP)`
            : `Pages ${start}–${end} → one PDF`}
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
            {Array.from({ length: total }, (_, i) => i + 1).map((page) => {
              const selected = selectedPages.includes(page);
              return (
                <div
                  key={page}
                  className={cn(
                    "flex h-9 items-center justify-center rounded border text-[10px] font-semibold sm:h-10 sm:text-xs",
                    selected
                      ? "border-pd-brand bg-pd-brand-muted text-pd-brand"
                      : "border-pd-border bg-pd-background text-pd-muted"
                  )}
                >
                  {page}
                </div>
              );
            })}
          </div>
        </div>
      </PreviewInnerFrame>
    </ToolPreviewShell>
  );
}
