#!/usr/bin/env python3
import sys
from docx import Document
from docx.oxml.ns import qn

sys.stdout.reconfigure(encoding="utf-8")

p = r"C:\Users\NiTiN Dhiman\Downloads\merged (3) (19).docx"
doc = Document(p)
breaks = []
for i, para in enumerate(doc.paragraphs):
    xml = para._p.xml
    if 'w:type="page"' in xml or (para._p.pPr is not None and para._p.pPr.sectPr is not None):
        breaks.append((i, "page/sect", para.text.strip()[:50]))
print("breaks", len(breaks))
for b in breaks[:15]:
    print(b)

# pdf page estimate: count sectPr in body
body = doc.element.body
sect_count = sum(1 for c in body if c.tag == qn("w:p") and c.find(".//" + qn("w:sectPr")) is not None)
print("sectPr in paras", sect_count)
