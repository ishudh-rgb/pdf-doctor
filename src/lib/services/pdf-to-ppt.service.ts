import PptxGenJS from "pptxgenjs";
import { execFile } from "node:child_process";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { logError } from "@/lib/db/queries";
import { resolvePdf2docxPython } from "@/lib/services/pdf-to-word-pdf2docx.service";

const execFileAsync = promisify(execFile);

const RENDER_SCRIPT = path.join(process.cwd(), "scripts", "pdf-render-pages.py");
const TARGET_WIDTH = 2400;
const PT_PER_INCH = 72;
const CUSTOM_LAYOUT = "PDF_PAGE";

interface RenderedPage {
  image: Buffer;
  widthPt: number;
  heightPt: number;
}

interface RenderResult {
  pageCount: number;
  pages: Array<{
    page: number;
    width: number;
    height: number;
    widthPt: number;
    heightPt: number;
    path: string;
  }>;
  error?: string;
}

function pointsToInches(pt: number): number {
  return Math.round((pt / PT_PER_INCH) * 1000) / 1000;
}

/** Pick slide size from PDF pages — matches original page aspect ratio (Smallpdf-style). */
function resolveSlideSizeInches(pages: RenderedPage[]): { width: number; height: number } {
  if (pages.length === 1) {
    return {
      width: pointsToInches(pages[0].widthPt),
      height: pointsToInches(pages[0].heightPt),
    };
  }

  const first = pages[0];
  let widthPt = first.widthPt;
  let heightPt = first.heightPt;

  if (pages.length > 1) {
    const portraitCount = pages.filter((p) => p.heightPt >= p.widthPt).length;
    const landscapeCount = pages.length - portraitCount;
    const dominantPortrait = portraitCount >= landscapeCount;

    const sameOrientation = pages.filter((p) =>
      dominantPortrait ? p.heightPt >= p.widthPt : p.widthPt > p.heightPt
    );
    const pool = sameOrientation.length > 0 ? sameOrientation : pages;

    widthPt = Math.max(...pool.map((p) => p.widthPt));
    heightPt = Math.max(...pool.map((p) => p.heightPt));
  }

  return {
    width: pointsToInches(widthPt),
    height: pointsToInches(heightPt),
  };
}

async function renderPdfPages(fileBuffer: Buffer): Promise<RenderedPage[]> {
  const python = (await resolvePdf2docxPython()) ?? "python";
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdf-doctor-ppt-render-"));
  const pdfPath = path.join(tmpDir, "input.pdf");
  const outputDir = path.join(tmpDir, "slides");

  try {
    await fs.writeFile(pdfPath, fileBuffer);
    await fs.mkdir(outputDir, { recursive: true });

    const { stdout } = await execFileAsync(
      python,
      [RENDER_SCRIPT, pdfPath, outputDir, String(TARGET_WIDTH)],
      { timeout: 180_000, maxBuffer: 10 * 1024 * 1024 }
    );

    const lines = stdout.trim().split("\n");
    let jsonLine = "";
    for (let i = lines.length - 1; i >= 0; i--) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith("{")) {
        jsonLine = trimmed;
        break;
      }
    }
    if (!jsonLine) throw new Error("No JSON output from render script");

    const result: RenderResult = JSON.parse(jsonLine);
    if (result.error) throw new Error(result.error);
    if (!result.pages?.length) throw new Error("No pages rendered from PDF");

    return result.pages.map((pageInfo) => ({
      image: fsSync.readFileSync(pageInfo.path),
      widthPt: pageInfo.widthPt,
      heightPt: pageInfo.heightPt,
    }));
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function pdfToPpt(fileBuffer: Buffer): Promise<Buffer> {
  try {
    const pages = await renderPdfPages(fileBuffer);

    if (pages.length === 0) {
      throw new Error("No pages found in the PDF file.");
    }

    const slideSize = resolveSlideSizeInches(pages);
    const pptx = new PptxGenJS();
    pptx.defineLayout({
      name: CUSTOM_LAYOUT,
      width: slideSize.width,
      height: slideSize.height,
    });
    pptx.layout = CUSTOM_LAYOUT;
    pptx.author = "OnlyMyPDF";
    pptx.title = "PDF Export";

    for (const page of pages) {
      const slide = pptx.addSlide();
      const dataUri = `data:image/png;base64,${page.image.toString("base64")}`;

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
