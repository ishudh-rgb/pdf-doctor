import fs from "node:fs/promises";
import { excelWorkbookToHtml } from "../src/lib/services/excel-to-pdf.service";

async function main() {
  const input =
    process.argv[2] ??
    "c:/Users/NiTiN Dhiman/Downloads/file_example_XLS_5000.xls";
  const buffer = await fs.readFile(input);
  const html = excelWorkbookToHtml(buffer);

  const thead = html.match(/<thead>([\s\S]*?)<\/thead>/)?.[1] ?? "";
  const firstBodyRow = html.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1]?.match(/<tr[\s\S]*?<\/tr>/)?.[0] ?? "";

  const headerTh = (thead.match(/<th/g) ?? []).length;
  const headerTd = (thead.match(/<td/g) ?? []).length;
  const bodyTh = (firstBodyRow.match(/<th/g) ?? []).length;
  const bodyTd = (firstBodyRow.match(/<td/g) ?? []).length;

  console.log(`Header row: th=${headerTh}, td=${headerTd}`);
  console.log(`First data row: th=${bodyTh}, td=${bodyTd}`);

  const ok = headerTh >= 1 && headerTd === 0 && bodyTh === 0 && bodyTd >= 1;
  console.log(ok ? "\nPASS: header in thead, data in tbody" : "\nFAIL: table structure incorrect");
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
