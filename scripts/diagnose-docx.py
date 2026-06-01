#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
import zipfile


def main() -> None:
    path = sys.argv[1]
    with zipfile.ZipFile(path) as z:
        doc = z.read("word/document.xml").decode("utf-8", errors="ignore")
        root = doc[:800]
        print("ROOT:", root)
        print("mc in doc:", "mc:AlternateContent" in doc)
        print("xmlns:mc in doc:", "xmlns:mc" in doc[:2000])
        ids = re.findall(r'wp:docPr id="(\d+)"', doc)
        from collections import Counter

        dups = [k for k, v in Counter(ids).items() if v > 1]
        print("docPr count", len(ids), "duplicates", dups[:15])
        print("drawings", doc.count("w:drawing"), "CONFIDENTIAL", doc.count("CONFIDENTIAL"))
        media = [n for n in z.namelist() if n.startswith("word/media/")]
        print("media files", len(media), "total size", sum(z.getinfo(n).file_size for n in media))


if __name__ == "__main__":
    main()
