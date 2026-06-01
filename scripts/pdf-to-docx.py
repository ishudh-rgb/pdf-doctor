#!/usr/bin/env python3
"""PDF → DOCX using raw pdf2docx + Smallpdf result layout transform."""
from __future__ import annotations

import os
import sys
import zipfile
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent


def optimal_settings() -> dict:
    return {
        "multi_processing": False,
        "cpu_count": 1,
        "ignore_page_error": True,
        "delete_end_line_hyphen": True,
        "parse_lattice_table": True,
        "parse_stream_table": True,
        "list_not_table": False,
    }


def docx_metrics(docx_path: str) -> dict[str, int]:
    import re

    with zipfile.ZipFile(docx_path) as archive:
        xml = archive.read("word/document.xml").decode("utf-8", errors="ignore")
        media = len([n for n in archive.namelist() if n.startswith("word/media/")])

    chars = sum(len(m) for m in re.findall(r"<w:t[^>]*>([^<]*)</w:t>", xml))
    return {
        "tables": xml.count("<w:tbl>"),
        "drawings": xml.count("<w:drawing"),
        "media": media,
        "numPr": xml.count("<w:numPr"),
        "chars": chars,
    }


def validate_docx(docx_path: str) -> bool:
    if not os.path.isfile(docx_path) or os.path.getsize(docx_path) < 5000:
        return False
    try:
        with zipfile.ZipFile(docx_path) as archive:
            xml = archive.read("word/document.xml").decode("utf-8", errors="ignore")
            return "<w:t" in xml and docx_metrics(docx_path)["chars"] > 1000
    except zipfile.BadZipFile:
        return False


def convert_pdf(pdf_path: str, docx_path: str) -> bool:
    import re
    from pdf2docx import Converter

    sys.path.insert(0, str(SCRIPT_DIR))
    from smallpdf_transform import transform_to_smallpdf
    cv = Converter(pdf_path)
    try:
        cv.convert(docx_path, start=0, end=None, **optimal_settings())
    finally:
        cv.close()

    transform_to_smallpdf(docx_path, pdf_path)
    return validate_docx(docx_path)


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: pdf-to-docx.py <input.pdf> <output.docx>", file=sys.stderr)
        return 1

    import logging

    logging.getLogger("pdf2docx").setLevel(logging.WARNING)

    pdf_path, docx_path = sys.argv[1], sys.argv[2]

    try:
        from pdf2docx import Converter  # noqa: F401
    except ImportError:
        print("pdf2docx not installed. Run: pip install pdf2docx", file=sys.stderr)
        return 2

    if not convert_pdf(pdf_path, docx_path):
        print("Conversion produced invalid DOCX", file=sys.stderr)
        return 3

    metrics = docx_metrics(docx_path)
    print(
        f"OK tables={metrics['tables']} drawings={metrics['drawings']} "
        f"media={metrics['media']} numPr={metrics['numPr']} chars={metrics['chars']}",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
