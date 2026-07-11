#!/usr/bin/env python3
"""Add toolJsonError + correlationId to tool/AI route error responses."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIRS = [
    ROOT / "src" / "app" / "api" / "tools",
    ROOT / "src" / "app" / "api" / "ai",
]

IMPORT_LINE = 'import { toolJsonError } from "@/lib/server/tool-api-error";\n'

# NextResponse.json({ error: "msg" }, { status: N }) -> toolJsonError(request, "msg", N)
JSON_ERROR_RE = re.compile(
    r"return\s+NextResponse\.json\(\s*\{\s*error:\s*([^,}]+(?:\{[^}]*\}[^,}]*)*)\s*(?:,\s*[^}]+)?\s*\}\s*,\s*\{\s*status:\s*(\d+)\s*\}\s*\)"
)

# handleToolRouteFailure(error, { -> add request
HANDLE_CTX_RE = re.compile(
    r"handleToolRouteFailure\(\s*(\w+)\s*,\s*\{"
)


def ensure_import(text: str) -> str:
    if "toolJsonError" in text:
        return text
    marker = 'from "next/server";\n'
    if marker in text:
        return text.replace(marker, marker + IMPORT_LINE, 1)
    return IMPORT_LINE + text


def patch_handle_context(text: str) -> str:
    if "request," in text and "handleToolRouteFailure" in text:
        # may already be patched in some files
        pass

    def repl(match: re.Match[str]) -> str:
        snippet = match.group(0)
        if "request:" in snippet or "request," in snippet:
            return snippet
        return snippet.replace("{", "{ request, ", 1)

    return HANDLE_CTX_RE.sub(repl, text)


def patch_json_errors(text: str) -> str:
    def repl(match: re.Match[str]) -> str:
        msg = match.group(1).strip()
        status = match.group(2)
        return f"return toolJsonError(request, {msg}, {status})"

    return JSON_ERROR_RE.sub(repl, text)


def patch_file(path: Path) -> bool:
    if path.name.endswith(".test.ts"):
        return False
    original = path.read_text(encoding="utf-8")
    if "export async function" not in original and "export const" not in original:
        return False
    if "NextResponse.json({ error" not in original and "handleToolRouteFailure" not in original:
        return False

    updated = original
    if "NextResponse.json({ error" in updated:
        updated = ensure_import(updated)
        updated = patch_json_errors(updated)
    if "handleToolRouteFailure" in updated:
        updated = patch_handle_context(updated)

    if updated != original:
        path.write_text(updated, encoding="utf-8")
        return True
    return False


def main() -> None:
    changed = []
    for base in DIRS:
        for path in sorted(base.rglob("route.ts")):
            if patch_file(path):
                changed.append(path.relative_to(ROOT))
    print(f"Patched {len(changed)} files")
    for p in changed:
        print(" -", p)


if __name__ == "__main__":
    main()
