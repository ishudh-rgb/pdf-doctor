#!/usr/bin/env python3
"""Extract logo image transform from PDF page content streams."""
import re
import sys

import fitz

sys.stdout.reconfigure(encoding="utf-8")

pdf = r"C:\Users\NiTiN Dhiman\Downloads\merged (3).pdf"
doc = fitz.open(pdf)

# page 1 xref is typically 103+ (index*3)? map pages
page_xrefs = []
for pi in range(8):
    page = doc[pi]
    xref = page.xref
    page_xrefs.append(xref)
    cont = page.read_contents()
    if not cont:
        print(f"page {pi+1} xref={xref}: no contents")
        continue
    s = cont.decode("latin-1", errors="ignore")
    # find cm ... Do patterns for image forms
    # Image name often /Im0 or similar
    for m in re.finditer(r"(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+cm\s*/(\w+)\s+Do", s):
        a, b, c, d, e, f, name = m.groups()
        w = float(a)
        h = float(d)
        if w > 100:  # large transforms only
            print(f"page {pi+1}: cm [{a},{b},{c},{d},{e},{f}] Do /{name} -> size {w:.1f}x{h:.1f} at ({e},{f})")
    # also check for q ... cm ... Do
    if "/Im" in s or "98" in s:
        lines = [ln.strip() for ln in s.split("\n") if "cm" in ln or "Do" in ln or "gs" in ln.lower()]
        if lines:
            print(f"page {pi+1} stream hints:")
            for ln in lines[:8]:
                print(" ", ln[:120])

doc.close()
