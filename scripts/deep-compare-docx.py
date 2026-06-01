#!/usr/bin/env python3
"""Deep structural comparison: Smallpdf reference vs DrPDF output."""
from __future__ import annotations

import re
import sys
import zipfile
from collections import Counter
from pathlib import Path


def read_docx(path: str) -> tuple[str, list[str]]:
    with zipfile.ZipFile(path) as z:
        names = z.namelist()
        xml = z.read("word/document.xml").decode("utf-8", errors="ignore")
    return xml, names


def para_texts(xml: str) -> list[str]:
    paras: list[str] = []
    for block in re.findall(r"<w:p\b[\s\S]*?</w:p>", xml):
        if "<w:tbl" in block:
            continue
        parts = re.findall(r"<w:t[^>]*>([^<]*)</w:t>", block)
        text = "".join(parts).strip()
        if text:
            paras.append(text)
    return paras


def table_count(xml: str) -> int:
    return xml.count("<w:tbl>")


def metrics(path: str) -> dict:
    xml, names = read_docx(path)
    texts = para_texts(xml)
    all_t = re.findall(r"<w:t[^>]*>([^<]*)</w:t>", xml)
    return {
        "path": path,
        "size": Path(path).stat().st_size,
        "media": len([n for n in names if n.startswith("word/media/")]),
        "drawings": xml.count("<w:drawing"),
        "tables": table_count(xml),
        "rows": xml.count("<w:tr>"),
        "numPr": xml.count("<w:numPr"),
        "framePr": xml.count("framePr"),
        "centerJc": len(re.findall(r'<w:jc w:val="center"', xml)),
        "leftJc": len(re.findall(r'<w:jc w:val="left"', xml)),
        "listStyle": xml.count('w:val="ListParagraph"'),
        "headingLike": sum(1 for t in texts if re.match(r"^\d+\.\s+\S", t)),
        "paras": len(texts),
        "chars": sum(len(t) for t in all_t),
        "artifacts": {
            "::": "".join(all_t).count("::"),
            ".:": "".join(all_t).count(".:"),
            "empty bullet": len(re.findall(r"^[\s.:·•]+$", "".join(all_t))),
        },
        "whiteShd": len(re.findall(r'w:shd[^>]*w:fill="FFFFFF"', xml, re.I)),
        "hasNumbering": "word/numbering.xml" in names,
        "hasStyles": "word/styles.xml" in names,
    }


def section_paras(texts: list[str], start: str, end: str | None = None) -> list[str]:
    out: list[str] = []
    capture = False
    for t in texts:
        if start in t:
            capture = True
            out.append(t)
            continue
        if capture and end and t.startswith(end):
            break
        if capture:
            out.append(t)
    return out


def compare_text_lists(a: list[str], b: list[str], label: str) -> None:
    print(f"\n### {label}")
    print(f"Smallpdf paras: {len(a)} | DrPDF paras: {len(b)}")
    max_n = max(len(a), len(b))
    diffs = 0
    for i in range(max_n):
        sa = a[i] if i < len(a) else "[MISSING]"
        sb = b[i] if i < len(b) else "[MISSING]"
        if sa != sb:
            diffs += 1
            if diffs <= 8:
                print(f"  [{i+1}] REF: {sa[:100]}")
                print(f"  [{i+1}] OUR: {sb[:100]}")
    print(f"  mismatched lines: {diffs}/{max_n}")


def main() -> None:
    if len(sys.argv) != 3:
        print("Usage: deep-compare-docx.py <smallpdf.docx> <drpdf.docx>")
        sys.exit(1)

    ref_path, our_path = sys.argv[1], sys.argv[2]
    ref_xml, _ = read_docx(ref_path)
    our_xml, _ = read_docx(our_path)
    ref_texts = para_texts(ref_xml)
    our_texts = para_texts(our_xml)

    ref_m = metrics(ref_path)
    our_m = metrics(our_path)

    print("=" * 70)
    print("METRICS COMPARISON")
    print("=" * 70)
    keys = [
        "size", "media", "drawings", "tables", "rows", "numPr", "framePr",
        "centerJc", "leftJc", "listStyle", "headingLike", "paras", "chars",
        "whiteShd", "hasNumbering", "hasStyles",
    ]
    for k in keys:
        print(f"  {k:12} REF={ref_m[k]!s:8} OUR={our_m[k]!s}")

    print(f"  artifacts    REF={ref_m['artifacts']} OUR={our_m['artifacts']}")

    # duplicate detection in our output
    our_counter = Counter(our_texts)
    dups = [(t, c) for t, c in our_counter.items() if c > 2 and len(t) > 20]
    print(f"\nOUR duplicate paragraphs (>2 repeats): {len(dups)}")
    for t, c in sorted(dups, key=lambda x: -x[1])[:5]:
        print(f"  x{c}: {t[:80]}")

    sections = [
        ("1. Problem", "1. Problem Statement", "2. Solution"),
        ("2. Solution", "2. Solution", "3. Product"),
        ("6. SWOT", "6. SWOT Analysis", "Suggested response"),
        ("5. Price", "5. Price Market Gap", "6. SWOT"),
        ("8. Marketing", "8. Marketing Model", "9. Sales"),
        ("KRA", "Chief Growth Officer", "23."),
    ]

    for label, start, end in sections:
        compare_text_lists(
            section_paras(ref_texts, start, end),
            section_paras(our_texts, start, end),
            label,
        )

    # Style mismatch: ref uses tables where we use paras or vice versa
    print("\n### STRUCTURAL GUESS")
    if our_m["tables"] < ref_m["tables"]:
        print(f"  - DrPDF has FEWER tables ({our_m['tables']} vs {ref_m['tables']})")
    if our_m["numPr"] < ref_m["numPr"] * 0.6:
        print(f"  - DrPDF has far fewer native Word lists ({our_m['numPr']} vs {ref_m['numPr']})")
    if our_m["centerJc"] > ref_m["centerJc"] + 5:
        print(f"  - DrPDF still has more center alignment ({our_m['centerJc']} vs {ref_m['centerJc']})")
    if our_m["size"] > ref_m["size"] * 2:
        print(f"  - DrPDF file much larger ({our_m['size']} vs {ref_m['size']} bytes)")


if __name__ == "__main__":
    main()
