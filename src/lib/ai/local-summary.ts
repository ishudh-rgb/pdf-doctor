import type { AISummaryResult } from "@/lib/ai/provider";

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 20);
}

function pickKeyPoints(sentences: string[], limit = 5): string[] {
  const scored = sentences.map((sentence) => {
    const lower = sentence.toLowerCase();
    let score = 0;
    if (/\b(must|should|important|required|summary|conclusion|result|goal|action)\b/.test(lower)) {
      score += 2;
    }
    if (/\b(\d+|percent|deadline|date|year)\b/.test(lower)) {
      score += 1;
    }
    return { sentence, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.sentence);
}

export function createLocalSummary(text: string): AISummaryResult {
  const normalized = text.replace(/\s+/g, " ").trim();
  const sentences = splitSentences(normalized);
  const shortSummary =
    sentences.slice(0, 2).join(" ") ||
    normalized.slice(0, 280) + (normalized.length > 280 ? "..." : "");
  const detailedSummary =
    sentences.slice(0, 6).join(" ") ||
    normalized.slice(0, 900) + (normalized.length > 900 ? "..." : "");

  return {
    shortSummary,
    detailedSummary,
    keyPoints: pickKeyPoints(sentences),
    actionItems: sentences
      .filter((sentence) => /\b(should|must|need to|action|todo|follow up|submit|complete)\b/i.test(sentence))
      .slice(0, 4),
    importantDates: sentences
      .filter((sentence) => /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|january|february|march|april|may|june|july|august|september|october|november|december|\d{4})\b/i.test(sentence))
      .slice(0, 4),
  };
}
