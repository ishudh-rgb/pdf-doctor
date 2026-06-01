import fs from "fs/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { getPdfPageCountFromBuffer } from "@/lib/pdf/pdf-page-count.server";

async function createRecipe(inputPath: string, outputPath: string) {
  const { Recipe } = await import("muhammara");
  return new Recipe(inputPath, outputPath);
}

async function withInputPdf<T>(
  fileBuffer: Buffer,
  fn: (inputPath: string) => Promise<T>
): Promise<T> {
  const id = randomUUID();
  const inputPath = path.join(os.tmpdir(), `pdf-doctor-split-${id}.pdf`);
  await fs.writeFile(inputPath, fileBuffer);

  try {
    return await fn(inputPath);
  } finally {
    await fs.unlink(inputPath).catch(() => {});
  }
}

function pageRangeTuple(start: number, end: number): [number, number] {
  return [start, end];
}

async function writeRangePdf(
  inputPath: string,
  start: number,
  end: number
): Promise<Buffer> {
  const id = randomUUID();
  const outputPath = path.join(os.tmpdir(), `pdf-doctor-split-out-${id}.pdf`);

  try {
    const recipe = await createRecipe(inputPath, outputPath);
    recipe.appendPage(inputPath, [pageRangeTuple(start, end)]);
    recipe.endPDF();
    return await fs.readFile(outputPath);
  } finally {
    await fs.unlink(outputPath).catch(() => {});
    await fs.unlink(`${outputPath}.tmp.pdf`).catch(() => {});
  }
}

export async function splitPdfWithMuhammara(
  fileBuffer: Buffer,
  ranges: { start: number; end: number }[]
): Promise<Buffer[]> {
  const totalPages = await getPdfPageCountFromBuffer(fileBuffer);

  for (const range of ranges) {
    if (range.start < 1 || range.end > totalPages || range.start > range.end) {
      throw new Error(
        `Invalid page range ${range.start}-${range.end}. Document has ${totalPages} pages.`
      );
    }
  }

  return withInputPdf(fileBuffer, async (inputPath) => {
    const results: Buffer[] = [];
    for (const range of ranges) {
      results.push(await writeRangePdf(inputPath, range.start, range.end));
    }
    return results;
  });
}

export async function splitAllPagesWithMuhammara(fileBuffer: Buffer): Promise<Buffer[]> {
  const totalPages = await getPdfPageCountFromBuffer(fileBuffer);
  const ranges = Array.from({ length: totalPages }, (_, i) => ({
    start: i + 1,
    end: i + 1,
  }));
  return splitPdfWithMuhammara(fileBuffer, ranges);
}

export async function extractPagesWithMuhammara(
  fileBuffer: Buffer,
  pageNumbers: number[]
): Promise<Buffer> {
  const totalPages = await getPdfPageCountFromBuffer(fileBuffer);

  for (const num of pageNumbers) {
    if (num < 1 || num > totalPages) {
      throw new Error(`Page ${num} does not exist. Document has ${totalPages} pages.`);
    }
  }

  return withInputPdf(fileBuffer, async (inputPath) => {
    const id = randomUUID();
    const outputPath = path.join(os.tmpdir(), `pdf-doctor-extract-${id}.pdf`);

    try {
      const recipe = await createRecipe(inputPath, outputPath);
      recipe.appendPage(inputPath, pageNumbers);
      recipe.endPDF();
      return await fs.readFile(outputPath);
    } finally {
      await fs.unlink(outputPath).catch(() => {});
      await fs.unlink(`${outputPath}.tmp.pdf`).catch(() => {});
    }
  });
}
