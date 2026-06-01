#!/usr/bin/env python3
"""Map watermark anchor paragraphs to Word page breaks vs PDF markers."""
import re
import sys
import zipfile
from pathlib import Path

import fitz

PDF = r"C:\Users\NiTiN Dhiman\Downloads\merged (3).pdf"
DOCX = sys.argv[1] if len(sys.argv) > 1 else r"test-output\merged-test.docx"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from smallpdf_transform import extract_pdf_watermark_markers, WATERMARK_ANCHORS, _norm_key


def para_texts(doc_xml: str) -> list[str]:
    texts = []
    for m in re.finditer(r"<w:p\b[^>]*>(.*?)</w:p>", doc_xml, re.DOTALL):
        block = m.group(1)
        t = "".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", block)).strip()
        texts.append(t)
    return texts


def find_watermark_paras(doc_xml: str) -> list[dict]:
    items = []
    pos = 0
    for m in re.finditer(r"<w:p\b[^>]*>.*?</w:p>", doc_xml, re.DOTALL):
        block = m.group(0)
        has_conf = "CONFIDENTIAL" in block and "wp:anchor" in block
        has_logo = "pic:pic" in block and 'behindDoc="1"' in block
        if has_conf or has_logo:
            # next non-empty text para
            items.append({"idx": pos, "conf": has_conf, "logo": has_logo, "preview": block[:120]})
        pos += 1
    return items


def next_nonempty(texts: list[str], start: int) -> str:
    for i in range(start, min(start + 5, len(texts))):
        if texts[i].strip():
            return texts[i][:80]
    return ""


with zipfile.ZipFile(DOCX) as z:
    doc = z.read("word/document.xml").decode()

texts = para_texts(doc)
markers = extract_pdf_watermark_markers(PDF)
if len(markers) < 8:
    markers = list(WATERMARK_ANCHORS[:8])

print("PDF markers:")
for i, m in enumerate(markers):
    print(f"  p{i+1}: {m[:70]}")

print("\nWatermark anchor paragraphs in DOCX:")
para_idx = 0
for i, m in enumerate(re.finditer(r"<w:p\b[^>]*>.*?</w:p>", doc, re.DOTALL)):
    block = m.group(0)
    has_conf = "CONFIDENTIAL" in block and "wp:anchor" in block
    has_logo = "pic:pic" in block and 'behindDoc="1"' in block
    if has_conf or has_logo:
        nxt = next_nonempty(texts, i + 1)
        print(f"  para {i}: conf={has_conf} logo={has_logo} -> next: {nxt!r}")

# count page breaks (sectPr in pPr = section/page break)
sect_breaks = [i for i, m in enumerate(re.finditer(r"<w:p\b[^>]*>.*?</w:p>", doc, re.DOTALL)) if "<w:sectPr" in m.group(0)]
print(f"\nSection breaks at paragraphs: {sect_breaks[:15]}... total={len(sect_breaks)}")

# PDF page 1 first lines
docp = fitz.open(PDF)
p0 = docp[0]
lines = []
for b in p0.get_text("dict")["blocks"]:
    if b.get("type") != 0:
        continue
    for line in b["lines"]:
        t = "".join(s["text"] for s in line["spans"]).strip()
        if t:
            lines.append(t)
print("\nPDF page 1 first text lines:")
for t in lines[:8]:
    print(f"  {t[:80]}")
docp.close()

# Find title para index in docx
for i, t in enumerate(texts[:30]):
    if "Founder Summary" in t or "Problem" in t[:20]:
        print(f"  docx para {i}: {t[:80]}")
