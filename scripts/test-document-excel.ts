import { readFileSync } from "node:fs";
import { extractDocumentTablesForExcel } from "../src/lib/services/pdf-document-excel.service";
import { pdfToExcel } from "../src/lib/services/pdf-to-excel.service";

const pdfPath =
  process.argv[2] ??
  String.raw`c:\Users\NiTiN Dhiman\Downloads\The786_Founder_Summary_Sheet.pdf`;
const outPath =
  process.argv[3] ??
  String.raw`c:\Users\NiTiN Dhiman\Downloads\The786_Founder_Summary_Sheet-final.xlsx`;

async function main() {
  const buffer = readFileSync(pdfPath);
  const tsTables = await extractDocumentTablesForExcel(buffer);
  console.log("TS document tables:", tsTables.length);
  for (const table of tsTables) {
    console.log(`  Table: ${table.row_count}x${table.col_count}`);
    for (const row of table.rows.slice(0, 4)) {
      console.log("   ", row.map((c) => c.slice(0, 60)));
    }
  }

  const xlsx = await pdfToExcel(buffer);
  await import("node:fs/promises").then((fs) => fs.writeFile(outPath, xlsx));
  console.log("Wrote", outPath, xlsx.length, "bytes");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
