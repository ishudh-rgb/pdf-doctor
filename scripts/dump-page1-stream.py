#!/usr/bin/env python3
import fitz

pdf = r"C:\Users\NiTiN Dhiman\Downloads\merged (3).pdf"
doc = fitz.open(pdf)
page = doc[0]
s = page.read_contents().decode("latin-1", errors="ignore")
print(s)
print("--- resources ---")
print(doc.xref_object(page.xref))
doc.close()
