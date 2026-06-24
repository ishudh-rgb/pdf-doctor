import fs from "node:fs";

const files = [
  "src/app/(tools)/merge-pdf/page.tsx",
  "src/app/(tools)/compress-pdf/page.tsx",
  "src/app/(tools)/unlock-pdf/page.tsx",
  "src/app/(tools)/protect-pdf/page.tsx",
  "src/app/(tools)/rotate-pdf/page.tsx",
  "src/app/(tools)/split-pdf/page.tsx",
  "src/app/(tools)/delete-pdf/page.tsx",
  "src/app/(tools)/sign-pdf/page.tsx",
  "src/app/(tools)/extract-pdf/page.tsx",
  "src/app/(tools)/edit-pdf/page.tsx",
  "src/app/(tools)/jpg-to-pdf/page.tsx",
  "src/app/(tools)/add-watermark/page.tsx",
  "src/app/(tools)/word-to-pdf/page.tsx",
  "src/components/tools/pdf-to-word-tool-page.tsx",
];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log("skip missing", file);
    continue;
  }
  let c = fs.readFileSync(file, "utf8");
  if (c.includes("fileInputRef={fileInputRef}")) {
    console.log("already done", file);
    continue;
  }
  const inputMatch = c.match(/<input[\s\S]*?ref=\{fileInputRef\}[\s\S]*?\/>/);
  if (!inputMatch) {
    console.log("no input", file);
    continue;
  }
  const inputBlock = inputMatch[0];
  let accept = "";
  const acceptM =
    inputBlock.match(/accept=\{['"]([^'"]+)['"]\}/) ||
    inputBlock.match(/accept="([^"]+)"/);
  if (acceptM) accept = acceptM[1];
  const multiple = /\smultiple[\s/>]/.test(inputBlock);
  const onChangeM = inputBlock.match(/onChange=\{([\s\S]*?)\}\s*\/>/);
  const onChange = onChangeM ? onChangeM[1].trim() : "() => {}";
  const extra = [
    "fileInputRef={fileInputRef}",
    accept ? `fileInputAccept="${accept}"` : "",
    multiple ? "fileInputMultiple" : "",
    `onFileInputChange={${onChange}}`,
  ]
    .filter(Boolean)
    .map((line) => `            ${line}`)
    .join("\n");

  c = c.replace(inputBlock, "");
  const replaced = c.replace(
    "onChooseFiles={() => fileInputRef.current?.click()}",
    `onChooseFiles={() => fileInputRef.current?.click()}\n${extra}`
  );
  if (replaced === c) {
    console.log("no dropzone hook", file);
    continue;
  }
  fs.writeFileSync(file, replaced);
  console.log("updated", file);
}
