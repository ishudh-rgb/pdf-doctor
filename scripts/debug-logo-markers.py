#!/usr/bin/env python3
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from docx import Document
from smallpdf_transform import extract_pdf_logo_markers, LOGO_WATERMARK_ANCHORS, _find_marker_paragraph

PDF = r"C:\Users\NiTiN Dhiman\Downloads\merged (3).pdf"
doc = Document(r"test-output/merged-test.docx")
logo_markers = extract_pdf_logo_markers(PDF)
out = Path("test-output/logo-debug.txt")
lines = []
for i, m in enumerate(logo_markers):
    lines.append(f"pdf marker {i+1}: {m}")
logo_used = set()
for i, m in enumerate(logo_markers):
    idx, target = _find_marker_paragraph(doc, m, logo_used)
    if idx is None:
        fb = LOGO_WATERMARK_ANCHORS[i] if i < len(LOGO_WATERMARK_ANCHORS) else "?"
        idx2, _ = _find_marker_paragraph(doc, fb, logo_used)
        lines.append(f"MISS {i+1}: pdf={m[:60]!r} fb={fb!r} idx={idx2}")
        if idx2 is not None:
            logo_used.add(idx2)
    else:
        logo_used.add(idx)
        lines.append(f"OK {i+1}: idx={idx} text={doc.paragraphs[idx].text[:60]!r}")
out.write_text("\n".join(lines), encoding="utf-8")
print("written", out)
