import fs from "node:fs/promises";
import path from "node:path";
import { pdfToPpt } from "../src/lib/services/pdf-to-ppt.service";

async function main() {
  const input =
    process.argv[2] ??
    path.join(
      process.env.USERPROFILE ?? "",
      "Downloads",
      "socialmediapowerpointpresentation-190930121315.pdf"
    );
  const output =
    process.argv[3] ??
    input.replace(/\.pdf$/i, "-doctor-test.pptx");

  console.log("Reading:", input);
  const buffer = await fs.readFile(input);
  console.log("Converting PDF to PPT...");
  const pptx = await pdfToPpt(buffer);
  await fs.writeFile(output, pptx);
  console.log(`Wrote ${output} (${pptx.length} bytes)`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
