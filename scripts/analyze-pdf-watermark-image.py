#!/usr/bin/env python3
"""Analyze watermark images in merged (3).pdf pages 1-8."""
import sys
from pathlib import Path

import fitz

sys.stdout.reconfigure(encoding="utf-8")

pdf = r"C:\Users\NiTiN Dhiman\Downloads\merged (3).pdf"
out_dir = Path(r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\test-output\watermark-images")
out_dir.mkdir(parents=True, exist_ok=True)

doc = fitz.open(pdf)
for pi in range(8):
    page = doc[pi]
    print(f"\n=== Page {pi+1} ===")
    print("images:", len(page.get_images()))
    for img in page.get_images(full=True):
        print(" ", img[:6])
    # drawings / xobjects
    blocks = page.get_text("dict")["blocks"]
    for bi, block in enumerate(blocks):
        if block.get("type") == 1:  # image block
            bbox = block["bbox"]
            print(f"  image block {bi}: bbox={[round(x,1) for x in bbox]} size={block.get('width')}x{block.get('height')}")
    # extract all images on page
    for i, img in enumerate(page.get_images(full=True)):
        xref = img[0]
        try:
            pix = fitz.Pixmap(doc, xref)
            if pix.n - pix.alpha >= 4:
                pix = fitz.Pixmap(fitz.csRGB, pix)
            path = out_dir / f"page{pi+1}_img{i}_xref{xref}.png"
            pix.save(str(path))
            print(f"  saved {path.name} {pix.width}x{pix.height}")
        except Exception as e:
            print(f"  extract fail xref={xref}: {e}")

doc.close()
