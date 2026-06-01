#!/usr/bin/env python3
import re
import fitz

pdf = r"C:\Users\NiTiN Dhiman\Downloads\merged (3).pdf"
doc = fitz.open(pdf)

for pi in range(3):
    page = doc[pi]
    xrefs = page.get_contents()
    print(f"\npage {pi+1} content xrefs: {xrefs}")
    for cx in xrefs:
        s = doc.xref_stream(cx).decode("latin-1", errors="ignore")
        if "98" in s or "/Im" in s or "Do" in s:
            for ln in s.split("\n"):
                if "Do" in ln or "98" in ln or ("cm" in ln and "3.125" in ln):
                    print(f"  xref{cx}: {ln.strip()[:100]}")

# find form xobject that uses image 98
for xref in range(1, 130):
    try:
        obj = doc.xref_object(xref)
        if "98 0 R" in obj and "/Form" in obj:
            print(f"\nForm xref {xref}: {obj[:300]}")
            stream = doc.xref_stream(xref)
            if stream:
                st = stream.decode("latin-1", errors="ignore")
                print(" stream:", st[:500])
    except Exception:
        pass

doc.close()
