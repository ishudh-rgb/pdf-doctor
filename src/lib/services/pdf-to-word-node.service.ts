import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  PageBreak,
} from "docx";
import { PDFParse } from "pdf-parse";
import {
  extractPdfDocumentForWord,
  fixLigatureArtifacts,
  type WordDocBlock,
} from "@/lib/services/pdf-document-extract.service";

const BODY_FONT = "Calibri";

function halfPoints(fontSize: number): number {
  return Math.max(18, Math.round(fontSize * 2));
}

function cellParagraphs(cellText: string, isHeader: boolean): Paragraph[] {
  const lines = cellText.split(/\n+/).map((l) => fixLigatureArtifacts(l.trim())).filter(Boolean);

  if (lines.length === 0) {
    return [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: " ", font: BODY_FONT, size: 18 })],
      }),
    ];
  }

  return lines.map((line, index) => {
    const bullet = line.match(/^[•●◦▪\-–—*·]\s*(.+)/);
    const text = bullet ? bullet[1] : line;

    return new Paragraph({
      alignment: AlignmentType.LEFT,
      bullet: bullet ? { level: 0 } : undefined,
      spacing: { after: index < lines.length - 1 ? 40 : 0 },
      children: [
        new TextRun({
          text,
          font: BODY_FONT,
          bold: isHeader || (index === 0 && line.length < 40 && !bullet),
          size: isHeader ? 20 : 18,
        }),
      ],
    });
  });
}

function tableFromRows(rows: string[][]): Table {
  const columnCount = Math.max(...rows.map((r) => r.length), 1);
  const cellWidth = Math.floor(9000 / columnCount);

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((row, rowIndex) => {
      const padded = [...row];
      while (padded.length < columnCount) padded.push("");
      const isHeader = rowIndex === 0;

      return new TableRow({
        children: padded.map(
          (cell) =>
            new TableCell({
              width: { size: cellWidth, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
              },
              shading: isHeader ? { fill: "E2E8F0" } : rowIndex % 2 === 0 ? { fill: "F8FAFC" } : undefined,
              children: cellParagraphs(cell, isHeader),
            })
        ),
      });
    }),
  });
}

function blockToDocx(block: WordDocBlock): Paragraph | Table {
  if (block.type === "pageBreak") {
    return new Paragraph({ spacing: { before: 0, after: 0 }, children: [new PageBreak()] });
  }

  switch (block.type) {
    case "title":
      return new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: fixLigatureArtifacts(block.text),
            font: BODY_FONT,
            bold: block.bold ?? true,
            size: halfPoints(block.fontSize ?? 16),
          }),
        ],
      });
    case "heading":
      return new Paragraph({
        alignment: AlignmentType.LEFT,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 280, after: 120 },
        children: [
          new TextRun({
            text: fixLigatureArtifacts(block.text),
            font: BODY_FONT,
            bold: block.bold ?? true,
            size: halfPoints(block.fontSize ?? 13),
          }),
        ],
      });
    case "bullet":
      return new Paragraph({
        alignment: AlignmentType.LEFT,
        bullet: { level: 0 },
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: fixLigatureArtifacts(block.text),
            font: BODY_FONT,
            bold: block.bold,
            size: halfPoints(block.fontSize ?? 10),
          }),
        ],
      });
    case "table":
      return tableFromRows(block.rows);
    case "paragraph":
    default:
      return new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: fixLigatureArtifacts(block.text),
            font: BODY_FONT,
            bold: block.bold,
            size: halfPoints(block.fontSize ?? 10),
          }),
        ],
      });
  }
}

async function fallbackPlainTextDocx(fileBuffer: Buffer): Promise<Buffer> {
  const parser = new PDFParse({ data: fileBuffer });
  try {
    const parsed = await parser.getText({
      lineEnforce: true,
      cellSeparator: "\t",
      cellThreshold: 5,
      lineThreshold: 6,
    });

    const children: (Paragraph | Table)[] = [];

    for (const rawLine of parsed.text.split(/\r?\n/)) {
      const line = fixLigatureArtifacts(rawLine.trim());
      if (!line || /^confidential$/i.test(line)) continue;

      if (/^\d+\.\s+\S/.test(line)) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 100 },
            children: [
              new TextRun({ text: line, font: BODY_FONT, bold: true, size: 26 }),
            ],
          })
        );
        continue;
      }

      const bullet = line.match(/^[•●◦▪\-–—*·]\s*(.+)/);
      if (bullet) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            bullet: { level: 0 },
            spacing: { after: 80 },
            children: [
              new TextRun({ text: bullet[1], font: BODY_FONT, size: 20 }),
            ],
          })
        );
        continue;
      }

      if (line.includes("\t")) {
        const cells = line.split("\t").map((c) => fixLigatureArtifacts(c.trim()));
        children.push(tableFromRows([cells]));
        continue;
      }

      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { after: 100 },
          children: [new TextRun({ text: line, font: BODY_FONT, size: 20 })],
        })
      );
    }

    if (children.length === 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "No extractable text found in this PDF.",
              font: BODY_FONT,
              size: 22,
            }),
          ],
        })
      );
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
          },
          children,
        },
      ],
    });

    return await Packer.toBuffer(doc);
  } finally {
    await parser.destroy();
  }
}

/** Basic Node.js extractor — fallback only when pdf2docx is unavailable. */
export async function pdfToWordNode(fileBuffer: Buffer): Promise<Buffer> {
  const blocks = await extractPdfDocumentForWord(fileBuffer);
  if (blocks.length === 0) return fallbackPlainTextDocx(fileBuffer);

  const children = blocks.map(blockToDocx);
  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
