#!/usr/bin/env python3
import re
import zipfile
from pathlib import Path

for label, p in [
    ("ours19", Path(r"C:\Users\NiTiN Dhiman\Downloads\merged (3) (19).docx")),
    ("smallpdf", Path(r"C:\Users\NiTiN Dhiman\Downloads\smallpdf result.docx")),
]:
    if not p.is_file():
        print(label, "missing")
        continue
    with zipfile.ZipFile(p) as z:
        doc = z.read("word/document.xml").decode()
        styles = [m.group(1) for m in re.finditer(r'w:tblStyle w:val="([^"]+)"', doc)]
        solid = len(re.findall(r'w:shd[^>]*w:fill="[0-9A-Fa-f]{6}"', doc))
        hdr = ""
        if "word/header1.xml" in z.namelist():
            hdr = z.read("word/header1.xml").decode()
    print(label, "tblStyle count", len(styles), "unique", sorted(set(styles)))
    print(label, "solid fills", solid, "body CONF", doc.count("CONFIDENTIAL"), "hdr CONF", hdr.count("CONFIDENTIAL"))
