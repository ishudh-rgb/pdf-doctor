import JSZip from "jszip";
import { isClientPdfToolsEnabled } from "@/lib/pdf/client-pdf-config";

export async function packPdfBlobsAsZip(
  files: Array<{ name: string; blob: Blob }>
): Promise<Blob> {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.name, file.blob);
  }
  return zip.generateAsync({ type: "blob" });
}

/**
 * Try browser-side PDF export first; fall back to server without changing server converters.
 */
export async function runClientOrServerPdfExport(options: {
  tool: string;
  client: () => Promise<Blob>;
  server: () => Promise<Blob>;
}): Promise<{ blob: Blob; source: "client" | "server" }> {
  if (!isClientPdfToolsEnabled()) {
    const blob = await options.server();
    return { blob, source: "server" };
  }

  try {
    const blob = await options.client();
    return { blob, source: "client" };
  } catch (err) {
    console.warn(`[${options.tool}] browser export failed, using server fallback`, err);
    const blob = await options.server();
    return { blob, source: "server" };
  }
}
