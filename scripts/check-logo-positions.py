#!/usr/bin/env python3
import re
import sys
import zipfile

docx = sys.argv[1] if len(sys.argv) > 1 else "test-output/merged-test.docx"
with zipfile.ZipFile(docx) as z:
    doc = z.read("word/document.xml").decode()

for i, m in enumerate(re.finditer(r"<wp:anchor[^>]*>.*?</wp:anchor>", doc, re.DOTALL)):
    b = m.group(0)
    if "pic:pic" not in b:
        continue
    ext = re.search(r'cx="(\d+)" cy="(\d+)"', b)
    pos = re.findall(r"<wp:posOffset>(\d+)</wp:posOffset>", b)
    lic = re.search(r'layoutInCell="(\d+)"', b)
    embed = re.search(r'r:embed="([^"]+)"', b)
    if ext and len(pos) >= 2:
        w, h = int(ext.group(1)) / 12700, int(ext.group(2)) / 12700
        x, y = int(pos[0]) / 12700, int(pos[1]) / 12700
        print(
            f"logo: {w:.1f}x{h:.1f} at ({x:.1f},{y:.1f}) "
            f"layoutInCell={lic.group(1) if lic else '?'} "
            f"embed={embed.group(1) if embed else '?'}"
        )
