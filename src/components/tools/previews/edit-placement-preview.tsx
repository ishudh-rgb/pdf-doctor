import { PdfPageMockup } from "@/components/tools/previews/pdf-page-mockup";
import { PreviewStatGrid, ToolPreviewShell } from "@/components/tools/previews/tool-preview-shell";

const PDF_WIDTH = 612;
const PDF_HEIGHT = 792;

type TextOverlay = {
  text: string;
  fontSize: number;
  x: number;
  y: number;
  page: number;
  draft?: boolean;
};

type ImageOverlay = {
  previewUrl: string;
  x: number;
  y: number;
  page: number;
  draft?: boolean;
};

export function EditPlacementPreview({
  page,
  textItems,
  imageItems,
}: {
  page: number;
  textItems: TextOverlay[];
  imageItems: ImageOverlay[];
}) {
  const pageTexts = textItems.filter((item) => item.page === page);
  const pageImages = imageItems.filter((item) => item.page === page);
  const totalOnPage = pageTexts.length + pageImages.length;

  return (
    <ToolPreviewShell hint="Preview shows text and image placement on the selected page">
      <PdfPageMockup>
        {pageTexts.map((item, index) => {
          const leftPct = Math.min(Math.max((item.x / PDF_WIDTH) * 100, 0), 90);
          const topPct = Math.min(Math.max((item.y / PDF_HEIGHT) * 100, 0), 92);
          const fontSize = Math.max(10, Math.min(item.fontSize * 0.45, 28));

          return (
            <span
              key={`text-${index}`}
              className="absolute max-w-[70%] truncate font-medium text-gray-800"
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                fontSize: `${fontSize}px`,
                opacity: item.draft ? 0.65 : 1,
              }}
            >
              {item.text}
            </span>
          );
        })}
        {pageImages.map((item, index) => {
          const leftPct = Math.min(Math.max((item.x / PDF_WIDTH) * 100, 0), 85);
          const topPct = Math.min(Math.max((item.y / PDF_HEIGHT) * 100, 0), 85);

          return (
            <img
              key={`image-${index}`}
              src={item.previewUrl}
              alt="Image placement preview"
              className="absolute max-h-[18%] max-w-[28%] object-contain"
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                opacity: item.draft ? 0.65 : 1,
              }}
            />
          );
        })}
        {totalOnPage === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
            Add text or images to preview placement
          </div>
        )}
      </PdfPageMockup>
      <PreviewStatGrid
        items={[
          { label: "Page", value: String(page) },
          { label: "Text", value: String(pageTexts.length) },
          { label: "Images", value: String(pageImages.length) },
        ]}
      />
    </ToolPreviewShell>
  );
}
