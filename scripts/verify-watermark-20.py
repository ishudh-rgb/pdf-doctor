#!/usr/bin/env python3
import re
import zipfile

p = r"C:\Users\NiTiN Dhiman\Downloads\merged (3) (21).docx"
with zipfile.ZipFile(p) as z:
    doc = z.read("word/document.xml").decode()
    hdr = z.read("word/header1.xml").decode() if "word/header1.xml" in z.namelist() else ""

print("body CONF", doc.count("CONFIDENTIAL"))
print("hdr CONF", hdr.count("CONFIDENTIAL"))
print("drawings", doc.count("<w:drawing"))
print("behindDoc=1", doc.count('behindDoc="1"'))
print("layoutInCell=0", doc.count('layoutInCell="0"'))
anchors = re.findall(r'wp:docPr id="(\d+)" name="Confidential WM"', doc)
print("wm anchors placed", len(anchors))
