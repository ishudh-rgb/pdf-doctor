import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const EMF_SCRIPT = `
param([string]$EmfPath, [string]$PngPath)
Add-Type -AssemblyName System.Drawing
$meta = New-Object System.Drawing.Imaging.Metafile($EmfPath)
$bmp = New-Object System.Drawing.Bitmap($meta.Width, $meta.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::White)
$g.DrawImage($meta, 0, 0)
$bmp.Save($PngPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose(); $meta.Dispose()
Write-Output 'OK'
`.trim();

export async function convertEmfToPngDataUrl(emfBuffer: Buffer): Promise<string | null> {
  if (process.platform !== "win32") return null;

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdf-doctor-emf-"));
  const emfPath = path.join(tmpDir, "image.emf");
  const pngPath = path.join(tmpDir, "image.png");
  const psPath = path.join(tmpDir, "convert-emf.ps1");

  try {
    await fs.writeFile(emfPath, emfBuffer);
    await fs.writeFile(psPath, EMF_SCRIPT, "utf8");

    const { stdout } = await execFileAsync(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", psPath, emfPath, pngPath],
      { timeout: 30_000, windowsHide: true }
    );

    if (!stdout.includes("OK")) return null;

    const pngBuffer = await fs.readFile(pngPath);
    return `data:image/png;base64,${pngBuffer.toString("base64")}`;
  } catch {
    return null;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
