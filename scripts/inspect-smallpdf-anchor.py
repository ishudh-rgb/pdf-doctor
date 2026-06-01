#!/usr/bin/env python3
import re
import zipfile

p = r"C:\Users\NiTiN Dhiman\Downloads\smallpdf result.docx"
with zipfile.ZipFile(p) as z:
    doc = z.read("word/document.xml").decode()

anchors = re.findall(r"<wp:anchor[^>]+>", doc)
print("anchor count", len(anchors))
for a in anchors[:3]:
    print(a)
print("---")
behind = doc.count("behindDoc")
print("behindDoc", behind)
# empty paras with only watermark
for m in re.finditer(r"<w:p[^>]*>(.*?)</w:p>", doc, re.DOTALL):
    block = m.group(1)
    if "CONFIDENTIAL" in block and len(block) < 5000:
        if block.count("<w:t") <= 2:
            print("short conf para len", len(block))
            break
