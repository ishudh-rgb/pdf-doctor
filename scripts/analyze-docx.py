#!/usr/bin/env python3
import re
import sys
import zipfile


def analyze(path: str) -> None:
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8", errors="ignore")
        media = [n for n in z.namelist() if "media" in n]

    widths = [int(m.group(1)) for m in re.finditer(r'w:tcW w:w="(\d+)"', xml)]
    print(f"=== {path} ===")
    print("size", __import__("os").path.getsize(path))
    print("media", len(media), "drawings", xml.count("<w:drawing"))
    if widths:
        print("tcW min", min(widths), "max", max(widths), "count", len(widths))
        print("narrow (<800)", sorted(set(w for w in widths if w < 800))[:15])
    print("framePr", xml.count("w:framePr"), "numPr", xml.count("w:numPr"))
    print("white shd", len(re.findall(r'w:shd[^>]*w:fill="FFFFFF"', xml, re.I)))


if __name__ == "__main__":
    for p in sys.argv[1:]:
        analyze(p)
