import fs from "node:fs";
import JSZip from "jszip";

async function main() {
  const pptx = fs.readFileSync("C:/temp/test.pptx");
  const zip = await JSZip.loadAsync(pptx);
  const xml = await zip.file("ppt/slides/slide3.xml")!.async("text");
  const tables = [...xml.matchAll(/<a:tbl>([\s\S]*?)<\/a:tbl>/g)];
  console.log("tables found:", tables.length);
  for (const [index, table] of tables.entries()) {
    const rows = [...table[1].matchAll(/<a:tr[\s\S]*?<\/a:tr>/g)];
    console.log(`table ${index + 1} rows:`, rows.length);
  }
}

main();
