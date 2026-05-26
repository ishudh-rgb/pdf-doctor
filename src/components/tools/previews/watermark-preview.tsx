import { PdfPageMockup } from "@/components/tools/previews/pdf-page-mockup";
import { PreviewStatGrid, ToolPreviewShell } from "@/components/tools/previews/tool-preview-shell";

export function WatermarkPreview({
  watermarkType,
  text,
  opacity,
  fontSize,
  rotation,
  imagePreviewUrl,
}: {
  watermarkType: "text" | "image";
  text: string;
  opacity: number;
  fontSize: number;
  rotation: number;
  imagePreviewUrl: string | null;
}) {
  const previewFontSize = Math.max(14, Math.min(fontSize * 0.55, 72));
  const displayText = text.trim() || "CONFIDENTIAL";

  return (
    <ToolPreviewShell hint="Preview shows approximate placement on each PDF page">
      <PdfPageMockup>
        <div className="absolute inset-0 flex items-center justify-center">
          {watermarkType === "text" ? (
            <span
              className="select-none font-bold tracking-wide"
              style={{
                opacity,
                transform: `rotate(${rotation}deg)`,
                fontSize: `${previewFontSize}px`,
                color: "#64748b",
                whiteSpace: "nowrap",
              }}
            >
              {displayText}
            </span>
          ) : imagePreviewUrl ? (
            <img
              src={imagePreviewUrl}
              alt="Watermark preview"
              className="max-h-[38%] max-w-[38%] object-contain"
              style={{ opacity, transform: `rotate(${rotation}deg)` }}
            />
          ) : (
            <span className="text-xs text-gray-400">Upload image to preview</span>
          )}
        </div>
      </PdfPageMockup>
      <PreviewStatGrid
        items={[
          { label: "Opacity", value: `${Math.round(opacity * 100)}%` },
          { label: "Font size", value: watermarkType === "text" ? String(fontSize) : "—" },
          { label: "Rotation", value: `${rotation}°` },
        ]}
      />
    </ToolPreviewShell>
  );
}
