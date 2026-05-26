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
} from "docx";
import { PDFParse } from "pdf-parse";
import { logError } from "@/lib/db/queries";
import { extractPdfTables, isHeaderRow, parseTabularFallback } from "@/lib/services/pdf-table-extract.service";

function tableFromRows(rows: string[][]): Table {
  const columnCount = rows[0]?.length ?? 1;
  const cellWidth = Math.floor(9000 / columnCount);

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((row, rowIndex) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              width: { size: cellWidth, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
              },
              shading:
                rowIndex === 0
                  ? { fill: "E2E8F0" }
                  : undefined,
              children: [
                new Paragraph({
                  alignment:
                    rowIndex > 0 && /^\d[\d,]*(?:\.\d+)?$/.test(cell.trim())
                      ? AlignmentType.RIGHT
                      : AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: cell || " ",
                      bold: rowIndex === 0,
                      size: rowIndex === 0 ? 20 : 18,
                    }),
                  ],
                }),
              ],
            })
        ),
      })
    ),
  });
}

async function fallbackTextTable(fileBuffer: Buffer): Promise<string[][]> {
  const parser = new PDFParse({ data: fileBuffer });
  try {
    const parsed = await parser.getText({
      lineEnforce: true,
      cellSeparator: "\t",
      cellThreshold: 5,
      lineThreshold: 6,
    });
    return parseTabularFallback(parsed.text);
  } finally {
    await parser.destroy();
  }
}

export async function pdfToWord(fileBuffer: Buffer): Promise<Buffer> {
  try {
    const extracted = await extractPdfTables(fileBuffer);
    const children: (Paragraph | Table)[] = [];

    if (extracted.infoLines.length > 0) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          heading: HeadingLevel.TITLE,
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: extracted.infoLines[0],
              bold: true,
              size: 36,
            }),
          ],
        })
      );

      extracted.infoLines.slice(1).forEach((line) => {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({ text: line, size: 22, color: "475569" })],
          })
        );
      });

      children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
    }

    const table =
      extracted.primaryTable ??
      extracted.pages.find((page) => page.table)?.table ??
      null;

    if (table) {
      const cleaned = table.filter((row, index) => index === 0 || !isHeaderRow(row));
      children.push(tableFromRows(cleaned.length > 1 ? cleaned : table));
    } else {
      const fallback = await fallbackTextTable(fileBuffer);
      if (fallback.length > 0) {
        children.push(tableFromRows(fallback));
      } else {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "No extractable text found in this PDF.", size: 22 })],
          })
        );
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 720, right: 720, bottom: 720, left: 720 },
            },
          },
          children,
        },
      ],
    });

    return await Packer.toBuffer(doc);
  } catch (err) {
    await logError({
      tool_name: "pdf-to-word",
      error_type: "PDF_TO_WORD_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
    throw new Error(
      `Failed to convert PDF to Word: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}
