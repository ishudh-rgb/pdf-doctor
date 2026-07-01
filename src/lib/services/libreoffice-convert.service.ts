import {
  isLibreOfficeAvailable,
  libreOfficeToPdf,
} from "@/lib/services/libreoffice-core.service";

export { isLibreOfficeAvailable, resolveLibreOfficeBinary } from "@/lib/services/libreoffice-core.service";

/**
 * Convert Word/Excel/PowerPoint/ODF documents to PDF via LibreOffice headless.
 * Used by word-to-pdf, excel-to-pdf, and ppt-to-pdf pipelines.
 */
export async function tryConvertWithLibreOffice(
  fileBuffer: Buffer,
  fileName?: string
): Promise<Buffer | null> {
  if (!isLibreOfficeAvailable()) {
    console.info("[libreoffice] Binary not found — skip Office→PDF");
    return null;
  }

  const pdf = await libreOfficeToPdf(fileBuffer, fileName);
  if (pdf?.length) {
    console.info(`[libreoffice] Office→PDF OK (${pdf.length} bytes)`);
    return pdf;
  }

  return null;
}
