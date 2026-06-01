#!/usr/bin/env python3
import re
import zipfile

raw = r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\test-output\raw-pdf2docx.docx"
with zipfile.ZipFile(raw) as z:
    doc = z.read("word/document.xml").decode()
    rels = z.read("word/_rels/document.xml.rels").decode()

rid_to_target = {}
for m in re.finditer(r'Id="([^"]+)"[^>]*Target="([^"]+)"', rels):
    rid_to_target[m.group(1)] = m.group(2)

large = []
for i, m in enumerate(re.finditer(r"<wp:anchor[^>]*>.*?</wp:anchor>", doc, re.DOTALL)):
    block = m.group(0)
    if "blip" not in block:
        continue
    ext = re.search(r'cx="(\d+)" cy="(\d+)"', block)
    posh = re.search(r"<wp:positionH[^>]*>.*?<wp:posOffset>(\d+)</wp:posOffset>", block, re.DOTALL)
    posv = re.search(r"<wp:positionV[^>]*>.*?<wp:posOffset>(\d+)</wp:posOffset>", block, re.DOTALL)
    embed = re.search(r'r:embed="([^"]+)"', block)
    behind = re.search(r'behindDoc="(\d+)"', block)
    if not ext:
        continue
    cx, cy = int(ext.group(1)), int(ext.group(2))
    w_pt, h_pt = cx / 12700, cy / 12700
    if w_pt < 50:
        continue
    rid = embed.group(1) if embed else "?"
    target = rid_to_target.get(rid, rid)
    h_off = int(posh.group(1)) / 12700 if posh else 0
    v_off = int(posv.group(1)) / 12700 if posv else 0
    large.append((i, w_pt, h_pt, h_off, v_off, target, behind.group(1) if behind else "?"))

print("large image anchors", len(large))
for row in large[:12]:
    print(row)
