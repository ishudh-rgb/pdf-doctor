import { pdfToPpt } from "@/lib/services/pdf-to-ppt.service";
import { createToolRoute } from "@/lib/api/tool-route";

export const maxDuration = 60;

export const POST = createToolRoute({
  toolSlug: "pdf-to-ppt",
  allowedTypes: ["pdf"],
  contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  outputExtension: "pptx",
  convert: (buffer) => pdfToPpt(buffer),
});
