import fs from "node:fs/promises";
import path from "node:path";
import * as XLSX from "xlsx";
import { excelToPdf, excelWorkbookToHtml } from "../src/lib/services/excel-to-pdf.service";

async function main() {
  const input = "c:/Users/NiTiN Dhiman/Downloads/file_example_XLS_5000.xls";
  const outDir = path.join(process.cwd(), "scripts", "output");
  await fs.mkdir(outDir, { recursive: true });

  const buffer = await fs.readFile(input);
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true, cellNF: true });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];

  const truncated = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
  const slice = truncated.slice(0, 6);
  const miniSheet = XLSX.utils.aoa_to_sheet(slice);
  const miniWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(miniWb, miniSheet, sheetName);
  const miniBuffer = XLSX.write(miniWb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  const html = excelWorkbookToHtml(miniBuffer);
  const row2 = [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)][1]?.[1] ?? "";
  console.log("Row 2 has right-align on Age:", /text-align:right/.test(row2));
  console.log("Row 2 sample:", row2.slice(0, 220));

  const pdfPath = path.join(outDir, "file_example_XLS_5000-top6-fixed.pdf");
  const pdf = await excelToPdf(miniBuffer);
  await fs.writeFile(pdfPath, pdf);
  console.log(`Wrote sample PDF: ${pdfPath} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
