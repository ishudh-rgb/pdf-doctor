import { pdfToExcel } from "@/lib/services/pdf-to-excel.service";
import { createToolRoute } from "@/lib/api/tool-route";

export const maxDuration = 600;

export const POST = createToolRoute({
  toolSlug: "pdf-to-excel",
  allowedTypes: ["pdf"],
  contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  outputExtension: "xlsx",
  heavy: true,
  convert: (buffer) => pdfToExcel(buffer),
});
