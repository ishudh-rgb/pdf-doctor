#!/usr/bin/env python3
import re
import fitz
import sys

PDF = r"C:\Users\NiTiN Dhiman\Downloads\merged (3).pdf"
LOGO_TOP, LOGO_H = 367.0, 217.4
LOGO_MID = LOGO_TOP + LOGO_H / 2

doc = fitz.open(PDF)
markers = []
for pi in range(8):
    page = doc[pi]
    if "CONFIDENTIAL" not in page.get_text():
        continue
    lines = []
    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            text = "".join(s["text"] for s in line["spans"]).strip()
            if not text or "CONFIDENTIAL" in text:
                continue
            y0, y1 = line["bbox"][1], line["bbox"][3]
            x0 = line["bbox"][0]
            lines.append((y0, y1, x0, text))
    lines.sort()
    # prefer numbered section heading inside logo band
    pick = None
    logo_bottom = LOGO_TOP + LOGO_H
    for y0, y1, x0, text in lines:
        if y0 <= LOGO_MID <= y1 or (LOGO_TOP <= y0 <= logo_bottom):
            if re.match(r"^\d+\.\s", text) and x0 <= 55:
                pick = text
                break
    if pick is None:
        for y0, y1, x0, text in lines:
            if y0 <= LOGO_MID <= y1:
                pick = text
                break
    if pick is None:
        for y0, y1, x0, text in lines:
            if LOGO_TOP <= y0 <= LOGO_TOP + LOGO_H:
                pick = text
                break
    markers.append(pick or (lines[0][3] if lines else "?"))
    sys.stdout.buffer.write(f"page {pi+1}: {markers[-1][:80]}\n".encode("utf-8", errors="replace"))
doc.close()
