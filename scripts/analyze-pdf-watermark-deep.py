#!/usr/bin/env python3
"""Deep scan PDF for watermark graphics on pages 1-8."""
import sys
import re

import fitz

sys.stdout.reconfigure(encoding="utf-8")

pdf = r"C:\Users\NiTiN Dhiman\Downloads\merged (3).pdf"
doc = fitz.open(pdf)

for pi in range(8):
    page = doc[pi]
    print(f"\n=== Page {pi+1} ===")
    # drawings
    paths = page.get_drawings()
    print(f"drawings: {len(paths)}")
    for d in paths[:3]:
        print(" ", {k: d.get(k) for k in ("type", "fill", "color", "rect", "items") if k in d})
    # xobjects
    xrefs = page.get_xobjects()
    print(f"xobjects: {len(xrefs)}")
    for x in xrefs[:5]:
        print(" ", x)
    # text with CONFIDENTIAL
    text = page.get_text()
    if "CONFIDENTIAL" in text:
        print("has CONFIDENTIAL text")
    # search for image blocks in dict
    for block in page.get_text("dict")["blocks"]:
        t = block.get("type")
        if t == 1:
            print(" image block", block["bbox"], block.get("width"), block.get("height"))
    # raw content stream hints
    try:
        cont = page.read_contents()
        if cont:
            s = cont.decode("latin-1", errors="ignore")
            for pat in ("Do", "Image", "Form", "gs", "Tm", "cm"):
                c = s.count(pat)
                if c:
                    print(f"  stream {pat}: {c}")
    except Exception as e:
        print("  contents err", e)

# doc-level images
print("\n=== All doc images ===")
for i in range(doc.xref_length()):
    try:
        t = doc.xref_get_key(i, "Subtype")
        if t and t[1] == "/Image":
            w = doc.xref_get_key(i, "Width")
            h = doc.xref_get_key(i, "Height")
            print(f"xref {i}: {w} x {h}")
    except Exception:
        pass

doc.close()
