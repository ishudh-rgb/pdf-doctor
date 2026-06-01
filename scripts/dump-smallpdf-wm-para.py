#!/usr/bin/env python3
import re
import zipfile

p = r"C:\Users\NiTiN Dhiman\Downloads\smallpdf result.docx"
with zipfile.ZipFile(p) as z:
    doc = z.read("word/document.xml").decode()

# first watermark paragraph (full)
m = re.search(
    r"(<w:p[^>]*>.*?CONFIDENTIAL.*?</w:p>)",
    doc,
    re.DOTALL,
)
if m:
    block = m.group(1)
    print("len", len(block))
    # position offsets
    for tag in ("positionH", "positionV", "posOffset", "simplePos", "extent"):
        print(tag, re.findall(rf"<wp:{tag}[^>]*>|{tag}[^<]+", block)[:4])
    print(block[:3500])
    print("...")
    print(block[-1500:])
