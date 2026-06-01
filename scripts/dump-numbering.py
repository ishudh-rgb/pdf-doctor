#!/usr/bin/env python3
import re
import zipfile
import sys

path = sys.argv[1]
with zipfile.ZipFile(path) as z:
    num = z.read("word/numbering.xml").decode("utf-8", errors="ignore")

for m in re.finditer(r"<w:num w:numId=\"(\d+)\">.*?</w:num>", num, re.DOTALL):
    aid = re.search(r"w:abstractNumId w:val=\"(\d+)\"", m.group(0))
    print("numId", m.group(1), "-> abstractNumId", aid.group(1) if aid else "?")

for m in re.finditer(r"<w:abstractNum w:abstractNumId=\"(\d+)\">.*?</w:abstractNum>", num, re.DOTALL):
    fmt = re.search(r'w:lvl w:ilvl="0".*?w:numFmt w:val="([^"]*)"', m.group(0), re.DOTALL)
    txt = re.search(r'w:lvl w:ilvl="0".*?w:lvlText w:val="([^"]*)"', m.group(0), re.DOTALL)
    if fmt:
        print("abstractNum", m.group(1), "fmt", fmt.group(1), "lvlText", txt.group(1) if txt else "")
