#!/usr/bin/env python3
import re
import zipfile

p = r"C:\Users\NiTiN Dhiman\Downloads\smallpdf result.docx"
with zipfile.ZipFile(p) as z:
    doc = z.read("word/document.xml").decode()

# find first CONFIDENTIAL context
idx = doc.find("CONFIDENTIAL")
print(doc[idx - 800 : idx + 400])
print("---")
print("pict count", doc.count("<w:pict>"))
print("drawing count", doc.count("<w:drawing"))
print("anchorx page", doc.count("anchorx=\"page\""))
