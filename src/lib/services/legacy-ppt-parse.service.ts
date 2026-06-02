import CFB from "cfb";
import PPT from "ppt-to-text";
import type { ParsedImage, ParsedSlide, ParsedTextBlock } from "@/lib/services/pptx-parse.service";

interface LegacyTextBox {
  t?: string;
}

interface LegacyGroupShapeItem {
  clientTextbox?: LegacyTextBox;
  [key: string]: unknown;
}

interface LegacySlide {
  drawing?: {
    groupShape?: LegacyGroupShapeItem[];
  };
}

function bufferToDataUrl(buffer: Buffer): string {
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
  const mime = isPng ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export function extractLegacyPptImages(fileBuffer: Buffer): Buffer[] {
  const cfb = CFB.read(fileBuffer, { type: "buffer" });
  const entry = CFB.find(cfb, "/Pictures");
  if (!entry?.content) return [];

  const buf = Buffer.from(entry.content);
  const images: Buffer[] = [];

  for (let i = 0; i < buf.length - 8; i++) {
    if (buf[i] === 0x89 && buf[i + 1] === 0x50 && buf[i + 2] === 0x4e && buf[i + 3] === 0x47) {
      const iend = buf.indexOf(Buffer.from("IEND"), i);
      if (iend > 0) {
        images.push(buf.slice(i, iend + 8));
        i = iend + 8;
        continue;
      }
    }

    if (buf[i] === 0xff && buf[i + 1] === 0xd8 && buf[i + 2] === 0xff) {
      const eoi = buf.indexOf(Buffer.from([0xff, 0xd9]), i + 2);
      if (eoi > 0) {
        images.push(buf.slice(i, eoi + 2));
        i = eoi + 2;
      }
    }
  }

  return images;
}

function collectTextBoxValues(value: unknown, out: string[] = []): string[] {
  if (!value) return out;

  if (Array.isArray(value)) {
    for (const item of value) collectTextBoxValues(item, out);
    return out;
  }

  if (typeof value === "object") {
    const obj = value as LegacyGroupShapeItem;
    if (typeof obj.clientTextbox?.t === "string") {
      out.push(obj.clientTextbox.t.replace(/\n$/, "").trim());
    }
    for (const child of Object.values(obj)) {
      if (child !== obj.clientTextbox) collectTextBoxValues(child, out);
    }
  }

  return out;
}

function titleBlock(text: string): ParsedTextBlock {
  return {
    text,
    bold: true,
    fontSize: 36,
    color: "#000000",
    x: 0.55,
    y: 0.45,
    w: 9.5,
    h: 0.7,
  };
}

function bodyBlock(text: string): ParsedTextBlock {
  return {
    text,
    bold: false,
    fontSize: 15,
    color: "#000000",
    x: 0.55,
    y: 1.35,
    w: 9.5,
    h: 5.5,
  };
}

function buildTableFromCells(cells: string[]): string[][] {
  const headers = cells.filter(Boolean).slice(0, 5);
  while (headers.length < 5) headers.push("");

  const rows: string[][] = [headers];
  for (let i = 0; i < 5; i++) {
    rows.push(["", "", "", "", ""]);
  }
  return rows;
}

function parseLegacySlide(
  slide: LegacySlide,
  index: number,
  pngImages: Buffer[],
  jpegImages: Buffer[]
): ParsedSlide {
  const groupShape = slide.drawing?.groupShape ?? [];
  const title = groupShape[1]?.clientTextbox?.t?.trim() || `Slide ${index + 1}`;
  const shapeContent = groupShape[2];

  if (Array.isArray(shapeContent)) {
    const cells = collectTextBoxValues(shapeContent).filter(Boolean);
    const table = buildTableFromCells(cells);

    return {
      index,
      title,
      textBlocks: [titleBlock(title)],
      tables: [table],
      styledTables: [],
      images: [],
    };
  }

  const bodyText = shapeContent?.clientTextbox?.t?.trim();
  if (bodyText) {
    return {
      index,
      title,
      textBlocks: [titleBlock(title), bodyBlock(bodyText)],
      tables: [],
      styledTables: [],
      images: [],
    };
  }

  const imageBuffer = jpegImages.shift() ?? null;

  if (imageBuffer) {
    const dataUrl = bufferToDataUrl(imageBuffer);
    return {
      index,
      title,
      textBlocks: [titleBlock(title)],
      tables: [],
      styledTables: [],
      images: [
        {
          dataUrl,
          x: 0.55,
          y: 1.2,
          w: 9.5,
          h: 5.8,
        },
      ],
    };
  }

  return {
    index,
    title,
    textBlocks: [titleBlock(title)],
    tables: [],
    styledTables: [],
    images: [],
  };
}

export function parseLegacyPptRich(fileBuffer: Buffer): ParsedSlide[] {
  const presentation = PPT.readBuffer(fileBuffer);
  const legacySlides = (presentation.slides ?? []) as LegacySlide[];

  if (legacySlides.length === 0) {
    throw new Error("No slides found in the legacy .ppt file.");
  }

  const extracted = extractLegacyPptImages(fileBuffer);
  const pngImages = extracted.filter((buf) => buf[0] === 0x89);
  const jpegImages = extracted.filter((buf) => buf[0] === 0xff);
  const pngQueue = [...pngImages];
  const jpegQueue = [...jpegImages];

  return legacySlides.map((slide, index) =>
    parseLegacySlide(slide, index, pngQueue, jpegQueue)
  );
}
