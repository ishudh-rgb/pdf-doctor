import { createCanvas } from "@napi-rs/canvas";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const minimal = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj 4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj 5 0 obj<</Length 44>>stream\nBT /F1 24 Tf 100 700 Td (Hello) Tj ET\nendstream endobj xref\n0 6\ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n0\n%%EOF"
);

try {
  const data = new Uint8Array(minimal);
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  console.log("pages", doc.numPages);
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 0.5 });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext("2d");
  await page.render({
    canvasContext: ctx,
    viewport,
    canvas,
  }).promise;
  const jpeg = await canvas.encode("jpeg", 82);
  console.log("jpeg bytes", jpeg.length);
} catch (e) {
  console.error("FAIL", e);
  process.exit(1);
}
