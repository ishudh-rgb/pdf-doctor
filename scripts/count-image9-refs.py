#!/usr/bin/env python3
import re
import zipfile

raw = r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\test-output\raw-pdf2docx.docx"
with zipfile.ZipFile(raw) as z:
    doc = z.read("word/document.xml").decode()
    rels = z.read("word/_rels/document.xml.rels").decode()

print("image9 refs in rels", rels.count("image9"))
print("image9 in doc", doc.count("image9"))

# all blip embeds with sizes
rid_map = dict(re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"', rels))
for kind in ("anchor", "inline"):
    tag = f"wp:{kind}"
    blocks = re.findall(rf"<{tag}[^>]*>.*?</{tag}>", doc, re.DOTALL)
    print(f"{kind} count", len(blocks))
    for b in blocks:
        if "image9" in b or "rId17" in b:
            print(" found image9 in", kind)

# count drawings per image rId
from collections import Counter
c = Counter()
for m in re.finditer(r'r:embed="([^"]+)"', doc):
    rid = m.group(1)
    c[rid_map.get(rid, rid)] += 1
print("embed counts:", dict(c))
