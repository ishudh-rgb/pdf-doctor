"""Strip upload-validation from tool routes (Jul 12 undo)."""
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def git_show(ref: str, rel: str) -> str:
    return subprocess.check_output(
        ["git", "show", f"{ref}:{rel}"], text=True, errors="replace"
    )


INLINE_SINGLE = '''
    if (!isValidFileType(file, {cats})) {{
      return NextResponse.json(
        {{ error: {type_msg} }},
        {{ status: 400 }}
      );
    }}

    const sizeCheck = validateFileSize(file, maxSizeMB);
    if (!sizeCheck.valid) {{
      return NextResponse.json({{ error: sizeCheck.message }}, {{ status: 400 }});
    }}

    const fileBuffer = Buffer.from(await file.arrayBuffer());
'''

routes = list((ROOT / "src/app/api/tools").rglob("route.ts")) + [
    ROOT / "src/app/api/ai/summarize/route.ts"
]

for fp in routes:
    rel = fp.relative_to(ROOT).as_posix()
    text = git_show("backup/jul12-pre-undo", rel)
    if "upload-validation" not in text:
        fp.write_text(text, encoding="utf-8")
        continue

    text = text.replace(
        'import { validateSingleUpload, uploadValidationResponse } from "@/lib/server/upload-validation";\n',
        'import { isValidFileType, validateFileSize } from "@/lib/utils/file";\n',
    )

    # merge-pdf multi-file
    if "rawBuffers" in text:
        text = re.sub(
            r"const rawBuffers: Buffer\[\] = \[\];\s*for \(const file of files\) \{[\s\S]*?rawBuffers\.push\(validated\.buffer\);\s*\}\s*",
            """for (const file of files) {
      if (!isValidFileType(file, ["pdf"])) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only PDF files are accepted.` },
          { status: 400 }
        );
      }

      const sizeCheck = validateFileSize(file, maxSizeMB);
      if (!sizeCheck.valid) {
        return NextResponse.json({ error: sizeCheck.message }, { status: 400 });
      }
    }

""",
            text,
            count=1,
        )
        text = text.replace(
            "const raw = rawBuffers[index];",
            "const raw = Buffer.from(await file.arrayBuffer());",
        )
    else:
        m = re.search(
            r'const validated = await validateSingleUpload\(file, (\[[^\]]+\]), maxSizeMB\);[\s\S]*?return uploadValidationResponse\(validated\);\s*\}\s*',
            text,
        )
        if m:
            cats = m.group(1)
            type_msg = '"Invalid file type. Only PDF files are accepted."'
            if '"image"' in cats or '"jpg"' in cats:
                type_msg = '"Invalid file type. Only image files are accepted."'
            elif '"word"' in cats or '"docx"' in cats:
                type_msg = '"Invalid file type. Only Word documents are accepted."'
            elif '"html"' in cats:
                type_msg = '"Invalid file type. Only HTML files are accepted."'
            elif '"text"' in cats or '"txt"' in cats:
                type_msg = '"Invalid file type. Only text files are accepted."'
            repl = INLINE_SINGLE.format(cats=cats, type_msg=type_msg)
            text = text[: m.start()] + repl + text[m.end() :]
            text = text.replace("validated.buffer", "fileBuffer")

    fp.write_text(text, encoding="utf-8")
    print("fixed", rel)

print("done")
