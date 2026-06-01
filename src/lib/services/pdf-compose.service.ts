import { PDFDocument, PageSizes } from "pdf-lib";
import { getPdfSessionBuffer } from "@/lib/pdf/pdf-session-store";

export type ComposeSlot =
  | { kind: "original"; page: number }
  | { kind: "blank" }
  | { kind: "imported"; sessionId: string; page: number };

async function loadPdfBuffer(buffer: Buffer) {
  return PDFDocument.load(buffer, { ignoreEncryption: true });
}

export async function composePdfFromSlots(
  mainBuffer: Buffer,
  slots: ComposeSlot[]
): Promise<Buffer> {
  if (slots.length === 0) {
    throw new Error("No pages to export.");
  }

  const mainPdf = await loadPdfBuffer(mainBuffer);
  const output = await PDFDocument.create();
  const sessionCache = new Map<string, Awaited<ReturnType<typeof loadPdfBuffer>>>();

  for (const slot of slots) {
    if (slot.kind === "blank") {
      const size: [number, number] =
        output.getPageCount() > 0
          ? (() => {
              const { width, height } = output.getPage(output.getPageCount() - 1).getSize();
              return [width, height] as [number, number];
            })()
          : PageSizes.A4;
      output.addPage(size);
      continue;
    }

    if (slot.kind === "original") {
      if (slot.page < 1 || slot.page > mainPdf.getPageCount()) continue;
      const [page] = await output.copyPages(mainPdf, [slot.page - 1]);
      output.addPage(page);
      continue;
    }

    let importedPdf = sessionCache.get(slot.sessionId);
    if (!importedPdf) {
      const buf = await getPdfSessionBuffer(slot.sessionId);
      if (!buf) continue;
      importedPdf = await loadPdfBuffer(buf);
      sessionCache.set(slot.sessionId, importedPdf);
    }

    if (slot.page < 1 || slot.page > importedPdf.getPageCount()) continue;
    const [page] = await output.copyPages(importedPdf, [slot.page - 1]);
    output.addPage(page);
  }

  if (output.getPageCount() === 0) {
    throw new Error("Could not build PDF from selected pages.");
  }

  return Buffer.from(await output.save());
}
