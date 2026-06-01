#!/usr/bin/env python3
"""Inspect Smallpdf reference structure for normalization rules."""
import re
import zipfile

ref = r"C:\Users\NiTiN Dhiman\Downloads\merged (3).docx"
with zipfile.ZipFile(ref) as z:
    xml = z.read("word/document.xml").decode()

# first ~40% = one copy of ~9 page doc
cut = len(xml) // 3
chunk = xml[:cut]

tables = list(re.finditer(r"<w:tbl>[\s\S]*?</w:tbl>", chunk))
print("tables in first third:", len(tables))
for i, m in enumerate(tables):
    block = m.group(0)
    texts = [t.strip() for t in re.findall(r"<w:t[^>]*>([^<]*)</w:t>", block) if t.strip()]
    rows = block.count("<w:tr>")
    cols = block.count("<w:gridCol")
    print(f"\nT{i+1} rows={rows} cols={cols}")
    print("  cells:", " | ".join(texts[:8]))
    if len(texts) > 8:
        print("  ...", " | ".join(texts[8:16]))
