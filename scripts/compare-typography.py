#!/usr/bin/env python3
"""Compare PDF typography vs DOCX paragraph properties."""
from __future__ import annotations

import re
import sys
from pathlib import Path

import fitz
from docx import Document
from docx.oxml.ns import qn


def pdf_typography(pdf_path: str) -> list[str]:
    doc = fitz.open(pdf_path)
    page = doc[0]
    lines: list[str] = ["=== PDF page 1 typography ==="]
    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            text = "".join(span["text"] for span in line["spans"]).strip()
            if not text or "CONFIDENTIAL" in text:
                continue
            x0 = min(span["bbox"][0] for span in line["spans"])
            sizes = {round(span["size"], 1) for span in line["spans"]}
            fonts = {span.get("font", "") for span in line["spans"]}
            bold = any(span.get("flags", 0) & 2**4 for span in line["spans"])
            lines.append(
                f"x={x0:6.1f} sz={sorted(sizes)} bold={bold} | {text[:65]}"
            )
    doc.close()
    return lines


def docx_typography(docx_path: str) -> list[str]:
    doc = Document(docx_path)
    lines: list[str] = ["=== DOCX typography ==="]
    for i, para in enumerate(doc.paragraphs[:25]):
        text = para.text.strip()
        if not text:
            continue
        ppr = para._p.find(qn("w:pPr"))
        ind = ppr.find(qn("w:ind")) if ppr is not None else None
        left = ind.get(qn("w:left")) if ind is not None else None
        hang = ind.get(qn("w:hanging")) if ind is not None else None
        first = ind.get(qn("w:firstLine")) if ind is not None else None
        num = None
        if ppr is not None:
            n = ppr.find(qn("w:numPr"))
            if n is not None:
                nid = n.find(qn("w:numId"))
                num = nid.get(qn("w:val")) if nid is not None else "?"
        sizes = set()
        bold = False
        for run in para.runs:
            if run.font.size:
                sizes.add(round(run.font.size.pt, 1))
            if run.bold:
                bold = True
        rpr = para._p.find(qn("w:pPr"))
        if rpr is not None:
            rpr_r = rpr.find(qn("w:rPr"))
            if rpr_r is not None:
                sz = rpr_r.find(qn("w:sz"))
                if sz is not None:
                    sizes.add(round(int(sz.get(qn("w:val"))) / 2, 1))
        lines.append(
            f"i={i:2d} left={left} hang={hang} first={first} num={num} "
            f"sz={sorted(sizes) if sizes else '?'} bold={bold} | {text[:65]}"
        )
    return lines


def main() -> None:
    pdf_path = sys.argv[1]
    docx_path = sys.argv[2]
    out = Path(sys.argv[3]) if len(sys.argv) > 3 else None
    text = "\n".join(pdf_typography(pdf_path) + [""] + docx_typography(docx_path))
    if out:
        out.write_text(text, encoding="utf-8")
    else:
        sys.stdout.buffer.write(text.encode("utf-8"))


if __name__ == "__main__":
    main()
