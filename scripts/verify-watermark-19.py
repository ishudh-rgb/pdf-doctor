#!/usr/bin/env python3
import re
import zipfile

p = r"C:\Users\NiTiN Dhiman\Downloads\merged (3) (19).docx"
with zipfile.ZipFile(p) as z:
    doc = z.read("word/document.xml").decode()
    hdr = z.read("word/header1.xml").decode()

solid = len(re.findall(r'w:shd[^>]*w:fill="[0-9A-Fa-f]{6}"', doc))
clear = doc.count('w:val="clear"')
body_conf = doc.count("CONFIDENTIAL")
hdr_conf = hdr.count("CONFIDENTIAL")
ml = re.search(r"margin-left:([\d.]+)pt", hdr)
w = re.search(r"width:([\d.]+)pt", hdr)
print("solid_cell_fills", solid)
print("clear_shd", clear)
print("body_CONF", body_conf, "hdr_CONF", hdr_conf)
print("watermark margin-left", ml.group(1) if ml else None, "width", w.group(1) if w else None)
print("allowincell", "allowincell" in hdr)
