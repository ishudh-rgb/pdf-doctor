#!/usr/bin/env python3
import re
import zipfile

p = r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\test-output\test-logo.docx"
with zipfile.ZipFile(p) as z:
    rels = z.read("word/_rels/document.xml.rels").decode()
    doc = z.read("word/document.xml").decode()
    media = [n for n in z.namelist() if "word/media/" in n]

image_rels = re.findall(r'<Relationship[^>]+image[^>]*/>', rels, re.I)
print("image rels", len(image_rels))
for r in image_rels[:5]:
    print(r)
embeds = set(re.findall(r'r:embed="([^"]+)"', doc))
print("embed rIds sample", list(embeds)[:10])
