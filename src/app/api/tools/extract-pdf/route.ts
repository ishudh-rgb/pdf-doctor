import { NextRequest } from "next/server";
import { createToolRoute } from "@/lib/api/tool-route";
import { deletePdfPages } from "@/lib/services/pdf-delete.service";

export const maxDuration = 60;

export const POST = async (request: NextRequest) => {
  const handler = createToolRoute({
    toolSlug: "extract-pdf",
    allowedTypes: ["pdf"],
    contentType: "application/pdf",
    outputExtension: "pdf",
    convert: async (buffer, _file, formData) => {
      const pagesRaw = formData.get("pagesToExtract") as string | null;
      const pagesToExtract: number[] = pagesRaw ? JSON.parse(pagesRaw) : [];
      return deletePdfPages(buffer, pagesToExtract);
    },
    outputName: (name) => name.replace(/\.pdf$/i, "-pages"),
  });

  return handler(request);
};
