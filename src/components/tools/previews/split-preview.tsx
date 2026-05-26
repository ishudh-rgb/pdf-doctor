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
    <ToolPreviewShell hint="Highlighted pages will be included in the output">
      <PreviewInnerFrame>
        <p className="mb-3 shrink-0 text-center text-sm font-medium text-gray-800">
          {splitMode === "all"
            ? `All ${total} pages → separate PDFs (ZIP)`
            : `Pages ${start}–${end} → one PDF`}
        </p>
        <div className="grid flex-1 grid-cols-4 content-center gap-2">
          {Array.from({ length: total }, (_, i) => i + 1).map((page) => {
            const selected = selectedPages.includes(page);
            return (
              <div
                key={page}
                className={cn(
                  "flex aspect-[3/4] items-center justify-center rounded-md border text-xs font-semibold",
                  selected
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-gray-50 text-gray-400"
                )}
              >
                {page}
              </div>
            );
          })}
        </div>
      </PreviewInnerFrame>
    </ToolPreviewShell>
  );
}
