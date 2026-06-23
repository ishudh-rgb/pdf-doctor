export function isClientPdfToolsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return process.env.NEXT_PUBLIC_CLIENT_PDF_TOOLS !== "false";
}
