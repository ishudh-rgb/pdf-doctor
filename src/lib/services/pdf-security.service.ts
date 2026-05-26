import fs from "fs/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import muhammara, { Recipe } from "muhammara";
import { logError } from "@/lib/db/queries";

export interface PDFEncryptionAdapter {
  encrypt(fileBuffer: Buffer, password: string): Promise<Buffer>;
  decrypt(fileBuffer: Buffer, password: string): Promise<Buffer>;
}

async function withTempPdfFiles<T>(
  inputBuffer: Buffer,
  fn: (inputPath: string, outputPath: string) => Promise<T>
): Promise<T> {
  const id = randomUUID();
  const inputPath = path.join(os.tmpdir(), `pdf-doctor-in-${id}.pdf`);
  const outputPath = path.join(os.tmpdir(), `pdf-doctor-out-${id}.pdf`);

  await fs.writeFile(inputPath, inputBuffer);

  try {
    return await fn(inputPath, outputPath);
  } finally {
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
    await fs.unlink(`${outputPath}.tmp.pdf`).catch(() => {});
  }
}

export async function protectPDF(
  fileBuffer: Buffer,
  password: string,
  adapter?: PDFEncryptionAdapter
): Promise<Buffer> {
  if (!password || password.length < 1) {
    throw new Error("Password is required to protect a PDF.");
  }

  try {
    if (adapter) {
      return adapter.encrypt(fileBuffer, password);
    }

    return await withTempPdfFiles(fileBuffer, async (inputPath, outputPath) => {
      const pdfDoc = new Recipe(inputPath, outputPath);
      pdfDoc.encrypt({
        userPassword: password,
        ownerPassword: password,
        userProtectionFlag: 4,
      });
      pdfDoc.endPDF();
      return fs.readFile(outputPath);
    });
  } catch (err) {
    await logError({
      tool_name: "protect-pdf",
      error_type: "PROTECT_FAILED",
      error_message: err instanceof Error ? err.message : String(err),
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
    throw new Error(
      `Failed to protect PDF: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}

export async function unlockPDF(
  fileBuffer: Buffer,
  password: string,
  adapter?: PDFEncryptionAdapter
): Promise<Buffer> {
  if (!password) {
    throw new Error("Password is required to unlock a PDF.");
  }

  try {
    if (adapter) {
      return adapter.decrypt(fileBuffer, password);
    }

    return await withTempPdfFiles(fileBuffer, async (inputPath, outputPath) => {
      muhammara.recrypt(inputPath, outputPath, {
        password,
        userPassword: "",
        ownerPassword: "",
      });
      return fs.readFile(outputPath);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (
      message.toLowerCase().includes("password") ||
      message.toLowerCase().includes("encrypted") ||
      message.toLowerCase().includes("decrypt")
    ) {
      throw new Error("Incorrect password. Please try again.");
    }

    await logError({
      tool_name: "unlock-pdf",
      error_type: "UNLOCK_FAILED",
      error_message: message,
      stack_trace: err instanceof Error ? err.stack : undefined,
    });
    throw new Error(`Failed to unlock PDF: ${message}`);
  }
}
