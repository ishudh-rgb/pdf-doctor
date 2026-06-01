#!/usr/bin/env python3
import re
import zipfile
from pathlib import Path

raw = Path(r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\test-output\raw-pdf2docx.docx")
out = Path(r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\test-output\raw-media")
out.mkdir(parents=True, exist_ok=True)

with zipfile.ZipFile(raw) as z:
    doc = z.read("word/document.xml").decode()
    rels = z.read("word/_rels/document.xml.rels").decode()
    for name in sorted(z.namelist()):
        if name.startswith("word/media/"):
            data = z.read(name)
            (out / name.split("/")[-1]).write_bytes(data)
            print(name, len(data))

# find r:embed ids and positions
embeds = re.findall(r'r:embed="([^"]+)"', doc)
print("embeds", len(embeds), "unique", len(set(embeds)))

# sample drawing with extent and offset
for i, m in enumerate(re.finditer(r"<wp:anchor[^>]*>.*?</wp:anchor>", doc, re.DOTALL)):
    block = m.group(0)
    if "blip" in block:
        ext = re.search(r'cx="(\d+)" cy="(\d+)"', block)
        posh = re.search(r"<wp:positionH[^>]*>.*?<wp:posOffset>(\d+)</wp:posOffset>", block, re.DOTALL)
        posv = re.search(r"<wp:positionV[^>]*>.*?<wp:posOffset>(\d+)</wp:posOffset>", block, re.DOTALL)
        embed = re.search(r'r:embed="([^"]+)"', block)
        if ext and posh:
            cx, cy = int(ext.group(1)), int(ext.group(2))
            w_pt, h_pt = cx/12700, cy/12700
            h_off = int(posh.group(1))/12700
            v_off = int(posv.group(1))/12700 if posv else 0
            if w_pt > 80:  # large images only
                print(f"anchor {i}: {w_pt:.0f}x{h_pt:.0f}pt at {h_off:.0f},{v_off:.0f} embed={embed.group(1) if embed else None}")
