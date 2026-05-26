import { ToolPreviewShell } from "@/components/tools/previews/tool-preview-shell";
import { cn } from "@/lib/utils/cn";

const FILTER_STYLES: Record<"original" | "bw" | "enhanced", string> = {
  original: "",
  bw: "grayscale(100%) contrast(1.25) brightness(1.05)",
  enhanced: "contrast(1.15) saturate(1.08) brightness(1.06)",
};

export function ScanFilterPreview({
  filter,
  imagePreviewUrl,
}: {
  filter: "original" | "bw" | "enhanced";
  imagePreviewUrl: string | null;
}) {
  return (
    <ToolPreviewShell hint="Preview approximates how the selected filter will look in the PDF">
      <div className="grid grid-cols-3 gap-2">
        {(["original", "bw", "enhanced"] as const).map((option) => (
          <div key={option} className="text-center">
            <div
              className={cn(
                "aspect-[3/4] overflow-hidden rounded-lg border bg-white",
                filter === option ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"
              )}
            >
              {imagePreviewUrl ? (
                <img
                  src={imagePreviewUrl}
                  alt={`${option} filter preview`}
                  className="h-full w-full object-cover"
                  style={{ filter: FILTER_STYLES[option] }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-gray-400">No image</div>
              )}
            </div>
            <p className={cn("mt-1 text-[11px] font-medium capitalize", filter === option ? "text-blue-700" : "text-gray-500")}>
              {option === "bw" ? "B&W" : option}
            </p>
          </div>
        ))}
      </div>
    </ToolPreviewShell>
  );
}
