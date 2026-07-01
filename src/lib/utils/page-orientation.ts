/** Shared page/slide orientation helpers for conversion fallbacks. */

export type PageSizeInches = {
  widthIn: number;
  heightIn: number;
  landscape: boolean;
};

export function pageSizeFromDimensions(
  widthIn: number,
  heightIn: number
): PageSizeInches {
  const w = Math.max(0.1, widthIn);
  const h = Math.max(0.1, heightIn);
  return {
    widthIn: w,
    heightIn: h,
    landscape: w > h,
  };
}

/** Fit image pixel dimensions to PDF points (full-bleed page per image). */
export function pdfPageSizeFromImagePixels(
  widthPx: number,
  heightPx: number,
  maxEdgePt = 1440
): [number, number] {
  const w = Math.max(1, widthPx);
  const h = Math.max(1, heightPx);
  const scale = Math.min(1, maxEdgePt / Math.max(w, h));
  return [w * scale, h * scale];
}

export function cssPageSize(size: PageSizeInches): string {
  return `${size.widthIn}in ${size.heightIn}in`;
}
