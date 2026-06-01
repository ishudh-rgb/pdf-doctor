#!/usr/bin/env python3
import re
import zipfile

raw = r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\test-output\raw-full.docx"
with zipfile.ZipFile(raw) as z:
    doc = z.read("word/document.xml").decode()
    rels = z.read("word/_rels/document.xml.rels").decode()

logo_rid = [k for k, v in dict(re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"', rels)).items() if v == "media/image14.png"][0]

for m in re.finditer(r"<w:drawing>.*?</w:drawing>", doc, re.DOTALL):
    block = m.group(0)
    if logo_rid in block and len(block) < 8000:
        run = f"<w:r><w:drawing>{block[11:-12]}</w:drawing></w:r>" if block.startswith("<w:drawing>") else block
        # wrap properly
        run = f"<w:r>{block}</w:r>"
        out = r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\scripts\templates\watermark-logo-drawing.xml"
        with open(out, "w", encoding="utf-8") as f:
            f.write(run)
        print("len", len(run))
        break
