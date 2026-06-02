import { DEFAULT_PDF_WIDTH_PT } from "@/lib/pdf/pdf-coordinates";

/** Convert PDF point size to CSS px on rendered canvas. */
export function fontSizePtToPx(fontSizePt: number, canvasWidthPx: number): number {
  const scale = canvasWidthPx / DEFAULT_PDF_WIDTH_PT;
  return fontSizePt * scale;
}

export function cappedLineHeightNorm(
  fontSizePt: number,
  heightNorm: number,
  pageHeightPt: number
): number {
  const lineNorm = (fontSizePt * 1.2) / pageHeightPt;
  return Math.min(heightNorm, lineNorm);
}

export const WHITEOUT_PAD_NORM = 0.002;

/** Tight whiteout — never taller than one line + tiny pad (prevents overlap). */
export function whiteoutRectStyle(
  xNorm: number,
  yNorm: number,
  widthNorm: number,
  heightNorm: number,
  fontSizePt: number,
  pageHeightPt = 792,
  pad = WHITEOUT_PAD_NORM
) {
  const lineNorm = (fontSizePt * 1.2) / pageHeightPt;
  const h = Math.min(heightNorm, lineNorm + pad * 2);

  return {
    left: `${Math.max(0, (xNorm - pad) * 100)}%`,
    top: `${Math.max(0, (yNorm - pad) * 100)}%`,
    width: `${Math.min(100, (widthNorm + pad * 2) * 100)}%`,
    height: `${Math.min(100, h * 100)}%`,
  };
}
