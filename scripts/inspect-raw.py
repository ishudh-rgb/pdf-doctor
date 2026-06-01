import re
import zipfile

with zipfile.ZipFile(
    r"c:\Users\NiTiN Dhiman\Documents\Cursor\pdf-doctor\test-output\raw-only.docx"
) as z:
    xml = z.read("word/document.xml").decode("utf-8")

widths = [int(m.group(1)) for m in re.finditer(r'w:tcW w:w="(\d+)"', xml)]
print("tcW min", min(widths), "max", max(widths), "narrow", len([w for w in widths if w < 800]))
print("framePr", xml.count("framePr"), "drawings", xml.count("<w:drawing"))
idx = xml.find("1. Problem")
print("problem snippet", xml[idx : idx + 800] if idx >= 0 else "not found")
