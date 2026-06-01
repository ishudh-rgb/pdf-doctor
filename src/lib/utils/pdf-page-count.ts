/** Page count via server API only (no browser pdf.js). */
export async function getPdfPageCount(file: File): Promise<number> {
  const formData = new FormData();
  formData.append("file", file, file.name || "document.pdf");

  try {
    const res = await fetch("/api/tools/pdf-meta", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) return 0;

    const data = (await res.json()) as { totalPages?: number };
    return typeof data.totalPages === "number" && data.totalPages > 0 ? data.totalPages : 0;
  } catch {
    return 0;
  }
}
