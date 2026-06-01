#!/usr/bin/env python3
import sys
from pathlib import Path

import fitz

sys.stdout.reconfigure(encoding="utf-8")

pdf = r"C:\Users\NiTiN Dhiman\Downloads\merged (3).pdf"
out = Path(r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\test-output\watermark-images")
out.mkdir(parents=True, exist_ok=True)

doc = fitz.open(pdf)
# extract xref 98
pix = fitz.Pixmap(doc, 98)
if pix.n - pix.alpha >= 4:
    pix = fitz.Pixmap(fitz.csRGB, pix)
pix.save(str(out / "xref98_logo.png"))
print(f"saved xref98 {pix.width}x{pix.height}")

for pi in range(8):
    page = doc[pi]
    # find image instances via get_image_info (newer pymupdf)
    try:
        infos = page.get_image_info()
        print(f"page {pi+1} image_info:", len(infos))
        for info in infos:
            print(" ", info)
    except Exception as e:
        print(f"page {pi+1} get_image_info fail", e)
    # search text blocks near center for logo area - render clip
    mat = fitz.Matrix(2, 2)
    clip = fitz.Rect(150, 250, 450, 550)
    pix = page.get_pixmap(matrix=mat, clip=clip)
    pix.save(str(out / f"page{pi+1}_center_clip.png"))

doc.close()
