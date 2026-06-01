#!/usr/bin/env python3
"""Compare our output vs smallpdf result.docx in detail."""
import re
import sys
import zipfile
from pathlib import Path


def analyse(path: str) -> dict:
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8", errors="ignore")
        names = z.namelist()
        media = [n for n in names if n.startswith("word/media/")]
    texts = re.findall(r"<w:t[^>]*>([^<]*)</w:t>", xml)
    paras = []
    for b in re.findall(r"<w:p\b[\s\S]*?</w:p>", xml):
        if "<w:tbl" in b:
            continue
        t = "".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", b)).strip()
        if t:
            paras.append(t)
    tables = []
    for tbl in re.findall(r"<w:tbl>[\s\S]*?</w:tbl>", xml):
        t = [x.strip() for x in re.findall(r"<w:t[^>]*>([^<]*)</w:t>", tbl) if x.strip()]
        tables.append(
            {
                "rows": tbl.count("<w:tr>"),
                "cols": tbl.count("<w:gridCol"),
                "preview": " | ".join(t[:8])[:120],
            }
        )
    return {
        "file": Path(path).name,
        "size": Path(path).stat().st_size,
        "media": len(media),
        "drawings": xml.count("<w:drawing"),
        "tables": len(tables),
        "numPr": xml.count("<w:numPr"),
        "paras": len(paras),
        "chars": sum(len(x) for x in texts),
        "table_previews": tables[:15],
        "first_paras": paras[:20],
    }


def section(paras, start, end=None):
    out = []
    on = False
    for p in paras:
        if start in p:
            on = True
            out.append(p)
            continue
        if on and end and p.startswith(end):
            break
        if on:
            out.append(p)
    return out


def paras(path):
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8", errors="ignore")
    out = []
    for b in re.findall(r"<w:p\b[\s\S]*?</w:p>", xml):
        if "<w:tbl" in b:
            continue
        t = "".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", b)).strip()
        if t:
            out.append(t)
    return out


if __name__ == "__main__":
    ref = sys.argv[1]
    our = sys.argv[2]
    r = analyse(ref)
    o = analyse(our)
    print("REF", r)
    print("OUR", o)
    rp, op = paras(ref), paras(our)
    for name, s, e in [
        ("Problem", "1. Problem Statement", "2. Solution"),
        ("Marketing", "8. Marketing Model", "9. Sales"),
        ("Sales", "9. Sales Model", "10. Financial"),
    ]:
        a, b = section(rp, s, e), section(op, s, e)
        bad = sum(1 for i in range(max(len(a), len(b))) if (a[i] if i < len(a) else "") != (b[i] if i < len(b) else ""))
        print(f"{name}: ref={len(a)} our={len(b)} bad={bad}")
