import { excelToPdf } from "@/lib/services/excel-to-pdf.service";
import { createToolRoute } from "@/lib/api/tool-route";

export const maxDuration = 60;

export const POST = createToolRoute({
  toolSlug: "excel-to-pdf",
  allowedTypes: ["excel"],
  contentType: "application/pdf",
  outputExtension: "pdf",
  convert: (buffer) => excelToPdf(buffer),
});
