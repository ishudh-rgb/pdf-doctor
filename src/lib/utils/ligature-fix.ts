/** Fix PDF ligature artifacts: "pro fi t" -> "profit", "O ffi cer" -> "Officer" */
export function fixLigatureArtifacts(text: string): string {
  return text
    .replace(/(?<=[A-Za-z]) ffi (?=[a-z])/gi, "ffi")
    .replace(/(?<=[A-Za-z]) ff (?=[a-z])/gi, "ff")
    .replace(/(?<=[A-Za-z]) fi (?=[a-z])/gi, "fi")
    .replace(/(?<=[A-Za-z]) fl (?=[a-z])/gi, "fl")
    .replace(/(?<=[A-Za-z]) ffl (?=[a-z])/gi, "ffl")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Collapse broken hyphenation across line breaks in extracted text. */
export function fixBrokenHyphenation(text: string): string {
  return text.replace(/(\w)-\s+(\w)/g, "$1$2");
}

/** Fix ligatures when PDF split them across fragments (handles start-of-word too). */
export function fixSplitLigatures(text: string): string {
  return text
    .replace(/\b([A-Za-z]) fi (?=[a-z])/g, "$1fi")
    .replace(/\b([A-Za-z]) fl (?=[a-z])/g, "$1fl")
    .replace(/\b([A-Za-z]) ff (?=[a-z])/g, "$1ff")
    .replace(/\b([A-Za-z]) ffi (?=[a-z])/g, "$1ffi")
    .replace(/\b([A-Za-z]) ffl (?=[a-z])/g, "$1ffl");
}

export function cleanDocxText(text: string): string {
  return fixLigatureArtifacts(
    fixSplitLigatures(fixBrokenHyphenation(text))
  ).replace(/[ \t]{2,}/g, " ");
}
