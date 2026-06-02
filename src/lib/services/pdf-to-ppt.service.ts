import PptxGenJS from "pptxgenjs";
import { execFile } from "node:child_process";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { logError } from "@/lib/db/queries";

const execFileAsync = promisify(execFile);

const RENDER_SCRIPT = path.join(process.cwd(), "scripts", "pdf-render-pages.py");
const TARGET_WIDTH = 1920;

interface RenderResult {
  pageCount: number;
  pages: Array<{ page: number; width: number; height: number; path: string }>;
  error?: string;
}

async function renderPdfPagesToPng(fileBuffer: Buffer): Promise<Buffer[]> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdf-doctor-ppt-render-"));
  const pdfPath = path.join(tmpDir, "input.pdf");
  const outputDir = path.join(tmpDir, "slides");

  try {
    await fs.writeFile(pdfPath, fileBuffer);
    await fs.mkdir(outputDir, { recursive: true });

    const { stdout, stderr } = await execFileAsync(
      "python",
      [RENDER_SCRIPT, pdfPath, outputDir, String(TARGET_WIDTH)],
      { timeout: 120_000, maxBuffer: 10 * 1024 * 1024 }
    );

    const result: RenderResult = JSON.parse(stdout.trim());
    if (result.error) throw new Error(result.error);
    if (!result.pages || result.pages.length === 0) {
      throw new Error("No pages rendered from PDF");
    }

    const images: Buffer[] = [];
    for (const pageInfo of result.pages) {
      images.push(fsSync.readFileSync(pageInfo.path));
    }

    return images;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function pdfToPpt(fileBuffer: Buffer): Promise<Buffer> {
  try {
    const pageImages = await renderPdfPagesToPng(fileBuffer);

    if (pageImages.length === 0) {
      throw new Error("No pages found in the PDF file.");
    }

    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_16x9";
    pptx.author = "PDF Doctor";
    pptx.title = "PDF Export";

    for (const imgBuffer of pageImages) {
      const slide = pptx.addSlide();
      const dataUri = `data:image/jpeg;base64,${imgBuffer.toString("base64")}`;

      slide.addImage({
        data: dataUri,
        x: 0,
        y: 0,
        w: "100%",
        h: "100%",
      });
    }

    const output = await pptx.write({ outputType: "nodebuffer" });
    return Buffer.from(output as ArrayBuffer);
  } catch (err) {
    await logError({
      tool_name: "pdf-to-ppt",
      error_type: "PDF_TO_PPT_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
    throw new Error(
      `Failed to convert PDF to PowerPoint: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}
