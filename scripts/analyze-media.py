#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
import zipfile


def main() -> None:
    path = sys.argv[1]
    with zipfile.ZipFile(path) as z:
        entries = {n: z.read(n) for n in z.namelist()}
        media = [n for n in z.namelist() if n.startswith("word/media/")]
        refs: set[str] = set()
        for name, data in entries.items():
            if name.endswith(".xml") or name.endswith(".rels"):
                text = data.decode("utf-8", errors="ignore")
                refs.update(re.findall(r"media/([^\s\"'>]+)", text))
        print("media files", len(media), "referenced", len(refs))
        for item in sorted(media):
            fn = item.split("/")[-1]
            size_kb = round(len(entries[item]) / 1024, 1)
            status = "used" if fn in refs else "UNUSED"
            print(f"  {fn}: {size_kb} KB ({status})")


if __name__ == "__main__":
    main()
