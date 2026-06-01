import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { extractPdfDocumentForWord, fixLigatureArtifacts } from "../src/lib/services/pdf-document-extract.service";
import { pdfToWord } from "../src/lib/services/pdf-to-word.service";

async function buildMarketingTablePdf(): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([612, 792]);

  page.drawText("8. Marketing Model", { x: 50, y: 740, size: 14, font: bold });

  const y0 = 700;
  const cols = [55, 210, 430];
  const headers = ["Strategy", "Role", "Priority"];
  const rows = [
    ["Accessible-Premium Positioning", "Luxury-feel, Arabic-inspired, India-fit brand message", "High"],
    ["Trial-First / Discovery Funnel", "Reduce blind-buy fear and improve conversion", "Very High"],
    ["Creator-Led Trust", "Build social proof and premium desirability", "High"],
  ];

  for (let i = 0; i < 3; i += 1) {
    page.drawText(headers[i], { x: cols[i], y: y0, size: 10, font: bold });
  }
  let y = y0 - 22;
  for (const row of rows) {
    for (let i = 0; i < 3; i += 1) {
      page.drawText(row[i], { x: cols[i], y, size: 9, font });
    }
    y -= 20;
  }

  page.drawText("Office flow efficient profit", { x: 50, y: y - 30, size: 10, font });

  return Buffer.from(await pdf.save());
}

async function main() {
  const inputPath = process.argv[2];
  let buffer: Buffer;

  if (inputPath && fs.existsSync(inputPath)) {
    buffer = fs.readFileSync(inputPath);
    console.log(`Using: ${inputPath}`);
  } else {
    buffer = await buildMarketingTablePdf();
    console.log("Using sample marketing table PDF");
  }

  console.log("Ligature test:", fixLigatureArtifacts("pro fi t O ffi cer Tra ffi c Quali fi ed"));

  const blocks = await extractPdfDocumentForWord(buffer);
  const tables = blocks.filter((b) => b.type === "table");
  console.log(`Blocks: ${blocks.length}, Tables: ${tables.length}`);
  for (const t of tables) {
    if (t.type !== "table") continue;
    console.log(`Table ${t.rows.length}x${t.rows[0]?.length}`);
    t.rows.forEach((r) => console.log("  |", r.join(" | ")));
  }

  const { buffer: docx, engine } = await pdfToWord(buffer);
  const out = path.join(process.cwd(), "test-pdf-to-word-output.docx");
  fs.writeFileSync(out, docx);
  console.log(`Saved ${out} (${docx.length} bytes) via ${engine}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
