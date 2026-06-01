import { ToolPreviewShell } from "@/components/tools/previews/tool-preview-shell";
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
  const savedPct =
    originalSize > 0 ? Math.round((1 - estimateRatio) * 100) : level === "basic" ? 28 : 52;

  const basicPct = originalSize > 0 ? Math.round((1 - 0.72) * 100) : 28;
  const strongPct = originalSize > 0 ? Math.round((1 - 0.48) * 100) : 52;

  return (
    <ToolPreviewShell
      stretch={false}
      hint="Estimated result — actual compression depends on PDF content"
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div
            className={cn(
              "rounded-lg border px-2 py-2",
              level === "basic"
                ? "border-pd-brand bg-pd-brand-muted"
                : "border-pd-border bg-pd-surface"
            )}
          >
            <p className="font-semibold text-pd-foreground">Basic</p>
            <p className="text-pd-muted">~{basicPct}% smaller</p>
          </div>
          <div
            className={cn(
              "rounded-lg border px-2 py-2",
              level === "strong"
                ? "border-pd-brand bg-pd-brand-muted"
                : "border-pd-border bg-pd-surface"
            )}
          >
            <p className="font-semibold text-pd-foreground">Strong</p>
            <p className="text-pd-muted">~{strongPct}% smaller</p>
          </div>
        </div>

        {originalSize > 0 && (
          <div className="rounded-lg border border-pd-border bg-pd-surface px-3 py-2.5 text-center">
            <p className="text-xs text-pd-muted">Estimated output</p>
            <p className="mt-1 text-sm font-semibold text-pd-foreground">
              {formatFileSize(originalSize)} → {formatFileSize(estimatedSize)}
            </p>
            <p className="mt-0.5 text-xs font-medium text-pd-brand">~{savedPct}% smaller</p>
          </div>
        )}
      </div>
    </ToolPreviewShell>
  );
}
