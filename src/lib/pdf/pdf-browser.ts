import { PDFDocument, PageSizes, degrees, type PDFPage } from "pdf-lib";
import type { BrowserComposeSlot, PageRange } from "@/lib/pdf/pdf-browser.types";

async function loadPdfDocument(data: ArrayBuffer) {
  try {
    return await PDFDocument.load(data);
  } catch {
    return await PDFDocument.load(data, { ignoreEncryption: true });
  }
}

async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

export async function mergePdfFilesInBrowser(files: File[]): Promise<Blob> {
  if (files.length === 0) throw new Error("At least one PDF is required.");
  if (files.length === 1) return files[0];

  const merged = await PDFDocument.create();
  for (const file of files) {
    const pdf = await loadPdfDocument(await fileToArrayBuffer(file));
    const pages = await merged.copyPages(pdf, pdf.getPageIndices());
    for (const page of pages) merged.addPage(page);
  }
  const bytes = await merged.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

export async function composePdfFromSlotsInBrowser(
  mainFile: File,
  slots: BrowserComposeSlot[],
  importedBySession: Map<string, ArrayBuffer>
): Promise<Blob> {
  if (slots.length === 0) throw new Error("No pages to export.");

  const mainPdf = await loadPdfDocument(await fileToArrayBuffer(mainFile));
  const output = await PDFDocument.create();
  const cache = new Map<string, PDFDocument>();

  for (const slot of slots) {
    if (slot.kind === "blank") {
      const size: [number, number] =
        output.getPageCount() > 0
          ? (() => {
              const last = output.getPage(output.getPageCount() - 1);
              const { width, height } = last.getSize();
              return [width, height] as [number, number];
            })()
          : PageSizes.A4;
      output.addPage(size);
      continue;
    }

    if (slot.kind === "original") {
      if (slot.page < 1 || slot.page > mainPdf.getPageCount()) {
        throw new Error(`Page ${slot.page} does not exist in the document.`);
      }
      const [page] = await output.copyPages(mainPdf, [slot.page - 1]);
      output.addPage(page);
      continue;
    }

    let imported = cache.get(slot.sessionId);
    if (!imported) {
      const buf = importedBySession.get(slot.sessionId);
      if (!buf) throw new Error("An imported PDF is missing. Please re-upload and try again.");
      imported = await loadPdfDocument(buf);
      cache.set(slot.sessionId, imported);
    }
    if (slot.page < 1 || slot.page > imported.getPageCount()) {
      throw new Error(`Page ${slot.page} does not exist in an imported document.`);
    }
    const [page] = await output.copyPages(imported, [slot.page - 1]);
    output.addPage(page);
  }

  const bytes = await output.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

export async function extractPagesInBrowser(
  file: File,
  pageNumbers: number[]
): Promise<Blob> {
  const source = await loadPdfDocument(await fileToArrayBuffer(file));
  for (const num of pageNumbers) {
    if (num < 1 || num > source.getPageCount()) {
      throw new Error(`Page ${num} does not exist.`);
    }
  }
  const output = await PDFDocument.create();
  const pages = await output.copyPages(
    source,
    pageNumbers.map((n) => n - 1)
  );
  for (const page of pages) output.addPage(page);
  const bytes = await output.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

export async function deletePagesInBrowser(
  file: File,
  pagesToKeep: number[]
): Promise<Blob> {
  if (pagesToKeep.length === 0) throw new Error("At least one page must remain.");
  return extractPagesInBrowser(file, pagesToKeep);
}

function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export async function rotatePdfInBrowser(
  file: File,
  pageRotations: Record<number, number>
): Promise<Blob> {
  const pdf = await loadPdfDocument(await fileToArrayBuffer(file));
  const pages = pdf.getPages();

  for (const [pageNumStr, rotation] of Object.entries(pageRotations)) {
    const pageNum = Number(pageNumStr);
    if (pageNum < 1 || pageNum > pages.length) {
      throw new Error(`Page ${pageNum} does not exist.`);
    }
    const page: PDFPage = pages[pageNum - 1];
    const current = normalizeAngle(page.getRotation().angle);
    const delta = normalizeAngle(rotation);
    page.setRotation(degrees(normalizeAngle(current + delta)));
  }

  const bytes = await pdf.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

export async function splitPdfRangesInBrowser(
  file: File,
  ranges: PageRange[]
): Promise<Blob[]> {
  const source = await loadPdfDocument(await fileToArrayBuffer(file));
  const total = source.getPageCount();
  const results: Blob[] = [];

  for (const range of ranges) {
    if (range.start < 1 || range.end > total || range.start > range.end) {
      throw new Error(`Invalid page range ${range.start}-${range.end}.`);
    }
    const output = await PDFDocument.create();
    const indices = Array.from(
      { length: range.end - range.start + 1 },
      (_, i) => range.start - 1 + i
    );
    const pages = await output.copyPages(source, indices);
    for (const page of pages) output.addPage(page);
    const bytes = await output.save();
    results.push(new Blob([bytes as BlobPart], { type: "application/pdf" }));
  }
  return results;
}

export async function splitAllPagesInBrowser(file: File): Promise<Blob[]> {
  const source = await loadPdfDocument(await fileToArrayBuffer(file));
  const results: Blob[] = [];
  for (let i = 0; i < source.getPageCount(); i++) {
    const output = await PDFDocument.create();
    const [page] = await output.copyPages(source, [i]);
    output.addPage(page);
    const bytes = await output.save();
    results.push(new Blob([bytes as BlobPart], { type: "application/pdf" }));
  }
  return results;
}

const PAGE_SIZE_MAP: Record<string, [number, number]> = {
  a4: PageSizes.A4,
  letter: PageSizes.Letter,
};

export async function imagesToPdfInBrowser(
  files: File[],
  options: {
    pageSize?: "a4" | "letter" | "auto";
    orientation?: "portrait" | "landscape";
    margin?: "none" | "small" | "medium";
  } = {}
): Promise<Blob> {
  if (files.length === 0) throw new Error("At least one image is required.");

  const pdf = await PDFDocument.create();
  const margin =
    options.margin === "none" ? 0 : options.margin === "medium" ? 40 : 20;

  for (const file of files) {
    const bytes = new Uint8Array(await fileToArrayBuffer(file));
    const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
    const image = isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);

    let pageW = PAGE_SIZE_MAP[options.pageSize ?? "a4"]?.[0] ?? PageSizes.A4[0];
    let pageH = PAGE_SIZE_MAP[options.pageSize ?? "a4"]?.[1] ?? PageSizes.A4[1];

    if (options.pageSize === "auto") {
      pageW = image.width;
      pageH = image.height;
    }
    if (options.orientation === "landscape" && pageW < pageH) {
      [pageW, pageH] = [pageH, pageW];
    }

    const page = pdf.addPage([pageW, pageH]);
    const availW = pageW - margin * 2;
    const availH = pageH - margin * 2;
    const scale = Math.min(availW / image.width, availH / image.height, 1);
    const drawW = image.width * scale;
    const drawH = image.height * scale;
    page.drawImage(image, {
      x: margin + (availW - drawW) / 2,
      y: margin + (availH - drawH) / 2,
      width: drawW,
      height: drawH,
    });
  }

  const out = await pdf.save();
  return new Blob([out as BlobPart], { type: "application/pdf" });
}

export async function buildSessionBufferMap(
  entries: Array<{ sessionId: string; file: File }>
): Promise<Map<string, ArrayBuffer>> {
  const map = new Map<string, ArrayBuffer>();
  for (const { sessionId, file } of entries) {
    if (!sessionId || map.has(sessionId)) continue;
    map.set(sessionId, await fileToArrayBuffer(file));
  }
  return map;
}
