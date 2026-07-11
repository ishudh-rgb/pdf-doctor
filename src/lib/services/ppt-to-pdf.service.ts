import { logError } from "@/lib/db/queries";
import { renderPresentationToPdf, renderSlideImagesToPdf } from "@/lib/services/html-to-pdf.service";
import { tryConvertWithLibreOffice } from "@/lib/services/libreoffice-convert.service";
import { tryExportSlidesWithPowerPoint } from "@/lib/services/powerpoint-slide-export.service";
import {
  isLikelyNumericCell,
  parsePresentation,
  readPresentationSlideSizeInches,
  type ParsedSlide,
  type ParsedStyledTable,
  type ParsedTableCell,
  type ParsedTextBlock,
  type PageSizeInches,
} from "@/lib/services/pptx-parse.service";
import { cssPageSize } from "@/lib/utils/page-orientation";
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderStyledTable(table: ParsedStyledTable): string {
  if (table.rows.length === 0) return "";

  const headerRow = table.rows[0];
  const bodyRows = table.rows.slice(1);

  const renderCell = (cell: ParsedTableCell, tag: "th" | "td") => {
    const styleParts: string[] = [];
    if (cell.background && cell.background.toLowerCase() !== "#ffffff") {
      styleParts.push(`background:${cell.background}`);
    }
    if (cell.color) styleParts.push(`color:${cell.color}`);
    if (cell.bold) styleParts.push("font-weight:700");
    const style = styleParts.length > 0 ? ` style="${styleParts.join(";")}"` : "";
    const className =
      tag === "td" && isLikelyNumericCell(cell.text) ? ' class="num"' : "";
    return `<${tag}${className}${style}>${escapeHtml(cell.text || " ")}</${tag}>`;
  };

  const headerHtml = headerRow.map((cell) => renderCell(cell, "th")).join("");
  const bodyHtml = bodyRows
    .map((row) => {
      const cells = row.map((cell) => renderCell(cell, "td")).join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<table class="slide-table"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
}

function renderPlainTable(table: string[][]): string {
  if (table.length === 0) return "";

  const headerRow = table[0];
  const bodyRows = table.slice(1);

  const headerHtml = headerRow
    .map((cell) => `<th>${escapeHtml(cell || " ")}</th>`)
    .join("");

  const bodyHtml = bodyRows
    .map((row) => {
      const cells = row
        .map((cell) => {
          const numeric = isLikelyNumericCell(cell);
          const className = numeric ? ' class="num"' : "";
          return `<td${className}>${escapeHtml(cell || " ")}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<table class="slide-table"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
}

function renderPositionedText(block: ParsedTextBlock): string {
  const style = [
    `left:${block.x}in`,
    `top:${block.y}in`,
    `width:${block.w}in`,
    `min-height:${block.h}in`,
    `font-size:${block.fontSize}pt`,
    `color:${block.color}`,
    block.bold ? "font-weight:700" : "font-weight:400",
  ].join(";");

  return `<div class="slide-text-block" style="${style}">${escapeHtml(block.text)}</div>`;
}

function renderImages(slide: ParsedSlide): string {
  return slide.images
    .map((image) => {
      const style = [
        `left:${image.x}in`,
        `top:${image.y}in`,
        `width:${image.w}in`,
        `height:${image.h}in`,
      ].join(";");

      return `<img class="slide-image" src="${image.dataUrl}" alt="" style="${style}" />`;
    })
    .join("");
}

function renderSlide(slide: ParsedSlide): string {
  const tablesHtml =
    slide.styledTables.length > 0
      ? slide.styledTables.map(renderStyledTable).join("")
      : slide.tables.map(renderPlainTable).join("");
  const imagesHtml = renderImages(slide);
  const textHtml = slide.textBlocks.map(renderPositionedText).join("");

  const contentSlide = slide.images.length > 0 && slide.textBlocks.length <= 1;

  return `
    <section class="slide${contentSlide ? " slide-content" : ""}">
      ${textHtml}
      ${imagesHtml}
      ${tablesHtml ? `<div class="slide-table-wrap">${tablesHtml}</div>` : ""}
    </section>
  `;
}

function buildPresentationHtml(slides: ParsedSlide[], slideSize: PageSizeInches): string {
  const body = slides.map(renderSlide).join("");
  const marginIn = Math.max(0.35, Math.min(0.55, slideSize.widthIn * 0.055));
  const tableTopIn = slideSize.heightIn * 0.16;
  const contentTopIn = slideSize.heightIn * 0.14;
  const contentHeightIn = slideSize.heightIn * 0.72;
  const innerWidthIn = Math.max(1, slideSize.widthIn - marginIn * 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Presentation</title>
  <style>
    @page { size: ${cssPageSize(slideSize)}; margin: ${marginIn}in; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: Calibri, "Segoe UI", Arial, sans-serif;
      color: #000000;
    }
    .slide {
      width: ${slideSize.widthIn}in;
      height: ${slideSize.heightIn}in;
      page-break-after: always;
      position: relative;
      overflow: hidden;
      background: #ffffff;
    }
    .slide:last-child { page-break-after: auto; }
    .slide-text-block {
      position: absolute;
      line-height: 1.25;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .slide-image {
      position: absolute;
      object-fit: contain;
    }
    .slide-table-wrap {
      position: absolute;
      left: ${marginIn}in;
      top: ${tableTopIn}in;
      width: ${innerWidthIn}in;
    }
    .slide-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 15pt;
    }
    .slide-table th,
    .slide-table td {
      border: 1px solid #ffffff;
      padding: 10px 12px;
      vertical-align: middle;
      text-align: left;
      font-weight: 400;
      background: #ffffff;
      color: #000000;
      font-size: 15pt;
    }
    .slide-table th {
      background: #b3b3b3;
      font-weight: 400;
    }
    .slide-table tbody tr:nth-child(even) td {
      background: #e6e6e6;
    }
    .slide-table tbody tr:nth-child(odd) td {
      background: #ffffff;
    }
    .slide-content .slide-image {
      left: ${marginIn}in;
      top: ${contentTopIn}in;
      width: ${innerWidthIn}in;
      height: ${contentHeightIn}in;
    }
    .slide-table td.num { text-align: right; white-space: nowrap; }
  </style>
</head>
<body>${body}</body>
</html>`;
}

export async function pptToPdf(fileBuffer: Buffer, fileName?: string): Promise<Buffer> {
  try {
    if (process.platform === "win32") {
      const slideImages = await tryExportSlidesWithPowerPoint(fileBuffer);
      if (slideImages && slideImages.length > 0) {
        return await renderSlideImagesToPdf(slideImages);
      }
    }

    const libreOfficePdf = await tryConvertWithLibreOffice(fileBuffer, fileName);
    if (libreOfficePdf) {
      return libreOfficePdf;
    }

    const slides = await parsePresentation(fileBuffer);
    if (slides.every((slide) => slide.tables.length === 0 && slide.styledTables.length === 0 && slide.textBlocks.length === 0 && slide.images.length === 0)) {
      throw new Error("No readable slide content found in the PowerPoint file.");
    }

    const slideSize = await readPresentationSlideSizeInches(fileBuffer);
    const html = buildPresentationHtml(slides, slideSize);
    return await renderPresentationToPdf(html, { pageSize: slideSize });
  } catch (err) {
    await logError({
      tool_name: "ppt-to-pdf",
      error_type: "PPT_TO_PDF_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });

    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.toLowerCase().includes("central directory") || message.toLowerCase().includes("zip")) {
      throw new Error(
        "Failed to convert PowerPoint to PDF: This .ppt file could not be read. Try opening it in PowerPoint and saving as .pptx, then convert again."
      );
    }

    throw new Error(`Failed to convert PowerPoint to PDF: ${message}`);
  }
}
