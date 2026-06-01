#!/usr/bin/env python3
"""Find bbox of logo image on each PDF page."""
import sys
import re

import fitz

sys.stdout.reconfigure(encoding="utf-8")

pdf = r"C:\Users\NiTiN Dhiman\Downloads\merged (3).pdf"
doc = fitz.open(pdf)

# Try to find image 98 placement via page.get_text trace or display list
for pi in range(8):
    page = doc[pi]
    # Use TextPage with images
    tp = page.get_textpage_ocr() if False else None
    blocks = page.get_text("rawdict")["blocks"]
    img_blocks = [b for b in blocks if b.get("type") == 1]
    print(f"page {pi+1} image blocks: {len(img_blocks)}")
    for b in img_blocks:
        print(" ", b["bbox"], b.get("width"), b.get("height"), b.get("xref"))

    # display list images
    dl = page.get_displaylist()
    # render with clip at center to detect
    for y in range(200, 500, 50):
        clip = fitz.Rect(150, y, 450, y + 200)
        pix = page.get_pixmap(matrix=fitz.Matrix(0.5, 0.5), clip=clip)
        # check if non-white pixels in center (logo has color)
        samples = pix.samples
        non_white = sum(1 for i in range(0, len(samples), 3) if samples[i] < 250 or samples[i+1] < 250 or samples[i+2] < 250)
        if non_white > 1000:
            print(f"  colorful region y={y}-{y+200} non_white={non_white}")

# Search all xrefs for Form that contains image 98
print("\nSearching xrefs for image 98 reference...")
for xref in range(1, doc.xref_length()):
    try:
        obj = doc.xref_object(xref)
        if "98 0 R" in obj or "/Image" in obj and xref < 120:
            if "98 0 R" in obj:
                print(f"xref {xref} references 98:", obj[:200])
    except Exception:
        pass

doc.close()
