#!/usr/bin/env python3
import re
import zipfile

raw = r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\test-output\raw-full.docx"
with zipfile.ZipFile(raw) as z:
    doc = z.read("word/document.xml").decode()
    rels = z.read("word/_rels/document.xml.rels").decode()

rid_map = dict(re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"', rels))
target_to_rid = {v: k for k, v in rid_map.items()}
logo_rid = target_to_rid.get("media/image14.png")
print("logo rId", logo_rid)

for i, m in enumerate(re.finditer(r"<wp:anchor[^>]*>.*?</wp:anchor>", doc, re.DOTALL)):
    b = m.group(0)
    if logo_rid and logo_rid not in b:
        continue
    ext = re.search(r'cx="(\d+)" cy="(\d+)"', b)
    posh = re.search(r"<wp:positionH[^>]*>.*?<wp:posOffset>(\d+)</wp:posOffset>", b, re.DOTALL)
    posv = re.search(r"<wp:positionV[^>]*>.*?<wp:posOffset>(\d+)</wp:posOffset>", b, re.DOTALL)
    behind = re.search(r'behindDoc="(\d+)"', b)
    if ext and posh and posv:
        w, h = int(ext.group(1)) / 12700, int(ext.group(2)) / 12700
        x, y = int(posh.group(1)) / 12700, int(posv.group(1)) / 12700
        print(f"anchor {i}: {w:.1f}x{h:.1f}pt at ({x:.1f},{y:.1f}) behind={behind.group(1) if behind else '?'}")
