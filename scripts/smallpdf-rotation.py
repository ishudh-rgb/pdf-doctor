#!/usr/bin/env python3
import re
import zipfile

p = r"C:\Users\NiTiN Dhiman\Downloads\smallpdf result.docx"
with zipfile.ZipFile(p) as z:
    doc = z.read("word/document.xml").decode()
m = re.search(r'rotation:(\d+)', doc)
print("vml rotation", m.group(1) if m else None)
m2 = re.search(r'a:xfrm rot="(\d+)"', doc)
print("drawing rot", m2.group(1) if m2 else None, "deg", int(m2.group(1))/60000 if m2 else None)
