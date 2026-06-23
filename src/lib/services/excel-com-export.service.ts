import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const EXCEL_EXPORT_SCRIPT = path.join(
  process.cwd(),
  "scripts",
  "excel-export-pdf.vbs"
);

function detectExtension(fileBuffer: Buffer): "xls" | "xlsx" | null {
  if (
    fileBuffer[0] === 0x50 &&
    fileBuffer[1] === 0x4b &&
    fileBuffer[2] === 0x03 &&
    fileBuffer[3] === 0x04
  ) {
    return "xlsx";
  }
  if (
    fileBuffer[0] === 0xd0 &&
    fileBuffer[1] === 0xcf &&
    fileBuffer[2] === 0x11 &&
    fileBuffer[3] === 0xe0
  ) {
    return "xls";
  }
  return null;
}

/** Native Excel COM export — highest fidelity on Windows when Excel is installed. */
export async function tryExportWithExcel(
  fileBuffer: Buffer
): Promise<Buffer | null> {
  if (process.platform !== "win32") {
    return null;
  }

  const extension = detectExtension(fileBuffer);
  if (!extension) {
    return null;
  }

  const tmpDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "pdf-doctor-excel-pdf-")
  );
  const inputPath = path.join(tmpDir, `input.${extension}`);
  const outputPath = path.join(tmpDir, "output.pdf");

  try {
    await fs.writeFile(inputPath, fileBuffer);

    const { stdout, stderr } = await execFileAsync(
      "cscript",
      ["//Nologo", EXCEL_EXPORT_SCRIPT, inputPath, outputPath],
      { timeout: 300_000, windowsHide: true }
    );

    const combined = `${stdout}\n${stderr}`.trim();
    if (!combined.includes("OK")) {
      console.warn("[excel-com] VBScript did not output OK:", combined);
      return null;
    }

    const pdfBuffer = await fs.readFile(outputPath);
    return pdfBuffer.length > 0 ? pdfBuffer : null;
  } catch (err) {
    console.warn("[excel-com] Failed:", err instanceof Error ? err.message : err);
    return null;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
