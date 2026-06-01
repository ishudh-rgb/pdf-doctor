import { spawn } from "child_process";
import {
  postProcessDocx,
} from "@/lib/services/pdf-to-word-docx-post.service";
import fs from "fs/promises";
import os from "os";
import path from "path";

const PYTHON_CANDIDATES = ["python", "python3", "py"];

function windowsPythonPaths(): string[] {
  if (process.platform !== "win32") return [];

  const localAppData = process.env.LOCALAPPDATA ?? "";
  const programFiles = process.env.ProgramFiles ?? "C:\\Program Files";
  const paths: string[] = [];

  for (const ver of ["312", "313", "311", "310"]) {
    paths.push(path.join(localAppData, "Programs", "Python", `Python${ver}`, "python.exe"));
    paths.push(path.join(programFiles, `Python${ver}`, "python.exe"));
  }

  return paths;
}

async function resolvePythonCandidates(): Promise<string[]> {
  const fromEnv = process.env.PDF2DOCX_PYTHON?.trim();
  const list = [
    ...(fromEnv ? [fromEnv] : []),
    ...PYTHON_CANDIDATES,
    ...windowsPythonPaths(),
  ];
  return [...new Set(list)];
}

let cachedPython: string | null | undefined;

const SCRIPT_PATH = path.join(process.cwd(), "scripts", "pdf-to-docx.py");

function runCommand(
  command: string,
  args: string[],
  timeoutMs: number
): Promise<{ code: number; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "ignore", "pipe"],
      windowsHide: true,
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        OPENBLAS_NUM_THREADS: "1",
        OMP_NUM_THREADS: "1",
      },
    });

    let stderr = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`pdf2docx timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, stderr });
    });
  });
}

async function pythonWorks(command: string): Promise<boolean> {
  try {
    const result = await runCommand(command, ["--version"], 8000);
    return result.code === 0;
  } catch {
    return false;
  }
}

/** Resolve Python executable (env override, then PATH). */
export async function resolvePdf2docxPython(): Promise<string | null> {
  if (cachedPython !== undefined) return cachedPython;

  for (const candidate of await resolvePythonCandidates()) {
    if (await pythonWorks(candidate)) {
      cachedPython = candidate;
      return cachedPython;
    }
  }

  cachedPython = null;
  return null;
}

export async function isPdf2docxAvailable(): Promise<boolean> {
  const python = await resolvePdf2docxPython();
  if (!python) return false;

  try {
    const result = await runCommand(
      python,
      ["-c", "import pdf2docx"],
      10000
    );
    return result.code === 0;
  } catch {
    return false;
  }
}

/**
 * Convert PDF to DOCX using pdf2docx (PyMuPDF + python-docx).
 * Matches commercial tools (Smallpdf/iLovePDF) for layout, tables, and fonts.
 */
export async function pdfToWordPdf2docx(
  fileBuffer: Buffer,
  options: { timeoutMs?: number } = {}
): Promise<Buffer> {
  const python = await resolvePdf2docxPython();
  if (!python) {
    throw new Error("Python not found. Install Python 3 and run: pip install pdf2docx");
  }

  const timeoutMs = options.timeoutMs ?? 120_000;
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdfdoctor-pdf2docx-"));
  const pdfPath = path.join(tmpDir, "input.pdf");
  const docxPath = path.join(tmpDir, "output.docx");

  try {
    await fs.writeFile(pdfPath, fileBuffer);

    const result = await runCommand(
      python,
      [SCRIPT_PATH, pdfPath, docxPath],
      timeoutMs
    );

    if (result.code !== 0) {
      throw new Error(
        result.stderr.trim() ||
          `pdf2docx failed with exit code ${result.code}`
      );
    }

    const rawDocx = await fs.readFile(docxPath);
    return await postProcessDocx(rawDocx);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
