import { PdfPageMockup } from "@/components/tools/previews/pdf-page-mockup";
import { PreviewStatGrid, ToolPreviewShell } from "@/components/tools/previews/tool-preview-shell";
import {
  getPlacementLabel,
  getSizeLabel,
  pdfCoordsToPreviewPercent,
  type SignaturePlacement,
  type SignatureSize,
} from "@/lib/utils/signature-placement";

export function SignaturePlacementPreview({
  signatureImageUrl,
  pageNumber,
  placement,
  size,
  posX,
  posY,
  sigWidth,
  sigHeight,
}: {
  signatureImageUrl: string | null;
  pageNumber: number;
  placement: SignaturePlacement;
  size: SignatureSize;
  posX: number;
  posY: number;
  sigWidth: number;
  sigHeight: number;
}) {
  const { leftPct, topPct, widthPct, heightPct } = pdfCoordsToPreviewPercent(
    posX,
    posY,
    sigWidth,
    sigHeight
  );

  return (
    <ToolPreviewShell
      stretch={false}
      hint="Tap a placement option on the left to move your signature"
      footer={
        <PreviewStatGrid
          items={[
            { label: "Page", value: String(pageNumber) },
            { label: "Where", value: getPlacementLabel(placement) },
            { label: "Size", value: getSizeLabel(size) },
          ]}
        />
      }
    >
      <PdfPageMockup className="mx-auto">
        {signatureImageUrl ? (
          <img
            src={signatureImageUrl}
            alt="Signature placement preview"
            className="absolute z-10 object-contain drop-shadow-sm"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: `${widthPct}%`,
              height: `${heightPct}%`,
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
            Create a signature to preview placement
          </div>
        )}
      </PdfPageMockup>
    </ToolPreviewShell>
  );
}
