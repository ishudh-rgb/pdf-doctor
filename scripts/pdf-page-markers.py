#!/usr/bin/env python3
import re
from pathlib import Path

import fitz

doc = fitz.open(r"C:\Users\NiTiN Dhiman\Downloads\merged (3).pdf")
lines = []
for pi in range(8):
    page = doc[pi]
    tops = []
    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            text = "".join(s["text"] for s in line["spans"]).strip()
            if not text or "CONFIDENTIAL" in text:
                continue
            y0 = line["bbox"][1]
            x0 = min(s["bbox"][0] for s in line["spans"])
            tops.append((y0, x0, text[:60]))
    tops.sort()
    lines.append(f"page {pi+1} top5:")
    for y, x, t in tops[:5]:
        dec = "DEC" if re.match(r"^\d+\.", t) else "   "
        lines.append(f"  y={y:6.1f} x={x:5.1f} {dec} {t}")
Path(r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\scripts\pdf-page-markers.txt").write_text(
    "\n".join(lines), encoding="utf-8"
)
