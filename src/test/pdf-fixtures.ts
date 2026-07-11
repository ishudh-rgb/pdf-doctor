import { PDFDocument, StandardFonts } from "pdf-lib";

/** Build a minimal valid PDF buffer for integration tests (no conversion pipeline changes). */
export async function createTestPdf(options: {
  pages?: number;
  labels?: string[];
} = {}): Promise<Buffer> {
  const pageCount = options.pages ?? 1;
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < pageCount; i++) {
    const page = pdf.addPage();
    const label = options.labels?.[i] ?? `Test page ${i + 1}`;
    page.drawText(label, { x: 72, y: 700, size: 14, font });
  }

  return Buffer.from(await pdf.save());
}

export async function createTestPdfFile(
  name: string,
  options?: Parameters<typeof createTestPdf>[0]
): Promise<File> {
  const buffer = await createTestPdf(options);
  return new File([new Uint8Array(buffer)], name, { type: "application/pdf" });
}

export async function getPdfPageCount(buffer: Buffer): Promise<number> {
  const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  return pdf.getPageCount();
}
