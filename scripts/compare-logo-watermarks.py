#!/usr/bin/env python3
"""Compare logo watermarks: PDF pages vs raw pdf2docx vs transformed docx."""
import re
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

PDF = r"C:\Users\NiTiN Dhiman\Downloads\merged (3).pdf"
RAW = Path(__file__).resolve().parent.parent / "test-output" / "raw-full.docx"

def count_logo_anchors(doc_xml: str) -> int:
    n = 0
    for m in re.finditer(r"<wp:anchor[^>]*>.*?</wp:anchor>", doc_xml, re.DOTALL):
        b = m.group(0)
        if "pic:pic" in b and 'behindDoc="1"' in b:
            ext = re.search(r'cx="(\d+)"', b)
            if ext and int(ext.group(1)) > 2_500_000:
                n += 1
    return n

def media_files(z: zipfile.ZipFile) -> dict[str, int]:
    return {n: len(z.read(n)) for n in z.namelist() if n.startswith("word/media/")}

# find latest converted in Downloads
downloads = Path(r"C:\Users\NiTiN Dhiman\Downloads")
converted = sorted(downloads.glob("merged (3)*.docx"), key=lambda p: p.stat().st_mtime, reverse=True)

print("=== PDF pages with CONFIDENTIAL (logo expected on same pages) ===")
import fitz
doc = fitz.open(PDF)
for pi in range(min(8, len(doc))):
    has_conf = "CONFIDENTIAL" in doc[pi].get_text()
    print(f"  page {pi+1}: CONFIDENTIAL={has_conf}")
doc.close()

if RAW.is_file():
    with zipfile.ZipFile(RAW) as z:
        doc = z.read("word/document.xml").decode()
        print("\n=== raw pdf2docx ===")
        print("logo anchors", count_logo_anchors(doc))
        print("CONF anchors", doc.count("CONFIDENTIAL"))
        for k, v in sorted(media_files(z).items(), key=lambda x: -x[1])[:5]:
            print(f"  {k}: {v}")

for p in converted[:3]:
    try:
        with zipfile.ZipFile(p) as z:
            doc = z.read("word/document.xml").decode()
            print(f"\n=== {p.name} ({p.stat().st_size} bytes) ===")
            print("logo anchors", count_logo_anchors(doc))
            print("text CONF", doc.count("CONFIDENTIAL"))
            print("media", list(media_files(z).keys()))
    except Exception as e:
        print(p.name, "err", e)
