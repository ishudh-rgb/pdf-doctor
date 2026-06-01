#!/usr/bin/env python3
"""Render logo watermark region from PDF page to get exact bbox."""
import fitz

pdf = r"C:\Users\NiTiN Dhiman\Downloads\merged (3).pdf"
doc = fitz.open(pdf)
page = doc[1]  # page 2 - user shows logo on products page

# Scan for logo bbox by rendering strips
page_h = page.rect.height
page_w = page.rect.width
best = None
for y0 in range(200, 650, 10):
    for x0 in range(150, 400, 10):
        clip = fitz.Rect(x0, y0, x0 + 200, y0 + 200)
        pix = page.get_pixmap(matrix=fitz.Matrix(1, 1), clip=clip, alpha=False)
        samples = pix.samples
        # count saturated color pixels (logo has green/red/yellow)
        colorful = 0
        for i in range(0, len(samples), 3):
            r, g, b = samples[i], samples[i+1], samples[i+2]
            if g > 100 and r > 80 and b < 200 and max(r,g,b) - min(r,g,b) > 30:
                colorful += 1
        if colorful > 500:
            score = colorful
            if best is None or score > best[0]:
                best = (score, x0, y0)

print("best logo region", best)
if best:
    _, x0, y0 = best
    clip = fitz.Rect(x0 - 20, y0 - 20, x0 + 220, y0 + 220)
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), clip=clip)
    pix.save(r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\test-output\logo_detected.png")
    print("bbox approx", clip)

doc.close()
