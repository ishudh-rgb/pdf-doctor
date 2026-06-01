import { getTotalPages } from "@/lib/pdf/pdf-thumbnails.server";

export async function getPdfPageCountFromBuffer(buffer: Buffer): Promise<number> {
  const count = await getTotalPages(buffer);
  if (count > 0) return count;
  throw new Error("Unable to read PDF");
}
