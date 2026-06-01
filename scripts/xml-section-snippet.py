#!/usr/bin/env python3
import re
import sys
import zipfile


def snippet(xml: str, marker: str, radius: int = 2500) -> str:
    i = xml.find(marker)
    if i < 0:
        return f"[NOT FOUND: {marker}]"
    chunk = xml[i : i + radius]
    chunk = re.sub(r">\s+<", ">\n<", chunk)
    return chunk


def summarize_section(path: str, marker: str) -> None:
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8", errors="ignore")
    part = snippet(xml, marker)
    tbl = part.count("<w:tbl>")
    num = part.count("<w:numPr>")
    p = part.count("<w:p>")
    print(f"\n{'='*60}\n{path}\nMarker: {marker}")
    print(f"  tbl={tbl} numPr={num} paragraphs~={p}")
    # show first 1200 chars cleaned
    text_bits = re.findall(r"<w:t[^>]*>([^<]*)</w:t>", part[:4000])
    print("  text preview:", " | ".join(text_bits[:15]))


if __name__ == "__main__":
    ref, our = sys.argv[1], sys.argv[2]
    for marker in [
        "1. Problem Statement",
        "8. Marketing Model",
        "Chief Growth Officer",
        "6. SWOT Analysis",
    ]:
        summarize_section(ref, marker)
        summarize_section(our, marker)
