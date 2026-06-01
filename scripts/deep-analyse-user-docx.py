#!/usr/bin/env python3
"""Deep diff: DrPDF output vs Smallpdf reference."""
from __future__ import annotations

import re
import sys
import zipfile
from collections import Counter
from pathlib import Path


def load(path: str) -> tuple[str, dict]:
    with zipfile.ZipFile(path) as z:
        names = z.namelist()
        xml = z.read("word/document.xml").decode("utf-8", errors="ignore")
    return xml, {"names": names, "size": Path(path).stat().st_size}


def all_text(xml: str) -> str:
    return "".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", xml))


def body_paras(xml: str) -> list[str]:
    out: list[str] = []
    for block in re.findall(r"<w:p\b[\s\S]*?</w:p>", xml):
        if "<w:tbl" in block:
            continue
        t = "".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", block)).strip()
        if t:
            out.append(t)
    return out


def table_summaries(xml: str) -> list[str]:
    summaries = []
    for tbl in re.findall(r"<w:tbl>[\s\S]*?</w:tbl>", xml):
        texts = [t.strip() for t in re.findall(r"<w:t[^>]*>([^<]*)</w:t>", tbl) if t.strip()]
        rows = tbl.count("<w:tr>")
        cols = tbl.count("<w:gridCol")
        label = " ".join(texts[:6])[:100]
        summaries.append(f"r{rows}c{cols}: {label}")
    return summaries


def metrics(path: str) -> dict:
    xml, meta = load(path)
    text = all_text(xml)
    return {
        "path": Path(path).name,
        "size": meta["size"],
        "media": len([n for n in meta["names"] if n.startswith("word/media/")]),
        "drawings": xml.count("<w:drawing"),
        "tables": xml.count("<w:tbl>"),
        "numPr": xml.count("<w:numPr"),
        "framePr": xml.count("framePr"),
        "centerJc": len(re.findall(r'<w:jc w:val="center"', xml)),
        "paras": len(body_paras(xml)),
        "chars": len(text),
        "artifacts": text.count("::") + text.count(".:"),
        "ligature_splits": len(re.findall(r"\w\s+\w\s+\w", text[:5000])),
    }


def section(paras: list[str], start: str, end: str | None = None) -> list[str]:
    out: list[str] = []
    on = False
    for p in paras:
        if start in p:
            on = True
            out.append(p)
            continue
        if on and end and (p.startswith(end) or p == end):
            break
        if on:
            out.append(p)
    return out


def compare_lists(a: list[str], b: list[str], title: str, limit: int = 15) -> list[str]:
    lines = [f"\n## {title}  (ref={len(a)} our={len(b)})"]
    n = max(len(a), len(b))
    bad = 0
    for i in range(n):
        ra = a[i] if i < len(a) else "[MISSING]"
        rb = b[i] if i < len(b) else "[MISSING]"
        if ra != rb:
            bad += 1
            if bad <= limit:
                lines.append(f"  L{i+1} REF: {ra[:110]}")
                lines.append(f"  L{i+1} OUR: {rb[:110]}")
    lines.append(f"  >> mismatches: {bad}/{n}")
    return lines


def first_copy_tables(summaries: list[str], per_copy: int = 13) -> list[str]:
    return summaries[:per_copy]


def main() -> None:
    ref_path = sys.argv[1]
    our_path = sys.argv[2]
    ref_xml, _ = load(ref_path)
    our_xml, _ = load(our_path)

    ref_p = body_paras(ref_xml)
    our_p = body_paras(our_xml)
    ref_t = table_summaries(ref_xml)
    our_t = table_summaries(our_xml)

    print("=" * 72)
    print("METRICS")
    for p in (ref_path, our_path):
        m = metrics(p)
        print(m)

    print("\n" + "=" * 72)
    print("TABLE STRUCTURE (first doc copy ~13 tables)")
    print("REF:", *first_copy_tables(ref_t), sep="\n  ")
    print("OUR:", *first_copy_tables(our_t), sep="\n  ")

    sections = [
        ("1. Problem", "1. Problem Statement", "2. Solution"),
        ("2. Solution", "2. Solution", "3. Product"),
        ("3. Products", "3. Product", "4. Market"),
        ("5. Price", "5. Price Market Gap", "6. SWOT"),
        ("6. SWOT headings", "6. SWOT Analysis", "Suggested response"),
        ("8. Marketing", "8. Marketing Model", "9. Sales"),
        ("9. Sales", "9. Sales Model", "10. Financial"),
        ("10. Pricing SKUs", "Recommended pricing", "11."),
        ("KRA intro", "Chief Growth Officer", "23."),
    ]

    report: list[str] = []
    for title, s, e in sections:
        report.extend(compare_lists(section(ref_p, s, e), section(our_p, s, e), title))

    # Text similarity (first 9-page equivalent)
    ref_text = all_text(ref_xml)[: len(all_text(ref_xml)) // 3]
    our_text = all_text(our_xml)[: len(all_text(our_xml)) // 3]
    ref_words = ref_text.split()
    our_words = our_text.split()
    print("\n" + "=" * 72)
    print(f"First-copy word count: REF={len(ref_words)} OUR={len(our_words)}")
    print(f"First-copy text equal: {ref_text == our_text}")

    # Duplicate paras in our output
    c = Counter(our_p)
    dups = [(t, n) for t, n in c.items() if n > 2 and len(t) > 15]
    print(f"\nDuplicate paragraphs in OUR (>2x): {len(dups)}")
    for t, n in sorted(dups, key=lambda x: -x[1])[:8]:
        print(f"  x{n}: {t[:90]}")

    print("\n" + "=" * 72)
    print("SECTION DIFFS")
    print("\n".join(report))

    out = Path(our_path).parent / "deep-analysis-report.txt"
    out.write_text("\n".join(str(metrics(ref_path)), str(metrics(our_path)), *report), encoding="utf-8")
    print(f"\nReport: {out}")


if __name__ == "__main__":
    main()
