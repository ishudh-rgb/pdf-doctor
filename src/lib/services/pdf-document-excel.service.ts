import {
  extractPdfDocumentForWord,
  type WordDocBlock,
} from "@/lib/services/pdf-document-extract.service";

export interface DocumentExportTable {
  rows: string[][];
  row_count: number;
  col_count: number;
  page?: number;
}

const DOCUMENT_SPLIT_SECTIONS = new Set([3, 6, 8, 10, 12]);
const SECTION_HEADER_RE = /^(\d+)\.\s/;

function normalizeRow(row: string[]): string[] {
  return row.map((cell) => cell.replace(/\r\n/g, "\n").trim());
}

function padRows(rows: string[][]): string[][] {
  if (rows.length === 0) return rows;
  const maxCols = Math.max(...rows.map((row) => row.length), 1);
  return rows.map((row) => {
    const padded = [...row];
    while (padded.length < maxCols) padded.push("");
    return normalizeRow(padded.slice(0, maxCols));
  });
}

function tableFromRows(rows: string[][]): DocumentExportTable | null {
  const padded = padRows(rows.filter((row) => row.some((cell) => cell.trim())));
  if (padded.length === 0) return null;
  return {
    rows: padded,
    row_count: padded.length,
    col_count: padded[0]?.length ?? 1,
  };
}

function isSectionHeading(text: string): boolean {
  return SECTION_HEADER_RE.test(text.trim());
}

function sectionNumber(text: string): number | null {
  const match = text.trim().match(SECTION_HEADER_RE);
  return match ? parseInt(match[1], 10) : null;
}

function blocksToSpreadsheetRows(blocks: WordDocBlock[]): string[][] {
  const rows: string[][] = [];
  let narrativeParts: string[] = [];
  let titleParts: string[] = [];
  let bodyStarted = false;

  const flushNarrative = () => {
    if (narrativeParts.length === 0) return;
    rows.push([narrativeParts.join("\n")]);
    narrativeParts = [];
  };

  const flushTitle = () => {
    if (titleParts.length === 0) return;
    rows.push([titleParts.join("\n")]);
    titleParts = [];
    bodyStarted = true;
  };

  for (const block of blocks) {
    if (block.type === "pageBreak") {
      if (rows.length > 0) {
        rows.push([""]);
      }
      continue;
    }

    if (block.type === "table") {
      flushNarrative();
      flushTitle();
      bodyStarted = true;
      for (const row of block.rows) {
        rows.push(normalizeRow(row));
      }
      continue;
    }

    const text = block.text.trim();
    if (!text) continue;

    if (block.type === "title" && !bodyStarted) {
      titleParts.push(text);
      continue;
    }

    flushTitle();
    bodyStarted = true;

    if (block.type === "heading" && isSectionHeading(text)) {
      flushNarrative();
      rows.push([text]);
      continue;
    }

    if (block.type === "heading") {
      flushNarrative();
      rows.push([text]);
      continue;
    }

    if (block.type === "bullet" || block.type === "paragraph") {
      narrativeParts.push(text);
      continue;
    }
  }

  flushNarrative();
  flushTitle();
  return rows;
}

function splitDocumentExportTables(allRows: string[][]): string[][][] {
  const normalized = padRows(allRows);
  if (normalized.length === 0) return [];

  const tables: string[][][] = [];
  let current: string[][] = [];

  for (const row of normalized) {
    const firstCell = row[0]?.trim() ?? "";
    const sectionNum = sectionNumber(firstCell);

    if (
      sectionNum !== null &&
      DOCUMENT_SPLIT_SECTIONS.has(sectionNum) &&
      current.length >= 6
    ) {
      tables.push(current);
      current = [row];
      continue;
    }

    current.push(row);
  }

  if (current.length > 0) {
    tables.push(current);
  }

  return tables.length > 0 ? tables : [normalized];
}

export async function extractDocumentTablesForExcel(
  fileBuffer: Buffer
): Promise<DocumentExportTable[]> {
  const blocks = await extractPdfDocumentForWord(fileBuffer);
  const allRows = blocksToSpreadsheetRows(blocks);
  const split = splitDocumentExportTables(allRows);

  return split.flatMap((rows, index) => {
    const table = tableFromRows(rows);
    if (!table) return [];
    return [{ ...table, page: index + 1 }];
  });
}

export function isWeakDocumentExtraction(tables: DocumentExportTable[]): boolean {
  if (tables.length === 0) return true;

  const singleColumnSheets = tables.filter((table) => table.col_count <= 1).length;
  if (singleColumnSheets / tables.length >= 0.6) return true;

  const first = tables[0];
  if (!first) return true;

  const joined = first.rows.flat().join(" ").toLowerCase();
  if (
    first.col_count <= 1 &&
    joined.includes("problem") &&
    !joined.includes("brand position")
  ) {
    return true;
  }

  const summaryRow = first.rows.find((row) =>
    row.some((cell) => /^brand position$/i.test(cell.trim()))
  );
  if (summaryRow) {
    const hasValues = first.rows.some((row) =>
      row.some((cell) => /accessible premium|contract-manufactured|discovery-first/i.test(cell))
    );
    if (!hasValues) return true;
  }

  if (
    first.row_count <= 8 &&
    first.col_count <= 1 &&
    joined.includes("founder summary")
  ) {
    return true;
  }

  return false;
}

export function scoreDocumentExtraction(tables: DocumentExportTable[]): number {
  if (tables.length === 0) return 0;

  let score = tables.length * 100;
  for (const table of tables) {
    score += table.row_count * 5;
    score += table.col_count * 20;
    const joined = table.rows.flat().join(" ").toLowerCase();
    if (joined.includes("brand position")) score += 200;
    if (joined.includes("segment") && joined.includes("product")) score += 150;
    if (table.col_count === 1) score -= 80;
  }
  return score;
}

export function pickBestDocumentExport(
  primary: DocumentExportTable[],
  fallback: DocumentExportTable[]
): DocumentExportTable[] {
  if (primary.length === 0) return fallback;
  if (fallback.length === 0) return primary;

  if (isWeakDocumentExtraction(primary) && !isWeakDocumentExtraction(fallback)) {
    return fallback;
  }

  const primaryScore = scoreDocumentExtraction(primary);
  const fallbackScore = scoreDocumentExtraction(fallback);
  return fallbackScore > primaryScore ? fallback : primary;
}
