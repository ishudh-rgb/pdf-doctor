import fs from "node:fs";

const patches = [
  {
    file: "src/app/(tools)/delete-pdf/page.tsx",
    importFrom: "@/components/tools/tool-ui",
    addImport: "ToolHiddenFileInput",
    replace: `<input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFiles(e.target.files);
            }}
          />`,
    with: `<ToolHiddenFileInput
            ref={fileInputRef}
            accept=".pdf"
            ariaLabel="Change PDF file"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFiles(e.target.files);
            }}
          />`,
  },
  {
    file: "src/app/(tools)/extract-pdf/page.tsx",
    importFrom: "@/components/tools/tool-ui",
    addImport: "ToolHiddenFileInput",
    replace: `<input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFiles(e.target.files);
            }}
          />`,
    with: `<ToolHiddenFileInput
            ref={fileInputRef}
            accept=".pdf"
            ariaLabel="Change PDF file"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFiles(e.target.files);
            }}
          />`,
  },
  {
    file: "src/app/(tools)/split-pdf/page.tsx",
    importFrom: "@/components/tools/tool-ui",
    addImport: "ToolHiddenFileInput",
    replace: `<input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFiles(e.target.files);
            }}
          />`,
    with: `<ToolHiddenFileInput
            ref={fileInputRef}
            accept=".pdf"
            ariaLabel="Change PDF file"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFiles(e.target.files);
            }}
          />`,
  },
  {
    file: "src/app/(tools)/rotate-pdf/page.tsx",
    importFrom: "@/components/tools/tool-ui",
    addImport: "ToolHiddenFileInput",
    replace: `<input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFiles(e.target.files);
            }}
          />`,
    with: `<ToolHiddenFileInput
            ref={fileInputRef}
            accept=".pdf"
            ariaLabel="Change PDF file"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFiles(e.target.files);
            }}
          />`,
  },
];

for (const patch of patches) {
  if (!fs.existsSync(patch.file)) continue;
  let content = fs.readFileSync(patch.file, "utf8");
  if (!content.includes(patch.replace)) {
    console.log("skip pattern", patch.file);
    continue;
  }
  content = content.replace(patch.replace, patch.with);
  if (!content.includes(patch.addImport)) {
    const re = new RegExp(
      `(import\\s*\\{[^}]*)(\\}\\s*from\\s*['"]${patch.importFrom.replace("/", "\\/")}['"])`
    );
    content = content.replace(re, (m, a, b) => {
      if (a.includes(patch.addImport)) return m;
      return `${a}, ${patch.addImport}${b}`;
    });
  }
  fs.writeFileSync(patch.file, content);
  console.log("patched", patch.file);
}
