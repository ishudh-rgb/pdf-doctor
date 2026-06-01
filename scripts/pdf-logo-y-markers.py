#!/usr/bin/env python3
"""Find PDF text near logo y-position on each watermarked page."""
import fitz

PDF = r"C:\Users\NiTiN Dhiman\Downloads\merged (3).pdf"
LOGO_Y = 367.0
LOGO_Y_TOL = 80

doc = fitz.open(PDF)
for pi in range(8):
    page = doc[pi]
    if "CONFIDENTIAL" not in page.get_text():
        continue
    near = []
    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            text = "".join(s["text"] for s in line["spans"]).strip()
            if not text or "CONFIDENTIAL" in text:
                continue
            y0, y1 = line["bbox"][1], line["bbox"][3]
            mid = (y0 + y1) / 2
            if abs(mid - LOGO_Y) < LOGO_Y_TOL or (y0 <= LOGO_Y <= y1):
                near.append((mid, line["bbox"][0], text[:70]))
    near.sort()
    print(f"\n=== PDF page {pi+1} (lines near y={LOGO_Y}) ===")
    for mid, x0, t in near[:6]:
        print(f"  y={mid:.0f} x={x0:.0f}: {t}")

doc.close()
