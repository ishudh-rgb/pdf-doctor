import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import {
  isLegacyPptBuffer,
  isPptxBuffer,
} from "@/lib/services/pptx-parse.service";

const execFileAsync = promisify(execFile);

const EXPORT_SLIDES_SCRIPT = path.join(
  process.cwd(),
  "scripts",
  "ppt-export-slide-images.vbs"
);

function detectExtension(fileBuffer: Buffer): "ppt" | "pptx" | null {
  if (isLegacyPptBuffer(fileBuffer)) return "ppt";
  if (isPptxBuffer(fileBuffer)) return "pptx";
  return null;
}

export async function tryExportSlidesWithPowerPoint(
  fileBuffer: Buffer
): Promise<Buffer[] | null> {
  if (process.platform !== "win32") return null;

  const extension = detectExtension(fileBuffer);
  if (!extension) return null;

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdf-doctor-ppt-slides-"));
  const inputPath = path.join(tmpDir, `input.${extension}`);
  const outputDir = path.join(tmpDir, "slides");

  try {
    await fs.writeFile(inputPath, fileBuffer);
    await fs.mkdir(outputDir, { recursive: true });

    const { stdout, stderr } = await execFileAsync(
      "cscript",
      ["//Nologo", EXPORT_SLIDES_SCRIPT, inputPath, outputDir],
      { timeout: 180_000, windowsHide: true }
    );

    const combined = `${stdout}\n${stderr}`.trim();
    const match = combined.match(/OK\s+(\d+)/);
    if (!match) return null;

    const slideCount = Number(match[1]);
    if (!Number.isFinite(slideCount) || slideCount <= 0) return null;

    const images: Buffer[] = [];
    for (let i = 1; i <= slideCount; i += 1) {
      const pngPath = path.join(outputDir, `slide${i}.png`);
      try {
        images.push(await fs.readFile(pngPath));
      } catch {
        return null;
      }
    }

    return images.length === slideCount ? images : null;
  } catch {
    return null;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
