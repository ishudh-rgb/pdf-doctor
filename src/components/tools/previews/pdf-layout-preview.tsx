import { PreviewStatGrid, ToolPreviewShell, PreviewInnerFrame } from "@/components/tools/previews/tool-preview-shell";
import { cn } from "@/lib/utils/cn";

export function PdfLayoutPreview({
  pageSize,
  orientation,
  margin,
  imagePreviewUrl,
}: {
  pageSize: "a4" | "letter" | "auto";
  orientation: "portrait" | "landscape";
  margin: "none" | "small" | "medium";
  imagePreviewUrl: string | null;
}) {
  const marginClass =
    margin === "none" ? "inset-1" : margin === "small" ? "inset-3" : "inset-5";

  return (
    <ToolPreviewShell
      hint="Preview shows how images will appear on each PDF page"
      footer={
        <PreviewStatGrid
          items={[
            { label: "Page", value: pageSize.toUpperCase() },
            { label: "Orientation", value: orientation },
            { label: "Margin", value: margin },
          ]}
        />
      }
    >
      <PreviewInnerFrame className="items-center justify-center">
        <div
          className={cn(
            "relative mx-auto w-full max-w-[280px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
            orientation === "portrait" ? "aspect-[3/4]" : "aspect-[4/3]"
          )}
        >
          <div className={cn("absolute rounded-sm border border-dashed border-slate-200 bg-slate-50", marginClass)}>
            {imagePreviewUrl ? (
              <img src={imagePreviewUrl} alt="PDF page preview" className="h-full w-full object-contain" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-gray-400">Image area</div>
            )}
          </div>
        </div>
      </PreviewInnerFrame>
    </ToolPreviewShell>
  );
}
