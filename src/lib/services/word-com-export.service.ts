import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const WORD_EXPORT_SCRIPT = path.join(
  process.cwd(),
  "scripts",
  "word-export-pdf.vbs"
);

function detectExtension(fileBuffer: Buffer): "doc" | "docx" | null {
  if (
    fileBuffer[0] === 0x50 &&
    fileBuffer[1] === 0x4b &&
    fileBuffer[2] === 0x03 &&
    fileBuffer[3] === 0x04
  ) {
    return "docx";
  }
  if (
    fileBuffer[0] === 0xd0 &&
    fileBuffer[1] === 0xcf &&
    fileBuffer[2] === 0x11 &&
    fileBuffer[3] === 0xe0
  ) {
    return "doc";
  }
  return null;
}

export async function tryExportWithWord(
  fileBuffer: Buffer
): Promise<Buffer | null> {
  if (process.platform !== "win32") {
    console.info("[word-com] Skipping: not Windows");
    return null;
  }

  const extension = detectExtension(fileBuffer);
  if (!extension) {
    console.info("[word-com] Skipping: unrecognized file format");
    return null;
  }

  const tmpDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "pdf-doctor-word-pdf-")
  );
  const inputPath = path.join(tmpDir, `input.${extension}`);
  const outputPath = path.join(tmpDir, "output.pdf");

  try {
    await fs.writeFile(inputPath, fileBuffer);
    console.info("[word-com] Attempting Word COM export…");

    const { stdout, stderr } = await execFileAsync(
      "cscript",
      ["//Nologo", WORD_EXPORT_SCRIPT, inputPath, outputPath],
      { timeout: 45_000, windowsHide: true }
    );

    const combined = `${stdout}\n${stderr}`.trim();
    console.info("[word-com] VBScript output:", combined);

    if (!combined.includes("OK")) {
      console.warn("[word-com] VBScript did not output OK:", combined);
      return null;
    }

    const pdfBuffer = await fs.readFile(outputPath);
    if (pdfBuffer.length > 0) {
      console.info(`[word-com] Success: ${pdfBuffer.length} bytes`);
      return pdfBuffer;
    }

    console.warn("[word-com] Output PDF is empty");
    return null;
  } catch (err) {
    console.warn("[word-com] Failed:", err instanceof Error ? err.message : err);
    return null;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
