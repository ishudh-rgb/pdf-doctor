import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { PDFParse } from "pdf-parse";
import { getPdfjsAssetDirs } from "@/lib/pdf/pdfjs-paths";
import { fixLigatureArtifacts } from "@/lib/utils/ligature-fix";

export { fixLigatureArtifacts };

type TextBlockBase = {
  text: string;
  bold?: boolean;
  fontSize?: number;
};

export type WordDocBlock =
  | ({ type: "title" } & TextBlockBase)
  | ({ type: "heading" } & TextBlockBase)
  | ({ type: "paragraph" } & TextBlockBase)
  | ({ type: "bullet" } & TextBlockBase)
  | { type: "table"; rows: string[][] }
  | { type: "pageBreak" };

interface TextFragment {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  rotated: boolean;
  bold: boolean;
}

interface PageElement {
  y: number;
  block: WordDocBlock;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function cleanText(text: string): string {
  return fixLigatureArtifacts(normalizeWhitespace(text));
}

function isWatermark(text: string): boolean {
  const t = normalizeWhitespace(text);
  if (!t) return true;
  if (/^confidential$/i.test(t)) return true;
  if ((t.match(/confidential/gi)?.length ?? 0) >= 2) return true;
  return false;
}

function isWatermarkFragment(fragment: TextFragment, pageWidth: number): boolean {
  if (fragment.rotated) return true;
  if (/^confidential$/i.test(fragment.text)) return true;
  if (fragment.fontSize > 28 && fragment.text.length <= 20) return true;
  const centerX = fragment.x + fragment.width / 2;
  if (
    fragment.text.length <= 14 &&
    fragment.fontSize > 18 &&
    centerX > pageWidth * 0.25 &&
    centerX < pageWidth * 0.75
  ) {
    return true;
  }
  return false;
}

async function loadDocument(fileBuffer: Buffer) {
  const data = new Uint8Array(fileBuffer);
  const { standardFontDataUrl, cMapUrl } = getPdfjsAssetDirs();
  return pdfjs.getDocument({
    data,
    verbosity: pdfjs.VerbosityLevel.ERRORS,
    standardFontDataUrl,
    cMapUrl,
    cMapPacked: true,
    useSystemFonts: true,
  }).promise;
}

function isBoldFontName(fontName: string): boolean {
  return /bold|black|heavy|semibold|demi|medium/i.test(fontName);
}

async function extractPageFragments(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof loadDocument>>["getPage"]>>
): Promise<TextFragment[]> {
  const viewport = page.getViewport({ scale: 1 });
  const textContent = await page.getTextContent({
    includeMarkedContent: false,
    disableNormalization: false,
  });

  const fragments: TextFragment[] = [];

  for (const item of textContent.items) {
    if (!("str" in item)) continue;
    const raw = item.str;
    if (!raw.trim()) continue;

    const tm = item.transform;
    const [x, y] = viewport.convertToViewportPoint(tm[4], tm[5]);
    const fontSize = Math.max(Math.abs(tm[0]), Math.abs(tm[3]), Math.hypot(tm[0], tm[1]));
    const rotated = Math.abs(tm[1]) > 0.15 || Math.abs(tm[2]) > 0.15;
    const fontName = "fontName" in item ? String(item.fontName ?? "") : "";
    const bold = isBoldFontName(fontName);

    const fragment: TextFragment = {
      text: raw,
      x,
      y,
      width: item.width > 0 ? item.width : raw.length * (fontSize * 0.35),
      height: Math.max(item.height, fontSize),
      fontSize,
      rotated,
      bold,
    };

    if (isWatermarkFragment(fragment, viewport.width)) continue;
    fragments.push(fragment);
  }

  return fragments;
}

function shouldJoinWithoutSpace(previous: TextFragment, current: TextFragment, gap: number): boolean {
  const threshold = Math.max(2, Math.min(previous.fontSize, current.fontSize) * 0.28);
  return gap <= threshold;
}

function mergeCloseFragments(line: TextFragment[], gapThreshold = 14): TextFragment[] {
  if (line.length === 0) return [];

  const merged: TextFragment[] = [{ ...line[0] }];

  for (let i = 1; i < line.length; i += 1) {
    const previous = merged[merged.length - 1];
    const current = line[i];
    const gap = current.x - (previous.x + previous.width);

    if (gap < gapThreshold && gap >= -2) {
      const joiner = shouldJoinWithoutSpace(previous, current, gap) ? "" : " ";
      previous.text = `${previous.text}${joiner}${current.text}`;
      previous.width = current.x + current.width - previous.x;
      previous.height = Math.max(previous.height, current.height);
      previous.bold = previous.bold || current.bold;
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

function clusterIntoLines(fragments: TextFragment[]): TextFragment[][] {
  if (fragments.length === 0) return [];

  const sorted = [...fragments].sort((a, b) => a.y - b.y || a.x - b.x);
  const heights = sorted.map((f) => f.height).filter((h) => h > 0);
  const medianHeight =
    heights.length > 0
      ? heights.sort((a, b) => a - b)[Math.floor(heights.length / 2)]
      : 10;
  const tolerance = Math.max(4, medianHeight * 0.65);

  const lines: TextFragment[][] = [];

  for (const fragment of sorted) {
    const current = lines[lines.length - 1];
    if (!current || Math.abs(current[0].y - fragment.y) > tolerance) {
      lines.push([fragment]);
    } else {
      current.push(fragment);
    }
  }

  for (const line of lines) {
    line.sort((a, b) => a.x - b.x);
  }

  return lines.map((line) => mergeCloseFragments(line));
}

function lineText(line: TextFragment[]): string {
  return cleanText(line.map((f) => f.text).join(""));
}

function lineLeftX(line: TextFragment[]): number {
  if (line.length === 0) return 0;
  return Math.min(...line.map((f) => f.x));
}

function lineHeight(line: TextFragment[]): number {
  return Math.max(...line.map((f) => f.height), 0);
}

function lineFontSize(line: TextFragment[]): number {
  const sizes = line.map((f) => f.fontSize).filter((s) => s > 0);
  if (sizes.length === 0) return 10;
  sizes.sort((a, b) => a - b);
  return sizes[Math.floor(sizes.length / 2)];
}

function lineIsBold(line: TextFragment[]): boolean {
  return line.some((f) => f.bold);
}

function isHeadingLine(text: string, height: number, medianHeight: number): boolean {
  if (/^\d+\.\s+\S/.test(text)) return true;
  if (
    text.length < 100 &&
    height > medianHeight * 1.08 &&
    /[A-Za-z]/.test(text) &&
    !text.includes("|")
  ) {
    if (/^\d+\.\s/.test(text)) return true;
    if (/^(Recommended|Core|Base-case|Suggested|Primary|Phase)\b/i.test(text)) return true;
    if (/^[A-Z][A-Za-z0-9\s/&\-–—:()]+$/.test(text) && text.length < 80) return true;
  }
  return false;
}

function parseBullet(text: string): string | null {
  const match = text.match(/^[•●◦▪\-–—*·]\s*(.+)/);
  if (match) return cleanText(match[1]);
  return null;
}

function isIndentBullet(line: TextFragment[], bodyLeftX: number): string | null {
  const text = lineText(line);
  if (!text) return null;

  const explicit = parseBullet(text);
  if (explicit) return explicit;

  const leftX = lineLeftX(line);
  if (bodyLeftX > 0 && leftX >= bodyLeftX + 12) {
    return text;
  }

  return null;
}

function computeBodyLeftX(lines: TextFragment[][]): number {
  const xs: number[] = [];

  for (const line of lines) {
    const text = lineText(line);
    if (!text || isWatermark(text)) continue;
    if (isHeadingLine(text, lineHeight(line), 12)) continue;
    xs.push(lineLeftX(line));
  }

  if (xs.length === 0) return 0;
  xs.sort((a, b) => a - b);
  return xs[Math.floor(xs.length * 0.12)] ?? xs[0];
}

function classifyLine(
  line: TextFragment[],
  medianHeight: number,
  isFirstContentLine: boolean,
  bodyLeftX: number
): WordDocBlock | null {
  const text = lineText(line);
  if (!text || isWatermark(text)) return null;

  const fontSize = lineFontSize(line);
  const bold = lineIsBold(line);
  const style = { fontSize, bold };

  const bulletText = isIndentBullet(line, bodyLeftX);
  if (bulletText) return { type: "bullet", text: bulletText, ...style };

  const height = lineHeight(line);

  if (isFirstContentLine && text.length < 120) {
    return { type: "title", text, ...style, bold: bold || true };
  }

  if (isHeadingLine(text, height, medianHeight)) {
    return { type: "heading", text, ...style, bold: bold || true };
  }

  return { type: "paragraph", text, ...style };
}

function shouldMergeParagraph(prev: string, next: string, nextLine: TextFragment[]): boolean {
  if (!prev || !next) return false;
  if (/^\d+\.\s/.test(next)) return false;
  if (parseBullet(next)) return false;
  if (/^(Recommended|Core|Base-case|Suggested|Strategy|SKU|KRA)\b/i.test(next)) return false;
  if (prev.endsWith(".") || prev.endsWith(":") || prev.endsWith("?")) return false;
  if (/^[A-Z•●◦▪\-–—*]/.test(next)) return false;
  if (nextLine.length >= 3) return false;
  return next.length < 100;
}

function tableFingerprint(rows: string[][]): Set<string> {
  const set = new Set<string>();
  for (const row of rows) {
    for (const cell of row) {
      for (const part of cell.split(/\n/)) {
        const n = cleanText(part).toLowerCase();
        if (n.length >= 3) set.add(n);
      }
    }
  }
  return set;
}

function lineBelongsToTable(text: string, fingerprint: Set<string>): boolean {
  const n = cleanText(text).toLowerCase();
  if (!n) return false;
  if (fingerprint.has(n)) return true;

  for (const entry of fingerprint) {
    if (n.length >= 6 && (entry.includes(n) || n.includes(entry))) return true;
  }
  return false;
}

function adaptiveColumnGap(line: TextFragment[]): number {
  if (line.length < 2) return 24;
  const sorted = [...line].sort((a, b) => a.x - b.x);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    gaps.push(sorted[i].x - (sorted[i - 1].x + sorted[i - 1].width));
  }
  const positive = gaps.filter((g) => g > 0);
  if (positive.length === 0) return 24;
  positive.sort((a, b) => a - b);
  const medianGap = positive[Math.floor(positive.length / 2)];
  return Math.max(16, Math.min(56, medianGap * 0.5));
}

function assignFragmentToColumn(fragmentX: number, columnLefts: number[]): number {
  for (let i = columnLefts.length - 1; i >= 0; i -= 1) {
    if (fragmentX >= columnLefts[i] - 12) return i;
  }
  return 0;
}

function lineToTableRow(line: TextFragment[], columnLefts?: number[]): string[] {
  if (columnLefts && columnLefts.length >= 2) {
    const cells = columnLefts.map(() => "");
    for (const fragment of [...line].sort((a, b) => a.x - b.x)) {
      const idx = assignFragmentToColumn(fragment.x, columnLefts);
      cells[idx] = cells[idx] ? `${cells[idx]} ${fragment.text}` : fragment.text;
    }
    return cells.map((c) => cleanText(c));
  }
  const gap = adaptiveColumnGap(line);
  return mergeCloseFragments(line, gap).map((f) => cleanText(f.text)).filter(Boolean);
}

function isTableCandidateRow(cells: string[]): boolean {
  return cells.length >= 2 && cells.length <= 6;
}

function isTableContinuationLine(
  line: TextFragment[],
  cells: string[],
  previousY: number,
  medianHeight: number,
  colCount: number
): boolean {
  const text = lineText(line);
  if (!text || isWatermark(text)) return false;
  if (/^\d+\.\s+\S/.test(text)) return false;
  if (parseBullet(text)) return false;
  if (/^(Recommended|Core|Base-case|Suggested|Primary|Phase|Financial|Marketing|Sales)\b/i.test(text)) {
    return false;
  }

  const y = line[0]?.y ?? previousY;
  if (Math.abs(y - previousY) > medianHeight * 3) return false;

  const filled = cells.filter((c) => c.trim().length > 0).length;
  if (filled < 2) return false;

  const nonEmpty = cells.filter((c) => c.trim());
  if (nonEmpty.length === 1 && nonEmpty[0].length > 40) return false;

  return filled >= Math.min(2, colCount);
}

function inferColumnLefts(lines: TextFragment[][], start: number, maxRows = 8): number[] {
  const xs: number[] = [];
  const end = Math.min(lines.length, start + maxRows);

  for (let i = start; i < end; i++) {
    const parts = mergeCloseFragments(lines[i], adaptiveColumnGap(lines[i]));
    for (const part of parts) xs.push(part.x);
  }

  if (xs.length === 0) return [];

  xs.sort((a, b) => a - b);
  const clusters: number[] = [];

  for (const x of xs) {
    const near = clusters.find((c) => Math.abs(c - x) < 40);
    if (near !== undefined) {
      const idx = clusters.indexOf(near);
      clusters[idx] = Math.round((clusters[idx] + x) / 2);
    } else {
      clusters.push(Math.round(x));
    }
  }

  return clusters.sort((a, b) => a - b);
}

function splitTrailingPriority(cells: string[]): string[] {
  if (cells.length !== 3) return cells;
  if (cells[2]?.trim()) return cells;

  const mid = cells[1] ?? "";
  const match = mid.match(/\s+(Very High|High|Medium|Low)$/i);
  if (!match) return cells;

  return [cells[0], mid.slice(0, -match[0].length).trim(), match[1]];
}

function normalizeTableRows(rows: string[][]): string[][] {
  return rows.map((row) => splitTrailingPriority(row.map((c) => cleanText(c))));
}

function extractHeuristicTableBlock(
  lines: TextFragment[][],
  start: number,
  medianHeight: number
): { rows: string[][]; end: number } | null {
  const first = lineToTableRow(lines[start]);
  if (!isTableCandidateRow(first)) return null;

  const columnLefts = inferColumnLefts(lines, start);
  if (columnLefts.length < 2) return null;

  const colCount = columnLefts.length;
  const rows: string[][] = [lineToTableRow(lines[start], columnLefts)];
  let i = start + 1;
  let previousY = lines[start][0]?.y ?? 0;

  while (i < lines.length) {
    const text = lineText(lines[i]);
    if (isWatermark(text)) {
      i += 1;
      continue;
    }

    const cells = lineToTableRow(lines[i], columnLefts);
    if (!isTableContinuationLine(lines[i], cells, previousY, medianHeight, colCount)) {
      break;
    }

    while (cells.length < colCount) cells.push("");
    rows.push(cells.slice(0, colCount));
    previousY = lines[i][0]?.y ?? previousY;
    i += 1;
  }

  if (rows.length < 2) return null;
  return { rows: normalizeTableRows(rows), end: i };
}

function findTableY(lines: TextFragment[][], rows: string[][]): number {
  const headerCell = cleanText(rows[0]?.[0] ?? "");
  if (!headerCell) return 0;

  for (const line of lines) {
    const text = lineText(line);
    if (text.includes(headerCell) || headerCell.includes(text)) {
      return line[0]?.y ?? 0;
    }
  }

  return lines[0]?.[0]?.y ?? 0;
}

function cleanTableRows(rows: string[][]): string[][] {
  return normalizeTableRows(
    rows.filter((row) => row.some((cell) => cell.trim().length > 0))
  );
}

async function extractPageElements(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof loadDocument>>["getPage"]>>,
  isFirstContentLine: boolean,
  pageTables: string[][][]
): Promise<{ elements: PageElement[]; hasContent: boolean }> {
  const fragments = await extractPageFragments(page);
  const lines = clusterIntoLines(fragments);
  const bodyLeftX = computeBodyLeftX(lines);

  const heights = lines.flatMap((line) => line.map((f) => f.height)).filter((h) => h > 0);
  const medianHeight =
    heights.length > 0
      ? heights.sort((a, b) => a - b)[Math.floor(heights.length / 2)]
      : 10;

  const fingerprints = pageTables.map(tableFingerprint);
  const consumedLines = new Set<number>();
  const elements: PageElement[] = [];
  let firstLine = isFirstContentLine;

  for (const rows of pageTables) {
    if (rows.length === 0 || (rows[0]?.length ?? 0) < 2) continue;
    const y = findTableY(lines, rows);
    elements.push({ y, block: { type: "table", rows } });

    lines.forEach((line, index) => {
      const text = lineText(line);
      if (fingerprints.some((fp) => lineBelongsToTable(text, fp))) {
        consumedLines.add(index);
      }
    });
  }

  let i = 0;
  while (i < lines.length) {
    if (consumedLines.has(i)) {
      i += 1;
      continue;
    }

    const heuristic = extractHeuristicTableBlock(lines, i, medianHeight);
    if (heuristic) {
      const fp = tableFingerprint(heuristic.rows);
      const duplicate = fingerprints.some((existing) => {
        for (const entry of existing) {
          if (fp.has(entry)) return true;
        }
        return false;
      });

      if (!duplicate) {
        const y = lines[i][0]?.y ?? 0;
        elements.push({ y, block: { type: "table", rows: heuristic.rows } });
        for (let k = i; k < heuristic.end; k += 1) consumedLines.add(k);
        i = heuristic.end;
        continue;
      }
    }

    const classified = classifyLine(lines[i], medianHeight, firstLine, bodyLeftX);
    if (!classified) {
      i += 1;
      continue;
    }

    firstLine = false;

    if (classified.type === "paragraph") {
      let merged = classified.text;
      let j = i + 1;
      while (j < lines.length) {
        if (consumedLines.has(j)) break;
        if (extractHeuristicTableBlock(lines, j, medianHeight)) break;
        const nextText = lineText(lines[j]);
        if (isWatermark(nextText)) {
          j += 1;
          continue;
        }
        const nextClass = classifyLine(lines[j], medianHeight, false, bodyLeftX);
        if (!nextClass || nextClass.type !== "paragraph") break;
        if (!shouldMergeParagraph(merged, nextClass.text, lines[j])) break;
        merged = cleanText(`${merged} ${nextClass.text}`);
        j += 1;
      }

      elements.push({
        y: lines[i][0]?.y ?? 0,
        block: { type: "paragraph", text: merged, fontSize: classified.fontSize, bold: classified.bold },
      });
      i = j;
      continue;
    }

    elements.push({ y: lines[i][0]?.y ?? 0, block: classified });
    i += 1;
  }

  elements.sort((a, b) => a.y - b.y || (a.block.type === "table" ? -1 : 1));
  return { elements, hasContent: elements.length > 0 };
}

export async function extractPdfDocumentForWord(fileBuffer: Buffer): Promise<WordDocBlock[]> {
  const doc = await loadDocument(fileBuffer);
  const parser = new PDFParse({ data: fileBuffer });
  const blocks: WordDocBlock[] = [];

  const tablesByPage = new Map<number, string[][][]>();
  try {
    const tableResult = await parser.getTable();
    for (const page of tableResult.pages) {
      const cleaned = page.tables.map(cleanTableRows).filter((t) => t.length > 0);
      if (cleaned.length > 0) tablesByPage.set(page.num, cleaned);
    }
  } catch {
    /* geometry tables unavailable — heuristic fallback used per page */
  }

  try {
    let isFirstContentLine = true;

    for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
      if (pageNum > 1) {
        blocks.push({ type: "pageBreak" });
      }

      const page = await doc.getPage(pageNum);
      const { elements, hasContent } = await extractPageElements(
        page,
        isFirstContentLine,
        tablesByPage.get(pageNum) ?? []
      );

      if (hasContent) {
        isFirstContentLine = false;
        for (const element of elements) {
          blocks.push(element.block);
        }
      }

      page.cleanup();
    }
  } finally {
    await doc.destroy();
    await parser.destroy();
  }

  return blocks;
}
