import { createRequire } from "module";
import path from "path";
import { pathToFileURL } from "url";

const require = createRequire(import.meta.url);

function dirToPdfjsUrl(...segments: string[]) {
  const abs = path.resolve(...segments);
  return pathToFileURL(abs).href.replace(/\/?$/, "/");
}

/** pdf.js asset dirs as file:// URLs with trailing slash */
export function getPdfjsAssetDirs() {
  let pkgRoot: string;
  try {
    pkgRoot = path.dirname(require.resolve("pdfjs-dist/package.json"));
  } catch {
    pkgRoot = path.join(process.cwd(), "node_modules", "pdfjs-dist");
  }

  return {
    standardFontDataUrl: dirToPdfjsUrl(pkgRoot, "standard_fonts"),
    cMapUrl: dirToPdfjsUrl(pkgRoot, "cmaps"),
  };
}
