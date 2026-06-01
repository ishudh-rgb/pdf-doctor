import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "test-multi.pdf");

const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
for (let i = 1; i <= 6; i++) {
  const page = doc.addPage([612, 792]);
  page.drawText(`Page ${i} — Problem Statement`, { x: 50, y: 700, size: 18, font, color: rgb(0, 0, 0) });
  page.drawText("CONFIDENTIAL", { x: 200, y: 400, size: 48, font, color: rgb(0.7, 0.7, 0.7), rotate: { angle: -45, type: "degrees" } });
}
const bytes = await doc.save();
writeFileSync(outPath, bytes);

const form = new FormData();
form.append("file", new Blob([bytes], { type: "application/pdf" }), "test-multi.pdf");
form.append("startPage", "1");
form.append("endPage", "4");

const res = await fetch("http://localhost:3000/api/tools/pdf-previews", {
  method: "POST",
  body: form,
});
const json = await res.json();
console.log("status", res.status);
console.log("totalPages", json.totalPages);
console.log("thumbs", json.thumbnails?.map((t) => (t ? t.length : 0)));
if (!json.thumbnails?.some(Boolean)) {
  console.error("NO THUMBS", json.error ?? json);
  process.exit(1);
}
console.log("OK");
