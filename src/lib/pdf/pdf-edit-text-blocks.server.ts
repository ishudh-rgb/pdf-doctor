import { loadPdfDocument } from "@/lib/pdf/pdf-thumbnails.server";
import { fontIdFromPdfName, isItalicPdfFont } from "@/lib/edit-pdf/fonts";

export interface PdfTextBlock {
  id: string;
  page: number;
  text: string;
  xNorm: number;
  yNorm: number;
  widthNorm: number;
  heightNorm: number;
  fontSize: number;
  fontName: string;
  fontId: string;
  bold: boolean;
  italic: boolean;
  /** True when block is a single PDF text line (no wrap in preview). */
  singleLine: boolean;
}

function isBoldFontName(fontName: string): boolean {
  return /bold|black|heavy|semibold|demi/i.test(fontName);
}

function isWatermarkFragment(
  text: string,
  fontSize: number,
  centerXNorm: number,
  rotated: boolean
): boolean {
  if (rotated) return true;
  if (/^confidential$/i.test(text.trim())) return true;
  if (fontSize > 28 && text.trim().length <= 20) return true;
  if (
    text.trim().length <= 14 &&
    fontSize > 18 &&
    centerXNorm > 0.25 &&
    centerXNorm < 0.75
  ) {
    return true;
  }
  return false;
}

function fontSizeFromTransform(
  tm: number[],
  itemHeight: number
): number {
  const scaleX = Math.hypot(tm[0], tm[1]);
  const scaleY = Math.hypot(tm[2], tm[3]);
  const fromMatrix = scaleX > 0 ? scaleX : scaleY;
  if (itemHeight > 0 && fromMatrix > 0) {
    return Math.max(fromMatrix, itemHeight * 0.85);
  }
  return fromMatrix || itemHeight || 10;
}

type RawFragment = {
  text: string;
  x: number;
  yTop: number;
  yBaseline: number;
  w: number;
  h: number;
  fontSize: number;
  fontName: string;
  bold: boolean;
  italic: boolean;
};

/** Merge only fragments on the same baseline that belong to one word/phrase. */
function clusterLine(items: RawFragment[]): RawFragment[] {
  if (items.length === 0) return [];
  const sorted = [...items].sort((a, b) => a.x - b.x);
  const merged: RawFragment[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1];
    const cur = sorted[i];
    const gap = cur.x - (prev.x + prev.w);
    const wordGap = Math.max(1.5, Math.min(prev.fontSize, cur.fontSize) * 0.25);

    if (gap > Math.max(prev.fontSize, cur.fontSize) * 1.2) {
      merged.push({ ...cur });
      continue;
    }

    if (gap < 14 && gap >= -2) {
      const joiner = gap <= wordGap ? "" : " ";
      prev.text = `${prev.text}${joiner}${cur.text}`;
      prev.w = cur.x + cur.w - prev.x;
      prev.h = Math.max(prev.h, cur.h);
      prev.bold = prev.bold || cur.bold;
      prev.italic = prev.italic || cur.italic;
      prev.fontSize = Math.max(prev.fontSize, cur.fontSize);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

function groupIntoLines(items: RawFragment[]): RawFragment[][] {
  const sorted = [...items].sort((a, b) => a.yBaseline - b.yBaseline || a.x - b.x);
  const lines: RawFragment[][] = [];

  for (const item of sorted) {
    let placed = false;
    for (const line of lines) {
      const refBaseline = line.reduce((s, f) => s + f.yBaseline, 0) / line.length;
      const refSize = line.reduce((s, f) => s + f.fontSize, 0) / line.length;
      const tol = Math.max(2, Math.min(refSize, item.fontSize) * 0.3);
      if (Math.abs(item.yBaseline - refBaseline) <= tol) {
        line.push(item);
        placed = true;
        break;
      }
    }
    if (!placed) lines.push([item]);
  }

  return lines;
}

function segmentToBlock(
  seg: RawFragment,
  pageNum: number,
  blockIndex: number,
  pageW: number,
  pageH: number
): PdfTextBlock {
  const fontSize = Math.round(seg.fontSize * 1000) / 1000;
  const heightNorm = (fontSize * 1.1) / pageH;

  return {
    id: `p${pageNum}-b${blockIndex}`,
    page: pageNum,
    text: seg.text.replace(/\s+/g, " ").trim(),
    xNorm: seg.x / pageW,
    yNorm: seg.yTop / pageH,
    widthNorm: Math.min(Math.max(seg.w / pageW, 0.01), 0.95),
    heightNorm,
    fontSize,
    fontName: seg.fontName,
    fontId: fontIdFromPdfName(seg.fontName),
    bold: seg.bold,
    italic: seg.italic,
    singleLine: true,
  };
}

export async function extractPdfTextBlocks(buffer: Buffer): Promise<PdfTextBlock[]> {
  const doc = await loadPdfDocument(buffer);
  const allBlocks: PdfTextBlock[] = [];

  try {
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      const pageW = viewport.width;
      const pageH = viewport.height;

      const textContent = await page.getTextContent({
        includeMarkedContent: false,
        disableNormalization: false,
      });

      const rawItems: RawFragment[] = [];

      for (const item of textContent.items) {
        if (!("str" in item) || !item.str.trim()) continue;
        const tm = item.transform;
        const fontSize = fontSizeFromTransform(tm, item.height);
        const [vx, vyBaseline] = viewport.convertToViewportPoint(tm[4], tm[5]);
        const textHeight = item.height > 0 ? item.height : fontSize * 1.05;
        const yTop = vyBaseline - textHeight;
        const w = item.width > 0 ? item.width : item.str.length * fontSize * 0.35;
        const h = textHeight;
        const rotated = Math.abs(tm[1]) > 0.15 || Math.abs(tm[2]) > 0.15;
        const fontName = "fontName" in item ? String(item.fontName ?? "") : "";
        const centerXNorm = (vx + w / 2) / pageW;

        if (isWatermarkFragment(item.str, fontSize, centerXNorm, rotated)) continue;

        rawItems.push({
          text: item.str,
          x: vx,
          yTop,
          yBaseline: vyBaseline,
          w,
          h,
          fontSize,
          fontName,
          bold: isBoldFontName(fontName),
          italic: isItalicPdfFont(fontName),
        });
      }

      const lineGroups = groupIntoLines(rawItems);

      let blockIndex = 0;
      for (const line of lineGroups) {
        const segments = clusterLine(line);
        for (const seg of segments) {
          const text = seg.text.replace(/\s+/g, " ").trim();
          if (!text || text.length < 1) continue;
          allBlocks.push(segmentToBlock(seg, pageNum, blockIndex++, pageW, pageH));
        }
      }

      page.cleanup();
    }
  } finally {
    await doc.destroy();
  }

  return allBlocks;
}
