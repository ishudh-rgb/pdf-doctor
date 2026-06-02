import fs from "node:fs/promises";
import path from "node:path";
import { pptToPdf } from "../src/lib/services/ppt-to-pdf.service";

async function main() {
  const input =
    process.argv[2] ??
    path.join(process.env.USERPROFILE ?? "", "Downloads", "file_example_PPT_1MB.ppt");
  const output =
    process.argv[3] ??
    path.join(process.env.USERPROFILE ?? "", "Downloads", "file_example_PPT_1MB-doctor-test.pdf");

  const buffer = await fs.readFile(input);
  const pdf = await pptToPdf(buffer);
  await fs.writeFile(output, pdf);
  console.log(`Wrote ${output} (${pdf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
