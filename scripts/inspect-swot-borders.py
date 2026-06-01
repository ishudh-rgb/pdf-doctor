#!/usr/bin/env python3
"""Inspect SWOT table border XML in a DOCX."""
from __future__ import annotations

import re
import sys
import zipfile


def main() -> int:
    path = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\NiTiN Dhiman\Downloads\smallpdf result.docx"
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8", errors="ignore")

    for m in re.finditer(r"<w:tbl>.*?</w:tbl>", xml, re.DOTALL):
        chunk = m.group(0)
        if "Strengths" in chunk and "Weaknesses" in chunk and "Opportunities" in chunk:
            pr = re.search(r"<w:tblPr>.*?</w:tblPr>", chunk, re.DOTALL)
            if pr:
                print(pr.group(0))
            tc = re.search(r"<w:tcPr>.*?</w:tcPr>", chunk, re.DOTALL)
            if tc:
                print("--- first cell tcPr ---")
                print(tc.group(0)[:800])
            break
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
