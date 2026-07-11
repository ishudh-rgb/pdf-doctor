import { spawn } from "node:child_process";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/** Tools using LibreOffice via this module:
 *  - PDF → Word  (writer_pdf_import → docx)
 *  - Word → PDF  (doc/docx/odt → pdf)
 *  - Excel → PDF (xls/xlsx/ods → pdf)
 *  - PPT → PDF   (ppt/pptx/odp → pdf)
 */

function resolveSofficePaths(): string[] {
  const candidates: string[] = [];
  const fromEnv = process.env.LIBREOFFICE_PATH?.trim();
  if (fromEnv) candidates.push(fromEnv);

  if (process.platform === "win32") {
    candidates.push(
      "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
      "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe"
    );
  } else if (process.platform === "darwin") {
    candidates.push("/Applications/LibreOffice.app/Contents/MacOS/soffice");
  } else {
    candidates.push("/usr/bin/soffice", "/usr/local/bin/soffice");
  }

  return candidates.filter(Boolean);
}

let cachedSoffice: string | null | undefined;

export function resolveLibreOfficeBinary(): string | null {
  if (cachedSoffice !== undefined) return cachedSoffice;

  for (const candidate of resolveSofficePaths()) {
    try {
      if (fs.existsSync(candidate)) {
        cachedSoffice = candidate;
        return cachedSoffice;
      }
    } catch {
      // continue
    }
  }

  cachedSoffice = null;
  return null;
}

export function isLibreOfficeAvailable(): boolean {
  return resolveLibreOfficeBinary() !== null;
}

/** @deprecated Use isLibreOfficeAvailable */
export function isLibreOfficePdfToDocxAvailable(): boolean {
  return isLibreOfficeAvailable();
}

const EXTENSION_FROM_NAME: Record<string, string> = {
  doc: ".doc",
  docx: ".docx",
  odt: ".odt",
  rtf: ".rtf",
  xls: ".xls",
  xlsx: ".xlsx",
  ods: ".ods",
  csv: ".csv",
  ppt: ".ppt",
  pptx: ".pptx",
  odp: ".odp",
  pdf: ".pdf",
};

export function extensionFromFileName(fileName?: string): string | null {
  if (!fileName) return null;
  const ext = path.extname(fileName).replace(/^\./, "").toLowerCase();
  return EXTENSION_FROM_NAME[ext] ?? (ext ? `.${ext}` : null);
}

export function sniffOfficeExtension(buffer: Buffer, fileName?: string): string {
  const fromName = extensionFromFileName(fileName);
  if (fromName) return fromName;

  const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b;
  const isOle = buffer[0] === 0xd0 && buffer[1] === 0xcf;

  if (isZip) {
    const probe = buffer.subarray(0, Math.min(buffer.length, 16_000)).toString("latin1");
    if (probe.includes("word/")) return ".docx";
    if (probe.includes("xl/") || probe.includes("worksheets/")) return ".xlsx";
    if (probe.includes("ppt/") || probe.includes("slides/")) return ".pptx";
    if (probe.includes("opendocument.text")) return ".odt";
    if (probe.includes("opendocument.spreadsheet")) return ".ods";
    if (probe.includes("opendocument.presentation")) return ".odp";
    return ".docx";
  }

  if (isOle) return ".doc";
  return ".docx";
}

export type LibreOfficeConvertOptions = {
  buffer?: Buffer;
  inputPath?: string;
  fileName?: string;
  extension?: string;
  convertTo: string;
  infilter?: string;
  outputPath?: string;
  timeoutMs?: number;
};

function runSoffice(
  soffice: string,
  inputPath: string,
  outDir: string,
  convertTo: string,
  timeoutMs: number,
  infilter?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "--headless",
      "--norestore",
      "--nologo",
      "--nofirststartwizard",
      ...(infilter ? [`--infilter=${infilter}`] : []),
      "--convert-to",
      convertTo,
      "--outdir",
      outDir,
      inputPath,
    ];

    const child = spawn(soffice, args, { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });

    let stderr = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`LibreOffice timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(stderr.trim() || `LibreOffice exited with code ${code}`));
        return;
      }
      resolve();
    });
  });
}

function producedOutputPath(inputPath: string, outDir: string, convertTo: string): string {
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const ext = convertTo.includes(":") ? convertTo.split(":")[0] : convertTo;
  const normalizedExt = ext.startsWith(".") ? ext : `.${ext}`;
  return path.join(outDir, `${baseName}${normalizedExt}`);
}

/**
 * Headless LibreOffice conversion (Office↔PDF/DOCX/etc).
 * Returns output buffer, or void when outputPath is set (disk-only mode).
 */
export async function libreOfficeConvert(
  options: LibreOfficeConvertOptions
): Promise<Buffer | void> {
  const soffice = resolveLibreOfficeBinary();
  if (!soffice) return undefined;

  const timeoutMs = options.timeoutMs ?? 180_000;
  const tmpDir =
    options.inputPath && options.outputPath
      ? path.dirname(options.inputPath)
      : await fsPromises.mkdtemp(path.join(os.tmpdir(), "pdfdoctor-lo-"));
  const ownsTmpDir = !options.inputPath;

  const extension =
    options.extension ??
    (options.buffer
      ? sniffOfficeExtension(options.buffer, options.fileName)
      : extensionFromFileName(options.fileName) ?? ".bin");

  const inputPath =
    options.inputPath ?? path.join(tmpDir, `input${extension.startsWith(".") ? extension : `.${extension}`}`);

  try {
    if (options.buffer && !options.inputPath) {
      await fsPromises.writeFile(inputPath, options.buffer);
    }

    await runSoffice(
      soffice,
      inputPath,
      tmpDir,
      options.convertTo,
      timeoutMs,
      options.infilter
    );

    const producedPath = producedOutputPath(inputPath, tmpDir, options.convertTo);
    if (!fs.existsSync(producedPath)) {
      console.warn("[libreoffice-core] Expected output not found:", producedPath);
      return undefined;
    }

    if (options.outputPath) {
      if (path.resolve(producedPath) !== path.resolve(options.outputPath)) {
        await fsPromises.copyFile(producedPath, options.outputPath);
      }
      return;
    }

    return await fsPromises.readFile(producedPath);
  } catch (err) {
    console.warn("[libreoffice-core] Failed:", err instanceof Error ? err.message : err);
    return undefined;
  } finally {
    if (ownsTmpDir) {
      await fsPromises.rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}

/** Office document → PDF (Word, Excel, PowerPoint, ODF). */
export async function libreOfficeToPdf(
  fileBuffer: Buffer,
  fileName?: string,
  timeoutMs?: number
): Promise<Buffer | null> {
  const result = await libreOfficeConvert({
    buffer: fileBuffer,
    fileName,
    convertTo: "pdf",
    timeoutMs: timeoutMs ?? Math.min(300_000, 90_000 + Math.ceil(fileBuffer.length / (512 * 1024)) * 15_000),
  });
  return result?.length ? result : null;
}

/** PDF → DOCX via Writer PDF import filter. */
export async function libreOfficePdfToDocx(
  fileBuffer: Buffer,
  options: { inputPath?: string; outputPath?: string; timeoutMs?: number } = {}
): Promise<Buffer | void> {
  return libreOfficeConvert({
    buffer: options.inputPath ? undefined : fileBuffer,
    inputPath: options.inputPath,
    outputPath: options.outputPath,
    fileName: "input.pdf",
    extension: ".pdf",
    convertTo: "docx",
    infilter: "writer_pdf_import",
    timeoutMs: options.timeoutMs,
  });
}

export const LIBREOFFICE_TOOLS = [
  "pdf-to-word",
  "word-to-pdf",
  "excel-to-pdf",
  "ppt-to-pdf",
] as const;
