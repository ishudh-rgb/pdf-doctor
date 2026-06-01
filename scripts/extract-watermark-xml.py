#!/usr/bin/env python3
"""Extract CONFIDENTIAL watermark XML from smallpdf reference."""
from __future__ import annotations

import re
import sys
import zipfile


def main() -> int:
    path = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\NiTiN Dhiman\Downloads\smallpdf result.docx"
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8", errors="ignore")

    anchors = []
    for m in re.finditer(r"<w:p[^>]*>.*?</w:p>", xml, re.DOTALL):
        if "CONFIDENTIAL" not in m.group(0):
            continue
        p = m.group(0)
        if "w:drawing" in p:
            anchors.append(p)
    print("watermark paras with drawing:", len(anchors))
    if anchors:
        print(anchors[0][:2500])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
