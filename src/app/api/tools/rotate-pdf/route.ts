import { NextRequest } from "next/server";
import { createToolRoute } from "@/lib/api/tool-route";
import { rotatePdfPages } from "@/lib/services/pdf-rotate.service";

export const maxDuration = 60;

export const POST = async (request: NextRequest) => {
  const handler = createToolRoute({
    toolSlug: "rotate-pdf",
    allowedTypes: ["pdf"],
    contentType: "application/pdf",
    outputExtension: "pdf",
    convert: async (buffer, _file, formData) => {
      const rotationsRaw = formData.get("rotations") as string | null;
      const rotations: Record<number, number> = rotationsRaw
        ? JSON.parse(rotationsRaw)
        : {};
      return rotatePdfPages(buffer, rotations);
    },
    outputName: (name) => name.replace(/\.pdf$/i, "-rotated"),
  });

  return handler(request);
};
