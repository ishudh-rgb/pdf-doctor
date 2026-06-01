#!/usr/bin/env python3
from pathlib import Path

import zipfile
from docx import Document
from docx.oxml.ns import qn

p = r"C:\Users\NiTiN Dhiman\Downloads\merged (3) (18).docx"
d = Document(p)
lines = []
body = zipfile.ZipFile(p).read("word/document.xml").decode()
hdr_files = [n for n in zipfile.ZipFile(p).namelist() if n.startswith("word/header")]
hdr_conf = 0
for hf in hdr_files:
    hdr_conf += zipfile.ZipFile(p).read(hf).decode().count("CONFIDENTIAL")
lines.append(f"sections={len(d.sections)} headers={hdr_files} hdr_CONF={hdr_conf}")
lines.append(f"body_CONF={body.count('CONFIDENTIAL')} body_wm_paras={body.count('v:shape')}")
lines.append(f"landscape_sect={body.count('orient=\"landscape\"')}")
for i, t in enumerate(d.tables):
    cols = len(t.columns)
    tx = "".join(c.text for r in t.rows for c in r.cells)
    grid = t._tbl.find(qn("w:tblGrid"))
    ws = [int(c.get(qn("w:w"), 0)) for c in grid.findall(qn("w:gridCol"))] if grid is not None else []
    tot = sum(ws)
    if cols >= 4 or "Sl" in tx:
        lines.append(f"tbl{i} cols={cols} sum={tot} ledger={'Sl' in tx}")
Path(r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\scripts\verify-18.txt").write_text(
    "\n".join(lines), encoding="utf-8"
)
