#!/usr/bin/env python3
"""Compare key sections between Smallpdf reference and DrPDF output."""
from __future__ import annotations

import re
import sys
import zipfile


def extract_text(path: str) -> str:
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8", errors="ignore")
    parts = re.findall(r"<w:t[^>]*>([^<]*)</w:t>", xml)
    return "".join(parts)


def section(text: str, start: str, end: str | None = None, limit: int = 1200) -> str:
    idx = text.find(start)
    if idx < 0:
        return f"[MISSING: {start}]"
    chunk = text[idx:]
    if end:
        end_idx = chunk.find(end, len(start))
        if end_idx > 0:
            chunk = chunk[:end_idx]
    return chunk[:limit]


def check_artifacts(text: str) -> dict[str, int]:
    return {
        "::": text.count("::"),
        ".:": text.count(".:"),
        "drawing": text.count("drawing"),
    }


def analyze(path: str) -> None:
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8", errors="ignore")
        media = len([n for n in z.namelist() if n.startswith("word/media/")])

    text = extract_text(path)
    print(f"\n{'=' * 60}\nFILE: {path}")
    print(
        f"size={__import__('os').path.getsize(path)} media={media} "
        f"tbl={xml.count('<w:tbl>')} numPr={xml.count('<w:numPr>')} "
        f"drawings={xml.count('<w:drawing')}"
    )
    print("artifacts", check_artifacts(text))
    for label, start, end in [
        ("Problem", "1. Problem", "2. Solution"),
        ("SWOT", "6. SWOT Analysis", "Suggested response"),
        ("Price Gap", "5. Price Market Gap", "6. SWOT"),
        ("KRA", "22. CO-FOUNDER KRA", "23."),
    ]:
        print(f"\n--- {label} ---")
        print(section(text, start, end, 900))


if __name__ == "__main__":
    for p in sys.argv[1:]:
        analyze(p)
