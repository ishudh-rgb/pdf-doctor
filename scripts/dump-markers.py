#!/usr/bin/env python3
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from smallpdf_transform import extract_pdf_logo_markers, extract_pdf_watermark_markers

PDF = r"C:\Users\NiTiN Dhiman\Downloads\merged (3).pdf"
lm = extract_pdf_logo_markers(PDF)
cm = extract_pdf_watermark_markers(PDF)
Path("test-output/markers.txt").write_text(
    "\n".join(f"p{i+1} conf={cm[i]}\n     logo={lm[i]}" for i in range(min(len(cm), len(lm)))),
    encoding="utf-8",
)
print("ok")
