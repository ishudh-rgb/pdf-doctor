#!/usr/bin/env python3
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn

doc = Document(r"C:\Users\NiTiN Dhiman\Downloads\merged (3) (15).docx")
lines = []
for i, para in enumerate(doc.paragraphs[:35]):
    t = para.text.strip()
    ppr = para._p.find(qn("w:pPr"))
    num = None
    if ppr is not None:
        n = ppr.find(qn("w:numPr"))
        if n is not None:
            num = n.find(qn("w:numId")).get(qn("w:val"))
    wm = "WM" if "CONFIDENTIAL" in para._p.xml else ""
    lines.append(f"{i:3d} n={num or '-':2s} {wm:2s} | {t[:85]}")

Path(r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\scripts\para-dump.txt").write_text(
    "\n".join(lines), encoding="utf-8"
)
