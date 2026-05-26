import { NextRequest, NextResponse } from "next/server";
import { addWatermarkToPDF, type WatermarkOptions } from "@/lib/services/pdf-watermark.service";
import { createToolRoute } from "@/lib/api/tool-route";

export const maxDuration = 60;

export const POST = async (request: NextRequest) => {
  const handler = createToolRoute({
    toolSlug: "add-watermark",
    allowedTypes: ["pdf"],
    contentType: "application/pdf",
    outputExtension: "pdf",
    convert: async (buffer, _file, formData) => {
      const optionsRaw = formData.get("options") as string | null;
      const watermarkImage = formData.get("watermarkImage") as File | null;

      if (!optionsRaw) {
        throw new Error("Watermark options are required.");
      }

      const options = JSON.parse(optionsRaw) as WatermarkOptions;

      const imageBuffer =
        options.type === "image" && watermarkImage
          ? Buffer.from(await watermarkImage.arrayBuffer())
          : undefined;

      return addWatermarkToPDF(buffer, options, imageBuffer);
    },
    outputName: (name) => name.replace(/\.pdf$/i, "-watermarked"),
  });

  return handler(request);
};
