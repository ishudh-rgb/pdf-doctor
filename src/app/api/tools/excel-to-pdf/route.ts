import { excelToPdf } from "@/lib/services/excel-to-pdf.service";
import { createToolRoute } from "@/lib/api/tool-route";

export const maxDuration = 180;

export const POST = createToolRoute({
  toolSlug: "excel-to-pdf",
  allowedTypes: ["excel"],
  contentType: "application/pdf",
  outputExtension: "pdf",
  heavy: true,
  convert: (buffer) => excelToPdf(buffer),
});
