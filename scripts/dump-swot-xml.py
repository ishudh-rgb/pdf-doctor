#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
import zipfile


def dump(path: str) -> None:
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8", errors="ignore")
        try:
            num = z.read("word/numbering.xml").decode("utf-8", errors="ignore")
        except KeyError:
            num = ""

    print(f"\n=== {path} ===")
    idx = xml.find("Suggested response")
    if idx >= 0:
        chunk = xml[idx : idx + 4000]
        for m in re.finditer(r"<w:p[^>]*>.*?</w:p>", chunk, re.DOTALL):
            texts = re.findall(r"<w:t[^>]*>([^<]*)</w:t>", m.group(0))
            if not texts:
                continue
            p = m.group(0)
            if "Suggested response" in "".join(texts) and len("".join(texts)) < 30:
                continue
            num_id = re.search(r'w:numId w:val="(\d+)"', p)
            ilvl = re.search(r'w:ilvl w:val="(\d+)"', p)
            pstyle = re.search(r'w:pStyle w:val="([^"]+)"', p)
            has_drawing = "w:drawing" in p
            print(
                " ".join(texts)[:55],
                "| numId",
                num_id.group(1) if num_id else "-",
                "ilvl",
                ilvl.group(1) if ilvl else "-",
                "style",
                pstyle.group(1) if pstyle else "-",
                "drawing",
                has_drawing,
            )

    if num:
        for m in re.finditer(r'<w:abstractNum w:abstractNumId="(\d+)".*?</w:abstractNum>', num, re.DOTALL):
            if 'w:lvl w:ilvl="0"' in m.group(0):
                lvl_text = re.search(r'w:lvlText w:val="([^"]*)"', m.group(0))
                num_fmt = re.search(r'w:numFmt w:val="([^"]*)"', m.group(0))
                print("abstractNum", m.group(1), "fmt", num_fmt.group(1) if num_fmt else "?", "text", lvl_text.group(1) if lvl_text else "?")


if __name__ == "__main__":
    for p in sys.argv[1:]:
        dump(p)
