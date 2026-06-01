#!/usr/bin/env python3
import sys
import fitz

sys.stdout.reconfigure(encoding="utf-8")

pdf = r"C:\Users\NiTiN Dhiman\Downloads\merged (3).pdf"
doc = fitz.open(pdf)
for pi in range(8):
    page = doc[pi]
    annots = list(page.annots() or [])
    print(f"page {pi+1}: annots={len(annots)}")
    for a in annots:
        print(" ", a.type, a.info)
doc.set_ocg_states()  # check doc ocgs
try:
    cfg = doc.get_ocgs()
    print("doc ocgs", cfg)
except Exception as e:
    print("ocg err", e)

# xref 98 - where is it used?
print("\nxref 98 keys:")
for k in ("Type", "Subtype", "Width", "Height", "Filter"):
    print(k, doc.xref_get_key(98, k))

# search all pages content for xref 98 reference
for pi in range(8):
    page = doc[pi]
    xrefs = page.get_contents()
    text = b""
    for xref in xrefs:
        text += doc.xref_stream(xref)
    if b"/Image" in text or b"98" in text:
        if b"98 0 R" in text or b"/Im" in text:
            print(f"page {pi+1} may reference images in stream")

doc.close()
