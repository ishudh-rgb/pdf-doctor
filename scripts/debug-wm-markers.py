#!/usr/bin/env python3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from docx import Document
from smallpdf_transform import (
    WATERMARK_ANCHORS,
    _paragraph_matches_marker,
    extract_pdf_watermark_markers,
)

pdf = r"C:\Users\NiTiN Dhiman\Downloads\merged (3).pdf"
docx = r"C:\Users\NiTiN Dhiman\Downloads\merged (3) (20).docx"

sys.stdout.reconfigure(encoding="utf-8")

markers = extract_pdf_watermark_markers(pdf)
print("pdf markers", len(markers))
for m in markers:
    print(" ", m[:70])

doc = Document(docx)
for marker in markers or WATERMARK_ANCHORS:
    found = False
    for i, para in enumerate(doc.paragraphs):
        if _paragraph_matches_marker(para.text, marker):
            print("MATCH", repr(marker[:50]), "-> para", i, repr(para.text[:60]))
            found = True
            break
    if not found:
        print("MISS", repr(marker[:50]))
