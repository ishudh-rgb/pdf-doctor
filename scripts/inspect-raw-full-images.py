#!/usr/bin/env python3
import re
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pdf2docx import Converter

pdf = r"C:\Users\NiTiN Dhiman\Downloads\merged (3).pdf"
out = r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\test-output\raw-full.docx"
cv = Converter(pdf)
cv.convert(out, multi_processing=False, cpu_count=1, ignore_page_error=True)
cv.close()

with zipfile.ZipFile(out) as z:
    media = {n: len(z.read(n)) for n in z.namelist() if n.startswith("word/media/")}
    doc = z.read("word/document.xml").decode()
    rels = z.read("word/_rels/document.xml.rels").decode()

print("media files", len(media))
for k, v in sorted(media.items(), key=lambda x: -x[1])[:15]:
    print(k, v)

rid_map = dict(re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"', rels))
large = []
for m in re.finditer(r"<wp:anchor[^>]*>.*?</wp:anchor>", doc, re.DOTALL):
    b = m.group(0)
    ext = re.search(r'cx="(\d+)" cy="(\d+)"', b)
    if not ext:
        continue
    w, h = int(ext.group(1)) / 12700, int(ext.group(2)) / 12700
    if w > 80:
        emb = re.search(r'r:embed="([^"]+)"', b)
        target = rid_map.get(emb.group(1), "") if emb else ""
        large.append((w, h, target))

print("large anchors", len(large))
for row in large[:20]:
    print(row)
