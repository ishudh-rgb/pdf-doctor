import fs from "node:fs";
import JSZip from "jszip";

async function main() {
  const pptx = fs.readFileSync("C:/temp/test.pptx");
  const zip = await JSZip.loadAsync(pptx);
  const xml = await zip.file("ppt/slides/slide3.xml")!.async("text");
  const table = xml.match(/<a:tbl>([\s\S]*?)<\/a:tbl>/)?.[1];
  if (!table) return;
  const firstRow = table.match(/<a:tr[\s\S]*?<\/a:tr>/)?.[0] ?? "";
  const firstCell = firstRow.match(/<a:tc[\s\S]*?<\/a:tc>/)?.[0] ?? "";
  console.log(firstCell.slice(0, 1200));
}

main();
