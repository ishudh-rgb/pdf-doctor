export const PDF_WIDTH = 612;
export const PDF_HEIGHT = 792;

export type SignaturePlacement = "bottom-left" | "bottom-center" | "bottom-right";
export type SignatureSize = "small" | "medium" | "large";

const SIZE_MAP: Record<SignatureSize, { width: number; height: number }> = {
  small: { width: 120, height: 48 },
  medium: { width: 200, height: 80 },
  large: { width: 280, height: 112 },
};

const PLACEMENT_LABELS: Record<SignaturePlacement, string> = {
  "bottom-left": "Bottom left",
  "bottom-center": "Bottom center",
  "bottom-right": "Bottom right",
};

const SIZE_LABELS: Record<SignatureSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

export function getSignatureDimensions(size: SignatureSize) {
  return SIZE_MAP[size];
}

export function getSignaturePosition(placement: SignaturePlacement, size: SignatureSize) {
  const { width, height } = SIZE_MAP[size];
  const margin = 36;

  switch (placement) {
    case "bottom-left":
      return { x: margin, y: margin, width, height };
    case "bottom-center":
      return { x: Math.round((PDF_WIDTH - width) / 2), y: margin, width, height };
    case "bottom-right":
      return { x: PDF_WIDTH - width - margin, y: margin, width, height };
  }
}

/** pdf-lib uses bottom-left origin; preview uses top-left — convert for display */
export function pdfCoordsToPreviewPercent(
  x: number,
  y: number,
  width: number,
  height: number
) {
  const widthPct = Math.max(Math.min((width / PDF_WIDTH) * 100, 70), 22);
  const heightPct = Math.max(Math.min((height / PDF_HEIGHT) * 100, 35), 10);
  const rawTop = ((PDF_HEIGHT - y - height) / PDF_HEIGHT) * 100;
  const topPct = Math.min(Math.max(rawTop, 0), 96 - heightPct);

  return {
    leftPct: Math.min(Math.max((x / PDF_WIDTH) * 100, 0), 96 - widthPct),
    topPct,
    widthPct,
    heightPct,
  };
}

export function getPlacementLabel(placement: SignaturePlacement) {
  return PLACEMENT_LABELS[placement];
}

export function getSizeLabel(size: SignatureSize) {
  return SIZE_LABELS[size];
}
