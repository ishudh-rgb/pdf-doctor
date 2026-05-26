import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

interface TextFragment {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TableSchema {
  columnCount: number;
  centers: number[];
  headerRow: string[];
}

export interface ExtractedPageContent {
  pageNum: number;
  infoLines: string[];
  table: string[][] | null;
}

export interface ExtractedPdfTables {
  pages: ExtractedPageContent[];
  primaryTable: string[][] | null;
  infoLines: string[];
}

const HEADER_HINTS = [
  /sl\.?\s*no/i,
  /\bdate\b/i,
  /details/i,
  /particulars/i,
  /description/i,
  /debit/i,
  /credit/i,
  /balance/i,
  /amount/i,
];

const INFO_LINE_PATTERN =
  /^(statement|nitin|khatabook|page\s+\d+\s+of\s+\d+|\d+\s+of\s+\d+)$/i;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isLikelySerialNumber(text: string): boolean {
  return /^\d{1,4}$/.test(text.trim());
}

export function isLikelyAmount(text: string): boolean {
  return /^-?\d[\d,]*(?:\.\d+)?$/.test(text.trim());
}

async function loadDocument(fileBuffer: Buffer) {
  const data = new Uint8Array(fileBuffer);
  const loadingTask = pdfjs.getDocument({ data, verbosity: pdfjs.VerbosityLevel.ERRORS });
  return loadingTask.promise;
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
    const raw = item.str.replace(/\s+/g, " ").trim();
    if (!raw) continue;

    const tm = item.transform;
    const [x, y] = viewport.convertToViewportPoint(tm[4], tm[5]);
    fragments.push({
      text: raw,
      x,
      y,
      width: item.width,
      height: item.height,
    });
  }

  return fragments;
}

function mergeCloseFragments(line: TextFragment[], gapThreshold = 12): TextFragment[] {
  if (line.length === 0) return [];

  const merged: TextFragment[] = [{ ...line[0] }];

  for (let i = 1; i < line.length; i += 1) {
    const previous = merged[merged.length - 1];
    const current = line[i];
    const gap = current.x - (previous.x + previous.width);

    if (gap < gapThreshold) {
      previous.text = normalizeWhitespace(`${previous.text} ${current.text}`);
      previous.width = current.x + current.width - previous.x;
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
  const tolerance = Math.max(4, medianHeight * 0.75);

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
  return normalizeWhitespace(line.map((fragment) => fragment.text).join(" "));
}

function isNoiseInfoLine(text: string): boolean {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return true;
  if (INFO_LINE_PATTERN.test(normalized)) return true;
  if (/^statement\s+nitin$/i.test(normalized)) return true;
  if (/^nitin\s+statement$/i.test(normalized)) return true;
  return false;
}

function scoreHeaderLine(line: TextFragment[]): number {
  const joined = lineText(line).toLowerCase();
  let score = 0;
  for (const hint of HEADER_HINTS) {
    if (hint.test(joined)) score += 1;
  }
  if (line.length >= 3) score += 1;
  if (line.length >= 5) score += 1;
  if (/sl\.?\s*no/.test(joined) && /\bdate\b/.test(joined)) score += 2;
  return score;
}

function findHeaderLineIndex(lines: TextFragment[][]): number {
  let bestIndex = -1;
  let bestScore = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const score = scoreHeaderLine(lines[i]);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestScore >= 3 ? bestIndex : -1;
}

export function isHeaderRow(cells: string[]): boolean {
  const joined = cells.join(" ").toLowerCase();
  return /sl\.?\s*no/.test(joined) && /\bdate\b/.test(joined) && /debit|credit|balance|details/.test(joined);
}

function buildColumnCenters(headerLine: TextFragment[]): number[] {
  return headerLine.map((fragment) => fragment.x + fragment.width / 2);
}

function inferSchemaFromHeader(headerLine: TextFragment[]): TableSchema {
  const headerCells = headerLine.map((fragment) => normalizeWhitespace(fragment.text));
  const centers = buildColumnCenters(headerLine);

  return {
    columnCount: headerLine.length,
    centers,
    headerRow: headerCells,
  };
}

function assignColumnIndex(xCenter: number, centers: number[]): number {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < centers.length; i += 1) {
    const distance = Math.abs(xCenter - centers[i]);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function lineToCells(line: TextFragment[], schema: TableSchema): string[] {
  const cells = Array.from({ length: schema.columnCount }, () => "");

  for (const fragment of line) {
    const col = assignColumnIndex(fragment.x + fragment.width / 2, schema.centers);
    cells[col] = cells[col] ? `${cells[col]} ${fragment.text}` : fragment.text;
  }

  return cells.map(normalizeWhitespace);
}

function shouldStartNewRow(cells: string[], currentRow: string[]): boolean {
  const serialCell = cells[0]?.trim() ?? "";

  if (!isLikelySerialNumber(serialCell)) return false;
  if (!currentRow.some((cell) => cell.trim())) return false;

  const currentSerial = currentRow[0]?.trim() ?? "";
  if (!currentSerial) return false;

  return true;
}

function rowsFromLines(
  lines: TextFragment[][],
  schema: TableSchema,
  startIndex: number,
  initialRow: string[] | null = null
): string[][] {
  const rows: string[][] = [];
  let currentRow = initialRow ?? Array.from({ length: schema.columnCount }, () => "");

  for (let i = startIndex; i < lines.length; i += 1) {
    const text = lineText(lines[i]);
    if (isNoiseInfoLine(text)) continue;

    const cells = lineToCells(lines[i], schema);
    if (!cells.some(Boolean)) continue;
    if (isHeaderRow(cells)) continue;

    if (shouldStartNewRow(cells, currentRow)) {
      if (currentRow.some((cell) => cell.trim())) {
        rows.push(currentRow.map(normalizeWhitespace));
      }
      currentRow = Array.from({ length: schema.columnCount }, () => "");
    }

    for (let col = 0; col < schema.columnCount; col += 1) {
      const value = cells[col];
      if (!value) continue;
      currentRow[col] = currentRow[col] ? `${currentRow[col]} ${value}` : value;
    }
  }

  if (currentRow.some((cell) => cell.trim())) {
    rows.push(currentRow.map(normalizeWhitespace));
  }

  return rows;
}

function extractTableFromLines(
  lines: TextFragment[][],
  existingSchema: TableSchema | null = null
): {
  infoLines: string[];
  table: string[][] | null;
  schema: TableSchema | null;
  carryRow: string[] | null;
} {
  const headerIndex = findHeaderLineIndex(lines);

  if (headerIndex === -1) {
    if (!existingSchema) {
      return {
        infoLines: lines.map(lineText).filter((line) => !isNoiseInfoLine(line)),
        table: null,
        schema: null,
        carryRow: null,
      };
    }

    const dataLines = lines.filter((line) => !isNoiseInfoLine(lineText(line)));
    const dataRows = rowsFromLines(dataLines, existingSchema, 0);
    const table = dataRows.length > 0 ? [existingSchema.headerRow, ...dataRows] : null;

    return {
      infoLines: [],
      table,
      schema: existingSchema,
      carryRow: null,
    };
  }

  const infoLines = lines
    .slice(0, headerIndex)
    .map(lineText)
    .filter((line) => !isNoiseInfoLine(line));

  const schema = existingSchema ?? inferSchemaFromHeader(lines[headerIndex]);
  const dataRows = rowsFromLines(lines, schema, headerIndex + 1);
  const table = [schema.headerRow, ...dataRows];

  return {
    infoLines,
    table: table.length > 1 ? table : null,
    schema,
    carryRow: null,
  };
}

function sameColumnCount(a: string[][], b: string[][]): boolean {
  return (a[0]?.length ?? 0) === (b[0]?.length ?? 0) && (a[0]?.length ?? 0) > 0;
}

function mergePageTables(tables: string[][][]): string[][] | null {
  if (tables.length === 0) return null;

  const merged: string[][] = [tables[0][0]];

  for (let pageIndex = 0; pageIndex < tables.length; pageIndex += 1) {
    const table = tables[pageIndex];
    const startRow = pageIndex === 0 ? 1 : 0;

    for (let rowIndex = startRow; rowIndex < table.length; rowIndex += 1) {
      const row = table[rowIndex];
      if (isHeaderRow(row)) continue;
      merged.push(row);
    }
  }

  return merged.length > 1 ? merged : null;
}

function consolidateContinuationRows(rows: string[][]): string[][] {
  if (rows.length <= 1) return rows;

  const result: string[][] = [rows[0]];

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (isHeaderRow(row)) continue;

    const previous = result[result.length - 1];
    const serialEmpty = !row[0]?.trim();
    const previousHasSerial = !!previous[0]?.trim();

    if (serialEmpty && previousHasSerial) {
      for (let col = 0; col < row.length; col += 1) {
        if (!row[col]) continue;
        previous[col] = previous[col] ? `${previous[col]} ${row[col]}` : row[col];
      }
      continue;
    }

    result.push(row);
  }

  return result;
}

function dedupeInfoLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const line of lines) {
    const normalized = normalizeWhitespace(line);
    if (!normalized || isNoiseInfoLine(normalized)) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

export async function extractPdfTables(fileBuffer: Buffer): Promise<ExtractedPdfTables> {
  const doc = await loadDocument(fileBuffer);
  const pages: ExtractedPageContent[] = [];
  const pageTables: string[][][] = [];
  const allInfoLines: string[] = [];
  let schema: TableSchema | null = null;

  try {
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
      const page = await doc.getPage(pageNum);
      const fragments = await extractPageFragments(page);
      const lines = clusterIntoLines(fragments);
      const extracted = extractTableFromLines(lines, schema);

      if (extracted.schema) {
        schema = extracted.schema;
      }

      allInfoLines.push(...extracted.infoLines);

      if (extracted.table) {
        pageTables.push(extracted.table);
      }

      pages.push({
        pageNum,
        infoLines: extracted.infoLines,
        table: extracted.table,
      });

      page.cleanup();
    }
  } finally {
    await doc.destroy();
  }

  const tablesByColumnCount = new Map<number, string[][][]>();
  for (const table of pageTables) {
    const count = table[0]?.length ?? 0;
    if (count === 0) continue;
    const group = tablesByColumnCount.get(count) ?? [];
    group.push(table);
    tablesByColumnCount.set(count, group);
  }

  let bestGroup: string[][][] = [];
  for (const group of tablesByColumnCount.values()) {
    const rowCount = group.reduce((sum, table) => sum + Math.max(table.length - 1, 0), 0);
    const bestRowCount = bestGroup.reduce(
      (sum, table) => sum + Math.max(table.length - 1, 0),
      0
    );
    if (rowCount > bestRowCount) {
      bestGroup = group;
    }
  }

  const merged = mergePageTables(bestGroup);
  const primaryTable = merged ? consolidateContinuationRows(merged) : null;

  return {
    pages,
    primaryTable,
    infoLines: dedupeInfoLines(allInfoLines),
  };
}

export function parseTabularFallback(text: string): string[][] {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (line.includes("\t") ? line.split("\t").map((cell) => cell.trim()) : [line]));

  const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 1);
  return rows.map((row) => {
    const padded = [...row];
    while (padded.length < maxCols) padded.push("");
    return padded;
  });
}

export function detectAmountColumns(headerRow: string[]): number[] {
  return headerRow
    .map((header, index) => ({ header: header.toLowerCase(), index }))
    .filter(({ header }) => /debit|credit|balance|amount|total|dr|cr/.test(header))
    .map(({ index }) => index);
}

export function isNumericCell(value: string): boolean {
  return isLikelyAmount(value);
}
