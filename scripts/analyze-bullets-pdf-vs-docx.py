#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
import zipfile
from pathlib import Path

import fitz
from docx import Document
from docx.oxml.ns import qn


def pdf_lines(pdf_path: str, page_idx: int = 0) -> list[tuple[float, str, str]]:
    doc = fitz.open(pdf_path)
    page = doc[page_idx]
    out: list[tuple[float, str, str]] = []
    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            text = "".join(span["text"] for span in line["spans"]).strip()
            if not text:
                continue
            x0 = min(span["bbox"][0] for span in line["spans"])
            kind = "plain"
            if re.match(r"^\d+\.\s", text):
                kind = "decimal"
            elif text[:1] in {"•", "·", "◦", "-", "▪"}:
                kind = "dot"
            elif re.match(r"^[a-z]\)", text):
                kind = "alpha"
            out.append((x0, kind, text))
    return out


def docx_paras(docx_path: str, limit: int = 40) -> list[tuple[int | None, str, str]]:
    doc = Document(docx_path)
    rows: list[tuple[int | None, str, str]] = []
    for paragraph in doc.paragraphs[:limit]:
        text = paragraph.text.strip()
        if not text:
            continue
        num_id = None
        p_pr = paragraph._p.find(qn("w:pPr"))
        if p_pr is not None:
            num_pr = p_pr.find(qn("w:numPr"))
            if num_pr is not None:
                nid = num_pr.find(qn("w:numId"))
                if nid is not None:
                    num_id = int(nid.get(qn("w:val")))
        rows.append((num_id, text[:80], text))
    return rows


def main() -> None:
    pdf_path = sys.argv[1]
    docx_path = sys.argv[2]
    out_path = sys.argv[3] if len(sys.argv) > 3 else None
    lines: list[str] = []

    def emit(line: str = "") -> None:
        lines.append(line)

    emit("=== PDF page 1 ===")
    for x0, kind, text in pdf_lines(pdf_path, 0)[:30]:
        emit(f"  x={x0:6.1f} {kind:7s} {text}")

    emit("\n=== DOCX paras ===")
    for num_id, preview, _ in docx_paras(docx_path, 40):
        label = f"numId={num_id}" if num_id else "no-list"
        emit(f"  {label:10s} {preview}")

    with zipfile.ZipFile(docx_path) as z:
        xml = z.read("word/document.xml").decode("utf-8", errors="ignore")
    emit("\n=== DOCX stats ===")
    emit(f"  numPr: {xml.count('<w:numPr')}")
    emit(f"  numId1: {xml.count('w:numId w:val=\"1\"')}")
    emit(f"  numId2: {xml.count('w:numId w:val=\"2\"')}")
    emit(f"  CONF: {xml.count('CONFIDENTIAL')}")

    text = "\n".join(lines)
    if out_path:
        Path(out_path).write_text(text, encoding="utf-8")
    else:
        sys.stdout.buffer.write(text.encode("utf-8"))


if __name__ == "__main__":
    main()
