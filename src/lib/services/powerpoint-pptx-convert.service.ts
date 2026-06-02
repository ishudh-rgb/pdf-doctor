import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const SAVE_PPTX_SCRIPT = path.join(process.cwd(), "scripts", "ppt-save-as-pptx.vbs");

export async function tryConvertLegacyPptToPptx(fileBuffer: Buffer): Promise<Buffer | null> {
  if (process.platform !== "win32") return null;

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdf-doctor-ppt-"));
  const inputPath = path.join(tmpDir, "input.ppt");
  const outputPath = path.join(tmpDir, "output.pptx");

  try {
    await fs.writeFile(inputPath, fileBuffer);

    const { stdout, stderr } = await execFileAsync(
      "cscript",
      ["//Nologo", SAVE_PPTX_SCRIPT, inputPath, outputPath],
      { timeout: 120_000, windowsHide: true }
    );

    const combined = `${stdout}\n${stderr}`.trim();
    if (!combined.includes("OK")) {
      return null;
    }

    return await fs.readFile(outputPath);
  } catch {
    return null;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
