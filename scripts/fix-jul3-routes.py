"""Apply Jul 2-3 route diffs from backup while skipping Jul 12 upload-validation hunks."""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP = ("upload-validation", "validateSingleUpload", "uploadValidationResponse", "rawBuffers")


def git_show(ref: str, rel: str) -> str | None:
    p = subprocess.run(["git", "show", f"{ref}:{rel}"], capture_output=True, text=True)
    return p.stdout if p.returncode == 0 else None


def filtered_diff(rel: str) -> str:
    raw = subprocess.check_output(
        ["git", "diff", "ad37110", "backup/jul12-pre-undo", "--", rel],
        text=True,
        errors="replace",
    )
    out = []
    hunk = []
    for line in raw.splitlines(keepends=True):
        if line.startswith("diff ") or line.startswith("index ") or line.startswith("---") or line.startswith("+++"):
            if hunk:
                body = "".join(hunk)
                if not any(s in body for s in SKIP):
                    out.extend(hunk)
                hunk = []
            out.append(line)
            continue
        if line.startswith("@@"):
            if hunk:
                body = "".join(hunk)
                if not any(s in body for s in SKIP):
                    out.extend(hunk)
            hunk = [line]
        else:
            if hunk is not None:
                hunk.append(line)
    if hunk:
        body = "".join(hunk)
        if not any(s in body for s in SKIP):
            out.extend(hunk)
    return "".join(out)


routes = list((ROOT / "src/app/api/tools").rglob("route.ts")) + [
    ROOT / "src/app/api/ai/summarize/route.ts"
]

for fp in routes:
    rel = fp.relative_to(ROOT).as_posix()
    base = git_show("ad37110", rel)
    if base is None:
        continue
    patch = filtered_diff(rel)
    if not patch.strip():
        fp.write_text(base, encoding="utf-8")
        continue
    proc = subprocess.run(
        ["git", "apply", "--3way", "-"],
        input=base + "\n" + patch,
        text=True,
        capture_output=True,
        cwd=ROOT,
    )
    if proc.returncode != 0:
        # fallback: write backup then strip upload-validation manually
        backup = git_show("backup/jul12-pre-undo", rel)
        if backup:
            backup = backup.replace(
                'import { validateSingleUpload, uploadValidationResponse } from "@/lib/server/upload-validation";\n',
                'import { isValidFileType, validateFileSize } from "@/lib/utils/file";\n',
            )
            fp.write_text(backup, encoding="utf-8")
            print("fallback backup", rel)
        continue
    print("patched", rel)

print("routes done")
