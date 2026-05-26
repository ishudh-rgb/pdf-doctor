import { ToolPreviewShell, PreviewInnerFrame } from "@/components/tools/previews/tool-preview-shell";
import { formatFileSize } from "@/lib/utils/file";
import { cn } from "@/lib/utils/cn";

export function CompressionLevelPreview({
  level,
  originalSize,
}: {
  level: "basic" | "strong";
  originalSize: number;
}) {
  const estimateRatio = level === "basic" ? 0.72 : 0.48;
  const estimatedSize = originalSize > 0 ? Math.round(originalSize * estimateRatio) : 0;
  const savedPct = originalSize > 0 ? Math.round((1 - estimateRatio) * 100) : level === "basic" ? 28 : 52;

  return (
    <ToolPreviewShell hint="Estimated result — actual compression depends on PDF content">
      <PreviewInnerFrame className="justify-between">
        <div>
          <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
            <span>Quality</span>
            <span>File size</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div
              className={cn(
                "flex flex-col justify-center rounded-lg border p-3 text-center",
                level === "basic" ? "border-orange-300 bg-orange-50" : "border-gray-200"
              )}
            >
              <div className="mx-auto mb-2 h-20 w-full rounded bg-gradient-to-br from-slate-100 to-slate-200 shadow-inner" />
              <p className="text-xs font-semibold text-gray-800">Basic</p>
              <p className="text-[11px] text-gray-500">Sharp text & images</p>
            </div>
            <div
              className={cn(
                "flex flex-col justify-center rounded-lg border p-3 text-center",
                level === "strong" ? "border-orange-300 bg-orange-50" : "border-gray-200"
              )}
            >
              <div className="mx-auto mb-2 h-20 w-full rounded bg-gradient-to-br from-slate-200 to-slate-300 shadow-inner blur-[0.3px]" />
              <p className="text-xs font-semibold text-gray-800">Strong</p>
              <p className="text-[11px] text-gray-500">Smaller file size</p>
            </div>
          </div>
        </div>

        {originalSize > 0 ? (
          <div className="mt-4 shrink-0 rounded-lg bg-slate-50 px-3 py-3 text-center">
            <p className="text-xs text-gray-500">Estimated output</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatFileSize(originalSize)} → {formatFileSize(estimatedSize)}
            </p>
            <p className="mt-1 text-xs text-orange-700">~{savedPct}% smaller</p>
          </div>
        ) : (
          <div className="flex-1" />
        )}
      </PreviewInnerFrame>
    </ToolPreviewShell>
  );
}
