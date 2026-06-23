import { pptToPdf } from "@/lib/services/ppt-to-pdf.service";
import { createToolRoute } from "@/lib/api/tool-route";

export const maxDuration = 120;

export const POST = createToolRoute({
  toolSlug: "ppt-to-pdf",
  allowedTypes: ["powerpoint"],
  contentType: "application/pdf",
  outputExtension: "pdf",
  heavy: true,
  convert: (buffer) => pptToPdf(buffer),
});
