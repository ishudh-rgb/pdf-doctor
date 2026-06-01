#!/usr/bin/env python3
"""Where does raw pdf2docx attach logo anchors relative to nearby text?"""
import re
import zipfile

raw = r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\test-output\raw-full.docx"

with zipfile.ZipFile(raw) as z:
    doc = z.read("word/document.xml").decode()
    rels = z.read("word/_rels/document.xml.rels").decode()

rid = dict(re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"', rels)).get("media/image14.png")
if not rid:
    for k, v in dict(re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"', rels)).items():
        if "image14" in v:
            rid = k

paras = list(re.finditer(r"<w:p\b[^>]*>.*?</w:p>", doc, re.DOTALL))

def para_text(block):
    return "".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", block))

logo_para_idxs = []
for i, m in enumerate(paras):
    b = m.group(0)
    if rid and rid in b and "pic:pic" in b:
        logo_para_idxs.append(i)

print("logo anchor paragraphs in raw pdf2docx:", logo_para_idxs)
for idx in logo_para_idxs:
    for j in range(idx + 1, min(idx + 4, len(paras))):
        t = para_text(paras[j].group(0)).strip()
        if t:
            print(f"  para {idx} -> next {j}: {t[:75]!r}")
            break
