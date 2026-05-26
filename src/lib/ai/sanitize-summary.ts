import type { AISummaryResult } from "@/lib/ai/provider";

const NOISE_LINE_PATTERN =
  /^(page\s+\d+|slide\s+\d+|table of contents|contents|appendix|founder summary sheet)$/i;

export type SummaryDisplayBlock =
  | { type: "paragraph"; content: string }
  | { type: "point"; label: string; content: string };

function countArrows(text: string): number {
  return (text.match(/->/g) || []).length;
}

export function cleanSummaryText(text: string): string {
  let cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";

  cleaned = cleaned.replace(
    /(?:^|\s)(?:[A-Za-z0-9][A-Za-z0-9\s&.\-/]{0,45}\s*->\s*){2,}[A-Za-z0-9][A-Za-z0-9\s&.\-/]{0,80}\.?\s*/gi,
    " "
  );

  if (countArrows(cleaned) >= 2) {
    const afterArrowSentence = cleaned.match(/->(?:\s*[^->]+){1,12}\.\s*(.+)$/i);
    if (afterArrowSentence?.[1] && afterArrowSentence[1].length > 60) {
      cleaned = afterArrowSentence[1].trim();
    } else {
      const segments = cleaned.split(/\s*->\s*/).map((part) => part.trim());
      const prose = segments
        .map((part) => part.replace(/^[\w\d]+\s+/, "").trim())
        .filter(
          (part) =>
            part.length > 70 &&
            !/^(problem|solution|products|swot|business model|marketing|appendix|sheet)$/i.test(
              part
            )
        )
        .sort((a, b) => b.length - a.length)[0];
      if (prose) cleaned = prose;
    }
  }

  cleaned = cleaned.replace(/(?:^|\s)[A-Za-z0-9][A-Za-z0-9\s&.\-/]{0,30}\s*->\s*/gi, " ");
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
  return cleaned;
}

function cleanLine(line: string): string {
  return cleanSummaryText(line.replace(/^[\d]+[\].)\s-]+/, "").trim());
}

function isNoiseLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 8) return true;
  if (NOISE_LINE_PATTERN.test(trimmed)) return true;
  if (countArrows(trimmed) >= 2) return true;
  return false;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9\u0900-\u097F("])/)
    .map(cleanLine)
    .filter((part) => part.length > 30 && !isNoiseLine(part));
}

function dedupeItems(items: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const item of items) {
    const cleaned = cleanLine(item);
    if (!cleaned || cleaned.length < 12) continue;

    const key = cleaned.toLowerCase().slice(0, 120);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(cleaned);
  }

  return output;
}

function pickTitle(text: string, fallback?: string): string {
  if (fallback && fallback.length > 3 && countArrows(fallback) < 2) {
    return cleanLine(fallback);
  }

  const lines = text
    .split(/\n+/)
    .map(cleanLine)
    .filter((line) => line.length > 3 && line.length < 120 && !isNoiseLine(line));

  return lines[0]?.replace(/[.:]+$/, "") || "Document Summary";
}

export function parseSummaryDisplayBlocks(text: string): SummaryDisplayBlock[] {
  const cleaned = cleanSummaryText(text);
  if (!cleaned) return [];

  const labelPattern = /([A-Z][A-Za-z0-9\s&/\-]{2,42}):\s*/g;
  const matches = [...cleaned.matchAll(labelPattern)];

  if (matches.length >= 2) {
    const blocks: SummaryDisplayBlock[] = [];

    for (let index = 0; index < matches.length; index += 1) {
      const current = matches[index];
      const next = matches[index + 1];
      const start = (current.index ?? 0) + current[0].length;
      const end = next?.index ?? cleaned.length;
      const label = current[1].trim();
      const content = cleanSummaryText(cleaned.slice(start, end).replace(/\.\s*$/, ""));

      if (content.length > 20) {
        blocks.push({ type: "point", label, content });
      }
    }

    if (blocks.length >= 2) return blocks;
  }

  if (cleaned.includes("\n\n")) {
    return cleaned
      .split("\n\n")
      .map(cleanLine)
      .filter(Boolean)
      .map((content) => ({ type: "paragraph" as const, content }));
  }

  return splitSentences(cleaned).map((content) => ({
    type: "paragraph" as const,
    content,
  }));
}

export function preprocessDocumentText(text: string): string {
  return text
    .split(/\n+/)
    .map(cleanLine)
    .filter((line) => !isNoiseLine(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function sanitizeSummaryResult(
  result: AISummaryResult,
  sourceText?: string
): AISummaryResult & { documentTitle: string; topics: string[] } {
  const shortSummary =
    parseSummaryDisplayBlocks(result.shortSummary).find((block) => block.type === "paragraph")
      ?.content ||
    parseSummaryDisplayBlocks(result.shortSummary)[0]?.content ||
    cleanSummaryText(result.shortSummary);

  const detailedBlocks = parseSummaryDisplayBlocks(result.detailedSummary);
  const detailedSummary = detailedBlocks
    .map((block) =>
      block.type === "point" ? `${block.label}: ${block.content}` : block.content
    )
    .join("\n\n");

  const keyPoints = dedupeItems(result.keyPoints.map(cleanSummaryText)).slice(0, 7);
  const actionItems = dedupeItems(result.actionItems.map(cleanSummaryText)).slice(0, 6);
  const importantDates = dedupeItems(result.importantDates.map(cleanSummaryText)).slice(0, 6);

  const topics = dedupeItems([
    ...(result.topics || []).map(cleanSummaryText),
    ...keyPoints.slice(0, 3).map((point) => point.split(/[:,-]/)[0]?.trim() || point),
  ]).slice(0, 4);

  return {
    documentTitle: pickTitle(sourceText || detailedSummary, result.documentTitle),
    shortSummary,
    detailedSummary,
    keyPoints,
    actionItems,
    importantDates,
    topics,
  };
}

export function formatSummaryParagraphs(text: string): string[] {
  return parseSummaryDisplayBlocks(text)
    .filter((block): block is { type: "paragraph"; content: string } => block.type === "paragraph")
    .map((block) => block.content);
}

export function getDetailedDisplayBlocks(text: string): SummaryDisplayBlock[] {
  return parseSummaryDisplayBlocks(text);
}

export function getExecutiveSummaryText(text: string): string {
  const blocks = parseSummaryDisplayBlocks(text);
  const paragraph = blocks.find((block) => block.type === "paragraph");
  if (paragraph && paragraph.type === "paragraph") return paragraph.content;
  if (blocks[0]?.type === "point") return `${blocks[0].label}: ${blocks[0].content}`;
  return cleanSummaryText(text);
}
