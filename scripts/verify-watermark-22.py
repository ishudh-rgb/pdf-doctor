#!/usr/bin/env python3
import re
import zipfile

p = r"C:\Users\NiTiN Dhiman\Downloads\merged (3) (22).docx"
with zipfile.ZipFile(p) as z:
    doc = z.read("word/document.xml").decode()
    media = [n for n in z.namelist() if n.startswith("word/media/")]

print("media", media)
print("CONFIDENTIAL", doc.count("CONFIDENTIAL"))
print("pic:pic logo anchors", len(re.findall(r'behindDoc="1".*?pic:pic', doc, re.DOTALL)))
logo_anchors = 0
for m in re.finditer(r"<wp:anchor[^>]*>.*?</wp:anchor>", doc, re.DOTALL):
    b = m.group(0)
    if "pic:pic" in b and 'behindDoc="1"' in b:
        ext = re.search(r'cx="(\d+)"', b)
        if ext and int(ext.group(1)) > 2_500_000:
            logo_anchors += 1
            posh = re.search(r"<wp:posOffset>(\d+)</wp:posOffset>", b)
            if logo_anchors <= 2:
                print("logo", int(ext.group(1))/12700, "x off", int(posh.group(1))/12700 if posh else 0)
print("logo_anchors", logo_anchors)
print("file size", __import__("os").path.getsize(p))
