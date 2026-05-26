import JSZip from "jszip";

const EMU_PER_INCH = 914400;

export interface ParsedTextBlock {
  text: string;
  bold: boolean;
  fontSize: number;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ParsedImage {
  dataUrl: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ParsedSlide {
  index: number;
  title: string;
  subtitle?: string;
  textBlocks: ParsedTextBlock[];
  tables: string[][][];
  images: ParsedImage[];
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#xA;/g, "\n")
    .trim();
}

function emuToInches(value: string | undefined, fallback = 0): number {
  if (!value) return fallback;
  return Number(value) / EMU_PER_INCH;
}

function parseTransform(block: string): { x: number; y: number; w: number; h: number } {
  const off = block.match(/<a:off x="(\d+)" y="(\d+)"/);
  const ext = block.match(/<a:ext cx="(\d+)" cy="(\d+)"/);

  return {
    x: emuToInches(off?.[1]),
    y: emuToInches(off?.[2]),
    w: emuToInches(ext?.[1], 9),
    h: emuToInches(ext?.[2], 0.8),
  };
}

function parseColor(rPr: string): string {
  const solid = rPr.match(/<a:solidFill>\s*<a:srgbClr val="([0-9A-Fa-f]{6})"/);
  if (solid) return `#${solid[1]}`;

  const theme = rPr.match(/<a:schemeClr val="([^"]+)"/);
  if (theme) {
    const map: Record<string, string> = {
      tx1: "#111827",
      tx2: "#64748B",
      accent1: "#1E3A8A",
      accent2: "#D24726",
      bg1: "#FFFFFF",
      bg2: "#E2E8F0",
    };
    return map[theme[1]] ?? "#111827";
  }

  return "#111827";
}

function extractTextBlocks(txBodyXml: string, position: { x: number; y: number; w: number; h: number }): ParsedTextBlock[] {
  const blocks: ParsedTextBlock[] = [];

  for (const paragraph of txBodyXml.matchAll(/<a:p[\s\S]*?<\/a:p>/g)) {
    let text = "";
    let bold = false;
    let fontSize = 12;
    let color = "#111827";

    for (const run of paragraph[0].matchAll(/<a:r[\s\S]*?<\/a:r>/g)) {
      const rPrMatch = run[0].match(/<a:rPr([^>]*)(?:\/>|>[\s\S]*?<\/a:rPr>)/);
      const rPr = rPrMatch?.[1] ?? run[0];
      if (/b="1"/.test(rPr)) bold = true;
      const sizeMatch = rPr.match(/sz="(\d+)"/);
      if (sizeMatch) fontSize = Number(sizeMatch[1]) / 100;
      color = parseColor(run[0]);

      const textMatch = run[0].match(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/);
      if (textMatch) text += decodeXml(textMatch[1]);
    }

    const normalized = text.replace(/\s+/g, " ").trim();
    if (!normalized) continue;

    blocks.push({
      text: normalized,
      bold,
      fontSize,
      color,
      ...position,
    });
  }

  return blocks;
}

function extractTables(xml: string): string[][][] {
  const tables: string[][][] = [];

  for (const tableMatch of xml.matchAll(/<a:tbl>([\s\S]*?)<\/a:tbl>/g)) {
    const rows: string[][] = [];

    for (const rowMatch of tableMatch[1].matchAll(/<a:tr[\s\S]*?<\/a:tr>/g)) {
      const cells: string[] = [];

      for (const cellMatch of rowMatch[0].matchAll(/<a:tc[\s\S]*?<\/a:tc>/g)) {
        const txBody = cellMatch[0].match(/<a:txBody>([\s\S]*?)<\/a:txBody>/);
        if (!txBody) {
          cells.push("");
          continue;
        }

        const cellText = [...txBody[1].matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)]
          .map((match) => decodeXml(match[1]))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        cells.push(cellText);
      }

      if (cells.some(Boolean)) rows.push(cells);
    }

    if (rows.length > 0) tables.push(rows);
  }

  return tables;
}

function slideNumber(path: string): number {
  const match = path.match(/slide(\d+)\.xml$/i);
  return match ? Number(match[1]) : 0;
}

async function loadRelationships(zip: JSZip, slidePath: string): Promise<Map<string, string>> {
  const relsPath = slidePath.replace("ppt/slides/", "ppt/slides/_rels/").replace(".xml", ".xml.rels");
  const relsXml = await zip.file(relsPath)?.async("text");
  const map = new Map<string, string>();
  if (!relsXml) return map;

  for (const match of relsXml.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
    let target = match[2];
    if (target.startsWith("../")) {
      target = `ppt/${target.slice(3)}`;
    } else if (!target.startsWith("ppt/")) {
      target = `ppt/slides/${target}`;
    }
    map.set(match[1], target.replace(/\\/g, "/"));
  }

  return map;
}

async function imageToDataUrl(zip: JSZip, path: string): Promise<string | null> {
  const normalized = path.replace(/\\/g, "/");
  const file = zip.file(normalized) ?? zip.file(normalized.replace(/^\//, ""));
  if (!file) return null;

  const buffer = await file.async("nodebuffer");
  const ext = normalized.split(".").pop()?.toLowerCase();
  const mime =
    ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : ext === "gif"
        ? "image/gif"
        : ext === "webp"
          ? "image/webp"
          : "image/png";

  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function pickTitleAndSubtitle(blocks: ParsedTextBlock[]): { title: string; subtitle?: string } {
  if (blocks.length === 0) {
    return { title: "Slide" };
  }

  const sorted = [...blocks].sort((a, b) => a.y - b.y || b.fontSize - a.fontSize);
  const titleCandidate =
    sorted.find((block) => block.bold && block.fontSize >= 14) ??
    sorted.find((block) => block.fontSize >= 14) ??
    sorted[0];

  const subtitleCandidate = sorted.find(
    (block) =>
      block !== titleCandidate &&
      block.y <= titleCandidate.y + 0.8 &&
      block.text !== titleCandidate.text
  );

  return {
    title: titleCandidate.text,
    subtitle: subtitleCandidate?.text,
  };
}

async function parseSlideXml(
  zip: JSZip,
  slidePath: string,
  index: number,
  relationships: Map<string, string>
): Promise<ParsedSlide> {
  const xml = await zip.file(slidePath)!.async("text");
  const textBlocks: ParsedTextBlock[] = [];
  const images: ParsedImage[] = [];

  for (const shapeMatch of xml.matchAll(/<p:sp\b[\s\S]*?<\/p:sp>/g)) {
    const txBody = shapeMatch[0].match(/<p:txBody>([\s\S]*?)<\/p:txBody>/);
    if (!txBody) continue;

    const spPr = shapeMatch[0].match(/<p:spPr>([\s\S]*?)<\/p:spPr>/);
    const position = parseTransform(spPr?.[1] ?? shapeMatch[0]);
    textBlocks.push(...extractTextBlocks(txBody[1], position));
  }

  for (const picMatch of xml.matchAll(/<p:pic\b[\s\S]*?<\/p:pic>/g)) {
    const embed = picMatch[0].match(/r:embed="([^"]+)"/);
    if (!embed) continue;

    const mediaPath = relationships.get(embed[1]);
    if (!mediaPath) continue;

    const dataUrl = await imageToDataUrl(zip, mediaPath);
    if (!dataUrl) continue;

    const spPr = picMatch[0].match(/<p:spPr>([\s\S]*?)<\/p:spPr>/);
    const position = parseTransform(spPr?.[1] ?? picMatch[0]);
    images.push({ dataUrl, ...position });
  }

  const tables = extractTables(xml);
  const { title, subtitle } = pickTitleAndSubtitle(textBlocks);

  return {
    index,
    title: title || `Slide ${index + 1}`,
    subtitle,
    textBlocks,
    tables,
    images,
  };
}

export async function parsePptx(fileBuffer: Buffer): Promise<ParsedSlide[]> {
  const zip = await JSZip.loadAsync(fileBuffer);
  const slidePaths = Object.keys(zip.files)
    .filter((name) => /ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => slideNumber(a) - slideNumber(b));

  if (slidePaths.length === 0) {
    throw new Error("No slides found in the PowerPoint file.");
  }

  const slides: ParsedSlide[] = [];

  for (let i = 0; i < slidePaths.length; i += 1) {
    const relationships = await loadRelationships(zip, slidePaths[i]);
    slides.push(await parseSlideXml(zip, slidePaths[i], i, relationships));
  }

  return slides;
}

export function isLikelyNumericCell(value: string): boolean {
  return /^-?\d[\d,]*(?:\.\d+)?$/.test(value.trim());
}

export function isLikelyHeaderRow(row: string[]): boolean {
  const joined = row.join(" ").toLowerCase();
  return /sl\.?\s*no/.test(joined) && /\bdate\b/.test(joined);
}
