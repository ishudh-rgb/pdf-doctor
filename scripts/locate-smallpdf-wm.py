#!/usr/bin/env python3
import re
import zipfile
from docx import Document

p = r"C:\Users\NiTiN Dhiman\Downloads\smallpdf result.docx"
doc = Document(p)
idx = 0
for i, para in enumerate(doc.paragraphs):
    if "CONFIDENTIAL" in para._p.xml:
        text = para.text.strip()[:60]
        print(i, repr(text), "drawing", "<w:drawing>" in para._p.xml)
        idx += 1
print("total", idx)
