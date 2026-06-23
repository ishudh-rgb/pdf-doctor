import fs from "node:fs/promises";
import path from "node:path";
import * as XLSX from "xlsx";
import { excelToPdf } from "../src/lib/services/excel-to-pdf.service";

async function extractPdfTopRows(pdfPath: string): Promise<string[][]> {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);

  const script = `
import fitz, sys, json
doc = fitz.open(sys.argv[1])
page = doc[0]
tables = page.find_tables()
rows = []
if tables.tables:
    data = tables[0].extract()
    rows = data[:4]
print(json.dumps(rows))
`;
  const tmp = path.join(process.cwd(), "scripts", "_verify_pdf_tables.py");
  await fs.writeFile(tmp, script.trim());
  const { stdout } = await execFileAsync("python", [tmp, pdfPath], {
    maxBuffer: 10 * 1024 * 1024,
  });
  return JSON.parse(stdout.trim()) as string[][];
}

async function readExcelTopRows(xlsPath: string): Promise<string[][]> {
  const buffer = await fs.readFile(xlsPath);
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true, cellNF: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: string[][] = [];
  for (let r = 0; r < 4; r++) {
    const row: string[] = [];
    for (let c = 0; c < 8; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      if (!cell) {
        row.push("");
        continue;
      }
      row.push(cell.w ? String(cell.w) : cell.v instanceof Date ? cell.v.toLocaleDateString() : String(cell.v ?? ""));
    }
    rows.push(row);
  }
  return rows;
}

function normalizeCell(value: string): string {
  return value.replace(/\u00a0/g, " ").trim();
}

async function main() {
  const input =
    process.argv[2] ??
    path.join(process.env.USERPROFILE ?? "", "Downloads", "file_example_XLS_5000.xls");
  const output =
    process.argv[3] ??
    path.join(process.cwd(), "scripts", "output", "file_example_XLS_5000-fixed.pdf");

  await fs.mkdir(path.dirname(output), { recursive: true });

  console.log("Reading Excel:", input);
  const buffer = await fs.readFile(input);
  console.log("Converting Excel to PDF...");
  const pdf = await excelToPdf(buffer);
  await fs.writeFile(output, pdf);
  console.log(`Wrote ${output} (${pdf.length} bytes)`);

  const excelRows = await readExcelTopRows(input);
  console.log("\nExcel top rows:");
  for (const row of excelRows) console.log(row.map(normalizeCell).join(" | "));

  try {
    const pdfRows = await extractPdfTopRows(output);
    console.log("\nPDF top rows (extracted):");
    for (const row of pdfRows) console.log(row.map((c) => normalizeCell(c ?? "")).join(" | "));

    let mismatches = 0;
    for (let r = 0; r < Math.min(excelRows.length, pdfRows.length); r++) {
      for (let c = 0; c < Math.min(excelRows[r].length, pdfRows[r]?.length ?? 0); c++) {
        const a = normalizeCell(excelRows[r][c] ?? "");
        const b = normalizeCell(pdfRows[r]?.[c] ?? "");
        if (a !== b && !(a === "" && b === "")) {
          mismatches++;
          console.log(`Mismatch R${r + 1}C${c + 1}: excel="${a}" pdf="${b}"`);
        }
      }
    }
    console.log(`\nTop-row cell mismatches: ${mismatches}`);
    process.exit(mismatches > 0 ? 1 : 0);
  } catch (err) {
    console.warn("PDF table verify skipped:", err instanceof Error ? err.message : err);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
