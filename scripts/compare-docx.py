#!/usr/bin/env python3
"""Compare two DOCX files for structure metrics."""
from __future__ import annotations

import re
import sys
import zipfile


def analyze(path: str) -> dict:
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8", errors="ignore")

    texts = re.findall(r"<w:t[^>]*>([^<]*)</w:t>", xml)
    return {
        "path": path,
        "size": __import__("os").path.getsize(path),
        "tables": xml.count("<w:tbl>"),
        "rows": xml.count("<w:tr>"),
        "drawings": xml.count("<w:drawing"),
        "paragraphs": xml.count("<w:p "),
        "chars": sum(len(t) for t in texts),
        "sample": " | ".join(texts[:12]),
        "ligature_hits": sum(
            1
            for t in texts
            if re.search(r"(?<=[A-Za-z]) (ffi?|ff|fi|fl|ffl) (?=[a-z])", t, re.I)
        ),
    }


def main() -> int:
    if len(sys.argv) < 3:
        print("Usage: compare-docx.py <a.docx> <b.docx>")
        return 1

    for path in sys.argv[1:]:
        m = analyze(path)
        print("\n===", path, "===")
        for k, v in m.items():
            if k != "sample":
                print(f"{k}: {v}")
        print("sample:", m["sample"][:200])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
