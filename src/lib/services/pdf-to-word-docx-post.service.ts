import JSZip from "jszip";

export type DocxQualityMetrics = {
  chars: number;
  tables: number;
  drawings: number;
  media: number;
  bytes: number;
};

function extractMetricsFromXml(xml: string, bytes: number, media: number): DocxQualityMetrics {
  const chars = (xml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) ?? []).reduce(
    (sum, node) => sum + node.replace(/<[^>]+>/g, "").length,
    0
  );
  return {
    chars,
    tables: (xml.match(/<w:tbl/g) ?? []).length,
    drawings: (xml.match(/<w:drawing/g) ?? []).length,
    media,
    bytes,
  };
}

export async function measureDocxQuality(buffer: Buffer): Promise<DocxQualityMetrics> {
  if (buffer.length < 1500) {
    return { chars: 0, tables: 0, drawings: 0, media: 0, bytes: buffer.length };
  }

  try {
    const zip = await JSZip.loadAsync(buffer);
    const doc = zip.file("word/document.xml");
    if (!doc) {
      return { chars: 0, tables: 0, drawings: 0, media: 0, bytes: buffer.length };
    }
    const xml = await doc.async("string");
    const media = Object.keys(zip.files).filter((name) => name.startsWith("word/media/")).length;
    return extractMetricsFromXml(xml, buffer.length, media);
  } catch {
    const text = buffer.toString("latin1");
    return extractMetricsFromXml(text, buffer.length, 0);
  }
}

/**
 * Reject empty or broken DOCX outputs before returning to the user.
 * Invoices/forms need text + layout artifacts; scanned PDFs may be image-heavy.
 */
export async function isDocxConversionAcceptable(
  buffer: Buffer,
  hints?: { pageCount?: number; pdfTextChars?: number }
): Promise<boolean> {
  if (buffer.length < 1500) return false;

  const metrics = await measureDocxQuality(buffer);
  const pages = Math.max(1, hints?.pageCount ?? 1);
  const minChars = hints?.pdfTextChars
    ? Math.min(hints.pdfTextChars, Math.max(120, Math.floor(hints.pdfTextChars * 0.35)))
    : Math.max(80, pages * 60);

  const hasStructure =
    metrics.chars >= minChars ||
    metrics.tables > 0 ||
    metrics.drawings >= pages ||
    metrics.media >= pages;

  if (!hasStructure) return false;

  // pdf2docx sometimes emits huge files with almost no usable text.
  if (metrics.chars < 40 && metrics.tables === 0 && metrics.media === 0) {
    return false;
  }

  // Layout-heavy PDFs: reject text-only extractions with poor structure.
  if (hints?.pdfTextChars && hints.pdfTextChars > 700 && pages >= 1) {
    const layoutArtifacts = metrics.tables + metrics.drawings + metrics.media;
    if (layoutArtifacts < pages && metrics.chars < hints.pdfTextChars * 0.55) {
      return false;
    }
  }

  return true;
}

/**
 * Light post-process: left-align only. Images/tables preserved for layout fidelity.
 */
export async function postProcessDocx(buffer: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer);
  const xmlPaths = Object.keys(zip.files).filter((name) =>
    /^word\/(document|header|footer|footnotes|endnotes)\d*\.xml$/.test(name)
  );

  for (const xmlPath of xmlPaths) {
    const file = zip.file(xmlPath);
    if (!file) continue;
    let xml = await file.async("string");
    xml = xml.replace(/<w:jc w:val="center"/g, '<w:jc w:val="left"');
    zip.file(xmlPath, xml);
  }

  return Buffer.from(
    await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 1 },
    })
  );
}

export function scoreDocxQuality(buffer: Buffer): number {
  const text = buffer.toString("latin1");
  const tables = (text.match(/<w:tbl/g) ?? []).length;
  const chars = (text.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) ?? []).reduce(
    (sum, node) => sum + (node.replace(/<[^>]+>/g, "").length ?? 0),
    0
  );
  const drawings = (text.match(/<w:drawing/g) ?? []).length;
  return tables * 800 + chars + drawings * 100;
}
