#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path

import fitz


def main() -> None:
    pdf_path = sys.argv[1]
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else None
    lines: list[str] = []
    doc = fitz.open(pdf_path)
    for page_idx in range(min(10, len(doc))):
        page = doc[page_idx]
        for block in page.get_text("dict")["blocks"]:
            if block.get("type") != 0:
                continue
            for line in block["lines"]:
                text = "".join(span["text"] for span in line["spans"]).strip()
                if not text:
                    continue
                x0 = min(span["bbox"][0] for span in line["spans"])
                if re.match(r"^\d+\.\s", text):
                    lines.append(f"p{page_idx+1} x={x0:.1f} DECIMAL {text}")
                elif x0 > 60 and len(text) > 20:
                    lines.append(f"p{page_idx+1} x={x0:.1f} SUB      {text[:70]}")
    text = "\n".join(lines)
    if out:
        out.write_text(text, encoding="utf-8")
    else:
        sys.stdout.buffer.write(text.encode("utf-8"))


if __name__ == "__main__":
    main()
