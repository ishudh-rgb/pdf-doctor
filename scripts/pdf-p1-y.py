#!/usr/bin/env python3
import fitz
import sys

PDF = r"C:\Users\NiTiN Dhiman\Downloads\merged (3).pdf"
doc = fitz.open(PDF)
page = doc[0]
for block in page.get_text("dict")["blocks"]:
    if block.get("type") != 0:
        continue
    for line in block["lines"]:
        text = "".join(s["text"] for s in line["spans"]).strip()
        if not text:
            continue
        y0 = line["bbox"][1]
        if "Solution" in text or "Problem" in text or "Brand challenge" in text or "Contract manufacturing" in text[:20]:
            sys.stdout.buffer.write(f"y={y0:.0f}: {text[:80]}\n".encode("utf-8", errors="replace"))
doc.close()
