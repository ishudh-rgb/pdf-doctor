#!/usr/bin/env python3
import re
import zipfile

docx = r"test-output/merged-test.docx"
with zipfile.ZipFile(docx) as z:
    doc = z.read("word/document.xml").decode()

for i, m in enumerate(re.finditer(r"<w:p\b[^>]*>.*?</w:p>", doc, re.DOTALL)):
    t = "".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", m.group(0))).strip()
    if not t:
        continue
    if any(k in t for k in ("Founder Summary", "2. Solution", "3. Products", "Brand challenge", "Co-founder KRA")):
        print(i, repr(t[:85]))
