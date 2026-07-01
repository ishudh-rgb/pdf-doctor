export {
  isLibreOfficePdfToDocxAvailable,
  libreOfficePdfToDocx as pdfToWordLibreOffice,
} from "@/lib/services/libreoffice-core.service";

export type PdfToWordLibreOfficeOptions = {
  inputPath?: string;
  outputPath?: string;
  timeoutMs?: number;
};
