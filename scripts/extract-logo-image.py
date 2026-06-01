#!/usr/bin/env python3
import zipfile
from pathlib import Path

raw = Path(r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\test-output\raw-full.docx")
out = Path(r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\scripts\templates\watermark-logo.png")
with zipfile.ZipFile(raw) as z:
    out.write_bytes(z.read("word/media/image14.png"))
print("written", out, out.stat().st_size)
