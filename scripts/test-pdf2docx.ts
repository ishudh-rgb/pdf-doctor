import fs from "fs";
import path from "path";
import { isPdf2docxAvailable, pdfToWordPdf2docx } from "../src/lib/services/pdf-to-word-pdf2docx.service";

async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath || !fs.existsSync(pdfPath)) {
    console.error("Usage: npx tsx scripts/test-pdf2docx.ts <file.pdf>");
    process.exit(1);
  }

  console.log("pdf2docx available:", await isPdf2docxAvailable());
  const pdf = fs.readFileSync(pdfPath);
  const start = Date.now();
  const docx = await pdfToWordPdf2docx(pdf, { timeoutMs: 300_000 });
  if (!docx) {
    console.error("Conversion wrote no in-memory buffer (disk-only mode).");
    process.exit(1);
  }
  const out = path.join(process.cwd(), "test-pdf2docx-output.docx");
  fs.writeFileSync(out, docx);
  console.log(`Saved ${out} (${docx.length} bytes) in ${Date.now() - start}ms`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
