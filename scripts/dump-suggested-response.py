#!/usr/bin/env python3
import re
import sys
import zipfile

path = sys.argv[1]
with zipfile.ZipFile(path) as z:
    xml = z.read("word/document.xml").decode("utf-8", errors="ignore")

idx = xml.find("Suggested response")
chunk = xml[idx : idx + 12000]
for m in re.finditer(r"<w:p[^>]*>.*?</w:p>", chunk, re.DOTALL):
    t = "".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", m.group(0)))
    if not t.strip():
        continue
    p = m.group(0)
    pstyle = re.search(r'w:pStyle w:val="([^"]+)"', p)
    print("TEXT:", t[:70])
    print("  numPr:", "w:numPr" in p, "drawing:", p.count("w:drawing"), "style:", pstyle.group(1) if pstyle else None)
    if t.startswith("Grow D2C"):
        break
