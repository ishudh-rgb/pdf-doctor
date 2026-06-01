#!/usr/bin/env python3
import fitz
from pathlib import Path

pdf = r"C:\Users\NiTiN Dhiman\Downloads\merged (3).pdf"
doc = fitz.open(pdf)
lines = []
for i, page in enumerate(doc):
    w, h = page.rect.width, page.rect.height
    landscape = w > h
    tables = 0
    conf = "CONFIDENTIAL" in page.get_text()
    for b in page.get_text("dict")["blocks"]:
        if b.get("type") == 5:  # table block in some versions - check drawings
            tables += 1
    # count via find_tables if available
    try:
        tabs = page.find_tables()
        tc = len(tabs.tables) if tabs else 0
    except Exception:
        tc = page.get_text().count("Sl. No.")
    lines.append(
        f"p{i+1:2d} {w:.0f}x{h:.0f} {'LAND' if landscape else 'PORT'} "
        f"CONF={conf} tables~{tc}"
    )
Path(r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\scripts\pdf-pages.txt").write_text(
    "\n".join(lines), encoding="utf-8"
)
