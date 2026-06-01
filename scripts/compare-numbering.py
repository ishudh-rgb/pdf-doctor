#!/usr/bin/env python3
from __future__ import annotations

import sys
import zipfile
import re
from docx import Document
from docx.oxml.ns import qn


def main() -> None:
    ref = sys.argv[1]
    ours = sys.argv[2]
    for label, path in [("REF", ref), ("OURS", ours)]:
        with zipfile.ZipFile(path) as z:
            doc_xml = z.read("word/document.xml").decode("utf-8", errors="ignore")
        n1 = len(re.findall(r'w:numId w:val="1"', doc_xml))
        n2 = len(re.findall(r'w:numId w:val="2"', doc_xml))
        n3 = len(re.findall(r'w:numId w:val="3"', doc_xml))
        print(label, "numId1(decimal?)", n1, "numId2(bullet?)", n2, "numId3", n3)

        doc = Document(path)
        decimal_samples = []
        for p in doc.paragraphs:
            t = p.text.strip()
            if not t:
                continue
            ppr = p._p.find(qn("w:pPr"))
            if ppr is None:
                continue
            num = ppr.find(qn("w:numPr"))
            if num is None:
                continue
            nid = num.find(qn("w:numId"))
            if nid is None:
                continue
            val = nid.get(qn("w:val"))
            if val == "1" and len(decimal_samples) < 8:
                decimal_samples.append(t[:70])
        print("  decimal samples:", decimal_samples[:5])


if __name__ == "__main__":
    main()
