/** Standard PDF width in points (US Letter). Height derived from page aspect ratio. */
export const DEFAULT_PDF_WIDTH_PT = 612;

export interface PageDimensions {
  widthPt: number;
  heightPt: number;
}

export function dimensionsFromAspect(aspectHeightOverWidth: number): PageDimensions {
  const widthPt = DEFAULT_PDF_WIDTH_PT;
  return {
    widthPt,
    heightPt: widthPt * aspectHeightOverWidth,
  };
}

/** Normalized top-left (0–1) → pdf-lib bottom-left coordinates. */
export function normToPdfCoords(
  xNorm: number,
  yNorm: number,
  dims: PageDimensions,
  opts: { fontSize?: number; heightNorm?: number } = {}
): { x: number; y: number } {
  const x = xNorm * dims.widthPt;
  const boxHeightPt = opts.heightNorm
    ? opts.heightNorm * dims.heightPt
    : (opts.fontSize ?? 16) * 1.15;
  // Baseline sits near the bottom of the text box (top-left normalized coords)
  const y =
    dims.heightPt - yNorm * dims.heightPt - Math.max(opts.fontSize ?? 12, boxHeightPt * 0.2);
  return { x: Math.max(0, x), y: Math.max(0, y) };
}

/** pdf-lib bottom-left → normalized top-left for overlay positioning. */
export function pdfToNormCoords(
  x: number,
  y: number,
  dims: PageDimensions,
  blockHeightPt: number
): { xNorm: number; yNorm: number } {
  return {
    xNorm: x / dims.widthPt,
    yNorm: (dims.heightPt - y - blockHeightPt) / dims.heightPt,
  };
}

/** Click position inside rendered page element → normalized coords. */
export function clickToNorm(
  clientX: number,
  clientY: number,
  rect: DOMRect
): { xNorm: number; yNorm: number } {
  const xNorm = (clientX - rect.left) / rect.width;
  const yNorm = (clientY - rect.top) / rect.height;
  return {
    xNorm: Math.min(Math.max(xNorm, 0), 0.95),
    yNorm: Math.min(Math.max(yNorm, 0), 0.95),
  };
}
