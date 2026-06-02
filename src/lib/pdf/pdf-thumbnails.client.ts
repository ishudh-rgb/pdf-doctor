"use client";

const MAX_THUMBNAIL_PAGES = 60;

function appendPdfToForm(formData: FormData, file: File) {
  formData.append("file", file, file.name || "document.pdf");
}

async function createPdfSession(
  file: File
): Promise<{ sessionId: string; totalPages: number; truncated: boolean; error?: string }> {
  const formData = new FormData();
  appendPdfToForm(formData, file);

  try {
    const res = await fetch("/api/tools/pdf-session", {
      method: "POST",
      body: formData,
    });
    const data = (await res.json()) as {
      sessionId?: string;
      totalPages?: number;
      truncated?: boolean;
      error?: string;
    };

    if (!res.ok) {
      return {
        sessionId: "",
        totalPages: 0,
        truncated: false,
        error: data.error ?? `Server error (${res.status})`,
      };
    }

    if (!data.sessionId || !data.totalPages) {
      return {
        sessionId: "",
        totalPages: 0,
        truncated: false,
        error: data.error ?? "Could not read this PDF.",
      };
    }

    return {
      sessionId: data.sessionId,
      totalPages: data.totalPages,
      truncated: Boolean(data.truncated),
    };
  } catch (err) {
    return {
      sessionId: "",
      totalPages: 0,
      truncated: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

function thumbUrl(sessionId: string, pageNum: number, width?: number): string {
  const base = `/api/tools/pdf-thumb?session=${encodeURIComponent(sessionId)}&page=${pageNum}`;
  if (width && width !== 140) {
    return `${base}&width=${width}`;
  }
  return base;
}

export async function loadPdfThumbnailsBatched(
  file: File,
  onBatch: (thumbnails: string[], totalPages: number, truncated: boolean) => void
): Promise<{ totalPages: number; error?: string }> {
  if (!file || file.size === 0) {
    return { totalPages: 0, error: "File is empty." };
  }

  const session = await createPdfSession(file);
  if (!session.sessionId || session.totalPages === 0) {
    return {
      totalPages: 0,
      error: session.error ?? "Could not read this PDF. Try another file.",
    };
  }

  const totalPages = session.totalPages;
  const pagesToLoad = Math.min(totalPages, MAX_THUMBNAIL_PAGES);
  const truncated = session.truncated || totalPages > MAX_THUMBNAIL_PAGES;

  const thumbnails = Array.from({ length: pagesToLoad }, (_, i) =>
    thumbUrl(session.sessionId, i + 1)
  );

  onBatch(thumbnails, totalPages, truncated);

  return { totalPages };
}

/** First-page preview + page count for document cards (merge, file list). */
export async function loadPdfDocumentPreview(file: File): Promise<{
  sessionId: string;
  totalPages: number;
  thumbUrl: string;
  truncated: boolean;
  error?: string;
}> {
  const session = await createPdfSession(file);
  if (!session.sessionId || session.totalPages === 0) {
    return {
      sessionId: "",
      totalPages: 0,
      thumbUrl: "",
      truncated: false,
      error: session.error ?? "Could not read this PDF.",
    };
  }
  return {
    sessionId: session.sessionId,
    totalPages: session.totalPages,
    thumbUrl: thumbUrl(session.sessionId, 1),
    truncated: session.truncated,
  };
}

export function pageThumbFromSession(sessionId: string, pageNum: number, width?: number): string {
  return thumbUrl(sessionId, pageNum, width);
}

export function buildRangesEveryN(totalPages: number, every: number): { start: number; end: number }[] {
  const step = Math.max(1, every);
  const ranges: { start: number; end: number }[] = [];
  for (let start = 1; start <= totalPages; start += step) {
    ranges.push({ start, end: Math.min(start + step - 1, totalPages) });
  }
  return ranges;
}

export function rangesToFormString(ranges: { start: number; end: number }[]): string {
  return ranges.map((r) => `${r.start}-${r.end}`).join(",");
}

export function rangesFromSplitAfter(
  totalPages: number,
  splitAfter: Set<number>
): { start: number; end: number }[] {
  if (totalPages <= 0) return [];
  const cuts = Array.from(splitAfter)
    .filter((p) => p >= 1 && p < totalPages)
    .sort((a, b) => a - b);

  if (cuts.length === 0) {
    return [{ start: 1, end: totalPages }];
  }

  const ranges: { start: number; end: number }[] = [];
  let start = 1;
  for (const after of cuts) {
    ranges.push({ start, end: after });
    start = after + 1;
  }
  ranges.push({ start, end: totalPages });
  return ranges;
}

export function splitAfterFromEveryN(totalPages: number, every: number): Set<number> {
  const result = new Set<number>();
  const step = Math.max(1, every);
  for (let p = step; p < totalPages; p += step) {
    result.add(p);
  }
  return result;
}

export function splitAfterFromEachPage(totalPages: number): Set<number> {
  const result = new Set<number>();
  for (let p = 1; p < totalPages; p++) result.add(p);
  return result;
}
