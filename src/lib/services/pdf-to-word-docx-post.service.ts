import JSZip from "jszip";

/**
 * Light post-process: left-align only. Images/tables preserved for Smallpdf parity.
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
      compressionOptions: { level: 6 },
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
