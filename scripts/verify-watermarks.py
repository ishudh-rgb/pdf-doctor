#!/usr/bin/env python3
"""Verify CONFIDENTIAL text + logo image watermarks in converted DOCX."""
import re
import sys
import zipfile
from pathlib import Path

def count_logo_anchors(doc_xml: str) -> int:
    n = 0
    for m in re.finditer(r"<wp:anchor[^>]*>.*?</wp:anchor>", doc_xml, re.DOTALL):
        b = m.group(0)
        if "pic:pic" in b and 'behindDoc="1"' in b:
            ext = re.search(r'cx="(\d+)"', b)
            if ext and int(ext.group(1)) > 2_500_000:
                n += 1
    return n

def main(docx_path: str) -> None:
    p = Path(docx_path)
    with zipfile.ZipFile(p) as z:
        doc = z.read("word/document.xml").decode()
        media = [n for n in z.namelist() if n.startswith("word/media/")]
    print(f"file: {p.name} ({p.stat().st_size} bytes)")
    print("CONFIDENTIAL text anchors:", doc.count("CONFIDENTIAL"))
    print("logo image anchors:", count_logo_anchors(doc))
    print("media:", media)
    ok = doc.count("CONFIDENTIAL") >= 8 and count_logo_anchors(doc) >= 8
    print("PASS" if ok else "FAIL")

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\test-output\merged-test.docx")
