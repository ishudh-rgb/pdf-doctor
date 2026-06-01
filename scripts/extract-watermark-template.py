#!/usr/bin/env python3
"""Extract CONFIDENTIAL watermark run XML from smallpdf reference."""
from __future__ import annotations

import re
import zipfile
from pathlib import Path

REF = Path(r"C:\Users\NiTiN Dhiman\Downloads\smallpdf result.docx")
OUT_DIR = Path(__file__).resolve().parent / "templates"


def main() -> None:
    xml = zipfile.ZipFile(REF).read("word/document.xml").decode("utf-8", errors="ignore")
    start = xml.find("<mc:AlternateContent>")
    end = xml.find("</mc:AlternateContent>", start)
    if start < 0 or end < 0:
        raise SystemExit("AlternateContent not found")

    block = xml[start : end + len("</mc:AlternateContent>")]
    if "CONFIDENTIAL" not in block:
        raise SystemExit("CONFIDENTIAL not in block")

    run_start = xml.rfind("<w:r>", 0, start)
    run_end = xml.find("</w:r>", end) + len("</w:r>")
    run_xml = xml[run_start:run_end]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "confidential-watermark-run.xml").write_text(run_xml, encoding="utf-8")
    print("saved run", len(run_xml))


if __name__ == "__main__":
    main()
