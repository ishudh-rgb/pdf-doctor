#!/usr/bin/env python3
import re
import zipfile

p = r"C:\Users\NiTiN Dhiman\Downloads\smallpdf result.docx"
with zipfile.ZipFile(p) as z:
    doc = z.read("word/document.xml").decode()

drawings = list(re.finditer(r"<w:drawing>.*?</w:drawing>", doc, re.DOTALL))
conf = [d for d in drawings if "CONFIDENTIAL" in d.group(0)]
print("conf drawings", len(conf))
if conf:
    block = conf[0].group(0)
    print("len", len(block))
    with open(r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\test-output\smallpdf-wm-drawing.xml", "w", encoding="utf-8") as f:
        f.write(block)
    print("written")

# count empty paragraphs that only contain drawing
empty_wm = 0
for m in re.finditer(r"<w:p>(.*?)</w:p>", doc, re.DOTALL):
    inner = m.group(1)
    if "CONFIDENTIAL" in inner and "<w:t" not in inner.replace("CONFIDENTIAL", ""):
        empty_wm += 1
print("paras with drawing-only conf", empty_wm)
