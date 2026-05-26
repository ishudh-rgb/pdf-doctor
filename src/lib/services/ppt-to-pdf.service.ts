import { logError } from "@/lib/db/queries";
import { renderPresentationToPdf } from "@/lib/services/html-to-pdf.service";
import {
  isLikelyNumericCell,
  parsePptx,
  type ParsedSlide,
} from "@/lib/services/pptx-parse.service";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTable(table: string[][]): string {
  if (table.length === 0) return "";

  const headerRow = table[0];
  const bodyRows = table.slice(1);
  const amountStartIndex = headerRow.findIndex((cell) =>
    /debit|credit|balance|amount|total|dr|cr/i.test(cell)
  );

  const headerHtml = headerRow
    .map((cell) => `<th>${escapeHtml(cell || " ")}</th>`)
    .join("");

  const bodyHtml = bodyRows
    .map((row) => {
      const cells = row
        .map((cell, index) => {
          const numeric =
            amountStartIndex >= 0
              ? index >= amountStartIndex && isLikelyNumericCell(cell)
              : isLikelyNumericCell(cell);
          const className = numeric ? ' class="num"' : index === 0 ? ' class="center"' : "";
          return `<td${className}>${escapeHtml(cell || " ")}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<table class="slide-table"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
}

function renderImages(slide: ParsedSlide): string {
  return slide.images
    .map((image) => {
      const left = Math.max(0.2, Math.min(image.x, 8.5));
      const top = Math.max(0.15, Math.min(image.y, 4.5));
      const width = Math.max(0.5, Math.min(image.w, 2.5));
      const height = Math.max(0.4, Math.min(image.h, 1.5));

      return `<img class="slide-image" src="${image.dataUrl}" alt="" style="left:${left}in;top:${top}in;width:${width}in;height:${height}in;" />`;
    })
    .join("");
}

function renderSlide(slide: ParsedSlide): string {
  const tablesHtml = slide.tables.map(renderTable).join("");
  const imagesHtml = renderImages(slide);

  const extraText = slide.textBlocks
    .filter((block) => block.text !== slide.title && block.text !== slide.subtitle)
    .sort((a, b) => a.y - b.y)
    .map((block) => `<p class="slide-text">${escapeHtml(block.text)}</p>`)
    .join("");

  const subtitleHtml = slide.subtitle
    ? `<p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p>`
    : "";

  return `
    <section class="slide">
      <div class="slide-header">
        <h1 class="slide-title">${escapeHtml(slide.title)}</h1>
        ${subtitleHtml}
      </div>
      ${imagesHtml}
      <div class="slide-content">
        ${tablesHtml}
        ${extraText}
      </div>
      <div class="slide-footer">Slide ${slide.index + 1}</div>
    </section>
  `;
}

function buildPresentationHtml(slides: ParsedSlide[]): string {
  const body = slides.map(renderSlide).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Presentation</title>
  <style>
    @page { size: 10in 5.625in; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: Calibri, "Segoe UI", Arial, sans-serif;
      color: #111827;
    }
    .slide {
      width: 10in;
      height: 5.625in;
      page-break-after: always;
      position: relative;
      overflow: hidden;
      padding: 0.32in 0.38in 0.42in;
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    }
    .slide:last-child { page-break-after: auto; }
    .slide-header {
      margin-bottom: 0.14in;
      padding-bottom: 0.08in;
      border-bottom: 2px solid #dbeafe;
    }
    .slide-title {
      margin: 0;
      font-size: 20pt;
      line-height: 1.15;
      font-weight: 700;
      color: #1e3a8a;
    }
    .slide-subtitle {
      margin: 0.06in 0 0;
      font-size: 10.5pt;
      color: #64748b;
    }
    .slide-content {
      position: relative;
      z-index: 1;
    }
    .slide-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 8.6pt;
      margin-top: 0.08in;
    }
    .slide-table th {
      background: #e2e8f0;
      color: #1e293b;
      font-weight: 700;
      text-align: center;
      padding: 5px 6px;
      border: 1px solid #cbd5e1;
      word-wrap: break-word;
    }
    .slide-table td {
      padding: 4px 6px;
      border: 1px solid #cbd5e1;
      vertical-align: top;
      word-wrap: break-word;
      background: rgba(255, 255, 255, 0.92);
    }
    .slide-table tbody tr:nth-child(even) td {
      background: #f8fafc;
    }
    .slide-table td.num { text-align: right; white-space: nowrap; }
    .slide-table td.center { text-align: center; }
    .slide-text {
      margin: 0.08in 0 0;
      font-size: 11pt;
      line-height: 1.35;
      white-space: pre-wrap;
    }
    .slide-image {
      position: absolute;
      object-fit: contain;
      z-index: 2;
    }
    .slide-footer {
      position: absolute;
      right: 0.38in;
      bottom: 0.16in;
      font-size: 8pt;
      color: #94a3b8;
    }
  </style>
</head>
<body>${body}</body>
</html>`;
}

export async function pptToPdf(fileBuffer: Buffer): Promise<Buffer> {
  try {
    const slides = await parsePptx(fileBuffer);

    if (slides.every((slide) => slide.tables.length === 0 && slide.textBlocks.length === 0)) {
      throw new Error("No readable slide content found in the PowerPoint file.");
    }

    const html = buildPresentationHtml(slides);
    return await renderPresentationToPdf(html);
  } catch (err) {
    await logError({
      tool_name: "ppt-to-pdf",
      error_type: "PPT_TO_PDF_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
    throw new Error(
      `Failed to convert PowerPoint to PDF: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}
