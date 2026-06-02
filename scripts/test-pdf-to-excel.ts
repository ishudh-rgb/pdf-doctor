import fs from "node:fs/promises";
import path from "node:path";
import { pdfToExcel } from "../src/lib/services/pdf-to-excel.service";

async function main() {
  const input =
    process.argv[2] ??
    path.join(
      process.env.USERPROFILE ?? "",
      "Downloads",
      "Employee Sample Data.pdf"
    );
  const output =
    process.argv[3] ??
    input.replace(/\.pdf$/i, "-doctor-test.xlsx");

  console.log("Reading:", input);
  const buffer = await fs.readFile(input);
  console.log("Converting PDF to Excel...");
  const xlsx = await pdfToExcel(buffer);
  await fs.writeFile(output, xlsx);
  console.log(`Wrote ${output} (${xlsx.length} bytes)`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
