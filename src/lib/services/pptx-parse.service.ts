import JSZip from "jszip";
import { convertEmfToPngDataUrl } from "@/lib/services/emf-to-png.service";
import { parseLegacyPptRich } from "@/lib/services/legacy-ppt-parse.service";
import { tryConvertLegacyPptToPptx } from "@/lib/services/powerpoint-pptx-convert.service";

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

export interface ParsedTableCell {
  text: string;
  background?: string;
  color?: string;
  bold?: boolean;
}

export interface ParsedStyledTable {
  rows: ParsedTableCell[][];
}

export interface ParsedSlide {
  index: number;
  title: string;
  subtitle?: string;
  textBlocks: ParsedTextBlock[];
  tables: string[][][];
  styledTables: ParsedStyledTable[];
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

function parseCellFill(cellXml: string): string | undefined {
  const tcPr = cellXml.match(/<a:tcPr[\s\S]*?<\/a:tcPr>/)?.[0];
  if (!tcPr) return undefined;

  const withoutBorders = tcPr
    .replace(/<a:ln[A-Z][\s\S]*?<\/a:ln[A-Z]>/g, "")
    .replace(/<a:ln[A-Z][^/]*\/>/g, "");

  const rgb = withoutBorders.match(/<a:solidFill>\s*<a:srgbClr val="([0-9A-Fa-f]{6})"/);
  if (rgb) return `#${rgb[1]}`;

  const theme = withoutBorders.match(/<a:solidFill>\s*<a:schemeClr val="([^"]+)"/);
  if (theme) {
    const map: Record<string, string> = {
      bg1: "#FFFFFF",
      bg2: "#E6E6E6",
      tx1: "#000000",
      accent1: "#4472C4",
    };
    return map[theme[1]];
  }

  return undefined;
}

function normalizeTableRows(rows: ParsedTableCell[][]): ParsedTableCell[][] {
  if (rows.length <= 5) return rows;

  const trailing = rows.slice(5);
  if (trailing.every((row) => row.every((cell) => !cell.text.trim()))) {
    return rows.slice(0, 5);
  }

  return rows;
}

function parseCellText(cellXml: string): { text: string; bold: boolean; color?: string } {
  const txBody = cellXml.match(/<a:txBody>([\s\S]*?)<\/a:txBody>/);
  if (!txBody) return { text: "", bold: false };

  let text = "";
  let bold = false;
  let color: string | undefined;

  for (const run of txBody[1].matchAll(/<a:r[\s\S]*?<\/a:r>/g)) {
    const rPr = run[0];
    if (/b="1"/.test(rPr)) bold = true;
    color = parseColor(rPr);
    const textMatch = rPr.match(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/);
    if (textMatch) text += decodeXml(textMatch[1]);
  }

  return {
    text: text.replace(/\s+/g, " ").trim(),
    bold,
    color,
  };
}

function extractStyledTables(xml: string): ParsedStyledTable[] {
  const tables: ParsedStyledTable[] = [];

  for (const tableMatch of xml.matchAll(/<a:tbl>([\s\S]*?)<\/a:tbl>/g)) {
    const rows: ParsedTableCell[][] = [];

    for (const rowMatch of tableMatch[1].matchAll(/<a:tr[\s\S]*?<\/a:tr>/g)) {
      const cells: ParsedTableCell[] = [];

      for (const cellMatch of rowMatch[0].matchAll(/<a:tc[\s\S]*?<\/a:tc>/g)) {
        const cellXml = cellMatch[0];
        const { text, bold, color } = parseCellText(cellXml);
        cells.push({
          text,
          bold,
          color,
          background: parseCellFill(cellXml),
        });
      }

      if (cells.some((cell) => cell.text)) rows.push(cells);
      else if (cells.length > 0) rows.push(cells);
    }

    if (rows.length > 0) tables.push({ rows: normalizeTableRows(rows) });
  }

  return tables;
}

function extractTables(xml: string): string[][][] {
  return extractStyledTables(xml).map((table) =>
    table.rows.map((row) => row.map((cell) => cell.text))
  );
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

async function imageToDataUrl(zip: JSZip, mediaPath: string): Promise<string | null> {
  const normalized = mediaPath.replace(/\\/g, "/");
  const file = zip.file(normalized) ?? zip.file(normalized.replace(/^\//, ""));
  if (!file) return null;

  const buffer = await file.async("nodebuffer");
  const ext = normalized.split(".").pop()?.toLowerCase();

  if (ext === "emf" || ext === "wmf") {
    return await convertEmfToPngDataUrl(buffer);
  }

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

  const sorted = [...blocks].sort((a, b) => a.y - b.y || a.fontSize - b.fontSize);
  const titleCandidate =
    sorted.find((block) => block.y < 1.2 && block.text.length <= 120) ??
    sorted.find((block) => block.bold && block.fontSize >= 14 && block.text.length <= 120) ??
    sorted.find((block) => block.fontSize >= 14 && block.text.length <= 120) ??
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

    const isTitle = /<p:ph type="title"/.test(shapeMatch[0]);
    const spPr = shapeMatch[0].match(/<p:spPr>([\s\S]*?)<\/p:spPr>/);
    const position = parseTransform(spPr?.[1] ?? shapeMatch[0]);
    const blocks = extractTextBlocks(txBody[1], position);
    if (isTitle) {
      for (const block of blocks) {
        block.bold = true;
        if (block.fontSize < 24) block.fontSize = 36;
      }
    }
    textBlocks.push(...blocks);
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

  const styledTables = extractStyledTables(xml);
  const tables = styledTables.map((table) =>
    table.rows.map((row) => row.map((cell) => cell.text))
  );
  const { title, subtitle } = pickTitleAndSubtitle(textBlocks);

  return {
    index,
    title: title || `Slide ${index + 1}`,
    subtitle,
    textBlocks,
    tables,
    styledTables,
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

export function isLegacyPptBuffer(fileBuffer: Buffer): boolean {
  return (
    fileBuffer.length >= 4 &&
    fileBuffer[0] === 0xd0 &&
    fileBuffer[1] === 0xcf &&
    fileBuffer[2] === 0x11 &&
    fileBuffer[3] === 0xe0
  );
}

export function isPptxBuffer(fileBuffer: Buffer): boolean {
  return fileBuffer.length >= 2 && fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4b;
}

export function parseLegacyPpt(fileBuffer: Buffer): ParsedSlide[] {
  return parseLegacyPptRich(fileBuffer);
}

export async function parsePresentation(fileBuffer: Buffer): Promise<ParsedSlide[]> {
  if (isLegacyPptBuffer(fileBuffer)) {
    const pptxBuffer = await tryConvertLegacyPptToPptx(fileBuffer);
    if (pptxBuffer) {
      try {
        return await parsePptx(pptxBuffer);
      } catch {
        // Fall back to legacy text/image extraction below.
      }
    }
    return parseLegacyPpt(fileBuffer);
  }

  if (!isPptxBuffer(fileBuffer)) {
    throw new Error(
      "Unsupported PowerPoint format. Please upload a valid .ppt or .pptx file."
    );
  }

  try {
    return await parsePptx(fileBuffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      isLegacyPptBuffer(fileBuffer) ||
      message.toLowerCase().includes("central directory") ||
      message.toLowerCase().includes("zip")
    ) {
      return parseLegacyPpt(fileBuffer);
    }
    throw err;
  }
}

export function isLikelyNumericCell(value: string): boolean {
  return /^-?\d[\d,]*(?:\.\d+)?$/.test(value.trim());
}

export function isLikelyHeaderRow(row: string[]): boolean {
  const joined = row.join(" ").toLowerCase();
  return /sl\.?\s*no/.test(joined) && /\bdate\b/.test(joined);
}
