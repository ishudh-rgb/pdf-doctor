import re
import zipfile

our = r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\test-output\merged-fixed.docx"
ref = r"C:\Users\NiTiN Dhiman\Downloads\merged (3).docx"

for label, path, marker in [
    ("OUR-Problem", our, "1. Problem Statement"),
    ("REF-Problem", ref, "1. Problem Statement"),
    ("OUR-Mkt", our, "8. Marketing Model"),
    ("REF-Mkt", ref, "8. Marketing Model"),
]:
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode()
    idx = xml.find(marker)
    chunk = xml[idx : idx + 8000]
    widths = [int(x) for x in re.findall(r'w:tcW[^>]*w:w="(\d+)"', chunk)]
    print(f"\n{label} @ {marker}")
    print(f"  tables={chunk.count('<w:tbl>')} numPr={chunk.count('<w:numPr>')} tcW={widths[:15]} min={min(widths) if widths else 'n/a'}")
    for p in re.findall(r"<w:p\b[\s\S]*?</w:p>", chunk):
        if "<w:tbl" in p:
            continue
        t = "".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", p))
        if t.strip():
            print(f"  P: {t[:100]}")
