export async function tryConvertWithLibreOffice(fileBuffer: Buffer): Promise<Buffer | null> {
  const sofficePaths =
    process.platform === "win32"
      ? [
          process.env.LIBREOFFICE_PATH,
          "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
          "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
        ].filter((value): value is string => Boolean(value))
      : [];

  for (const sofficePath of sofficePaths) {
    try {
      const fs = await import("node:fs");
      if (!fs.existsSync(sofficePath)) continue;
      process.env.LIBREOFFICE_PROGRAM = sofficePath.replace(/soffice\.exe$/i, "");
    } catch {
      // Continue with default lookup.
    }
  }

  try {
    const libre = await import("libreoffice-convert");
    const convert = libre.default.convert as (
      buffer: Buffer,
      format: string,
      filter: undefined,
      callback: (err: Error | null, result: Buffer) => void
    ) => void;

    return await new Promise<Buffer | null>((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        console.warn("[libreoffice] Timed out after 30s");
        resolve(null);
      }, 30_000);

      convert(fileBuffer, ".pdf", undefined, (err, result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (err) {
          console.warn("[libreoffice] Failed:", err.message);
          resolve(null);
          return;
        }
        resolve(result);
      });
    });
  } catch {
    return null;
  }
}
