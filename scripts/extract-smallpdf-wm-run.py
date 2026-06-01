#!/usr/bin/env python3
import re
import zipfile

p = r"C:\Users\NiTiN Dhiman\Downloads\smallpdf result.docx"
with zipfile.ZipFile(p) as z:
    doc = z.read("word/document.xml").decode()

for m in re.finditer(r"<w:r>.*?</w:r>", doc, re.DOTALL):
    run = m.group(0)
    if "<w:drawing>" in run and "CONFIDENTIAL" in run and len(run) < 8000:
        out = r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\scripts\templates\confidential-watermark-run.xml"
        with open(out, "w", encoding="utf-8") as f:
            f.write(run)
        print("len", len(run))
        break
