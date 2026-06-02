"""
Extract tables from a PDF using PyMuPDF's built-in table detection.
Outputs JSON with all tables found across all pages.

Usage: python pdf-extract-tables.py <input.pdf> <output_dir>
"""

import sys
import os
import json
import warnings
warnings.filterwarnings("ignore")
os.environ["PYMUPDF_MESSAGE"] = "fd:2"

import fitz

try:
    fitz.TOOLS.mupdf_warnings(False)
except Exception:
    pass


def clean_cell(value):
    """Clean a cell value: strip whitespace, normalize newlines."""
    if value is None:
        return ""
    s = str(value).strip()
    s = s.replace("\n", " ").replace("\r", " ")
    while "  " in s:
        s = s.replace("  ", " ")
    return s.strip()


def normalize_row(row):
    return tuple(clean_cell(c).lower() for c in row)


def is_likely_header(row):
    """A header row has mostly alphabetic/word-like cells (no currency, no dates, no IDs)."""
    cleaned = [clean_cell(c) for c in row]
    non_empty = [c for c in cleaned if c]
    if len(non_empty) < 2:
        return False

    alpha_word_count = 0
    for c in non_empty:
        # A "word-like" cell: starts with a letter and is mostly alphabetic
        stripped = c.replace(" ", "").replace(".", "").replace("-", "").replace("(", "").replace(")", "")
        if stripped and stripped[0].isalpha() and sum(1 for ch in stripped if ch.isalpha()) > len(stripped) * 0.6:
            alpha_word_count += 1

    # At least 60% of non-empty cells should be word-like for a header
    return alpha_word_count >= len(non_empty) * 0.6


def extract_tables(pdf_path, output_dir):
    doc = fitz.open(pdf_path)

    all_page_tables = []

    for page_idx in range(doc.page_count):
        page = doc[page_idx]
        tabs = page.find_tables()

        page_tables = []
        for t in tabs.tables:
            extracted = t.extract()
            rows = []
            for row in extracted:
                cleaned = [clean_cell(c) for c in row]
                if all(c == "" for c in cleaned):
                    continue
                rows.append(cleaned)
            if rows:
                page_tables.append({
                    "rows": rows,
                    "row_count": len(rows),
                    "col_count": len(rows[0]) if rows else 0,
                })

        all_page_tables.append({
            "page": page_idx + 1,
            "tables": page_tables,
            "width": page.rect.width,
            "height": page.rect.height,
        })

    pages_text = []
    for page_idx in range(doc.page_count):
        page = doc[page_idx]
        text = page.get_text("text")
        pages_text.append(text)

    doc.close()

    merged = merge_page_tables(all_page_tables)

    result = {
        "pageCount": len(all_page_tables),
        "pages": all_page_tables,
        "mergedTables": merged,
        "pagesText": pages_text,
    }

    out_path = os.path.join(output_dir, "tables.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False)

    print(json.dumps({
        "success": True,
        "pageCount": len(all_page_tables),
        "mergedTableCount": len(merged),
        "outputPath": out_path,
    }))


def merge_page_tables(all_pages):
    """
    Merge tables across pages:
    1. Group all tables by column count
    2. Within each group, find any header row, then concatenate all data rows
    """
    flat_tables = []
    for page_info in all_pages:
        for t in page_info["tables"]:
            if t["row_count"] > 0 and t["col_count"] > 0:
                flat_tables.append(t)

    if not flat_tables:
        return []

    by_col_count = {}
    for t in flat_tables:
        cc = t["col_count"]
        by_col_count.setdefault(cc, []).append(t)

    merged_results = []

    for col_count, tables in by_col_count.items():
        # Find a header row: check the first row of each table
        header = None
        header_norm = None
        for t in tables:
            if t["rows"] and is_likely_header(t["rows"][0]):
                header = t["rows"][0]
                header_norm = normalize_row(header)
                break

        # Collect all data rows, skipping header duplicates
        combined_rows = []
        if header is not None:
            combined_rows.append(header)

        for t in tables:
            for row in t["rows"]:
                norm = normalize_row(row)
                # Skip if this row matches the header
                if header_norm is not None and norm == header_norm:
                    continue
                # Skip empty rows
                if all(c == "" for c in [clean_cell(x) for x in row]):
                    continue
                combined_rows.append([clean_cell(c) for c in row])

        if combined_rows:
            merged_results.append({
                "rows": combined_rows,
                "row_count": len(combined_rows),
                "col_count": col_count,
            })

    merged_results.sort(key=lambda t: t["row_count"], reverse=True)
    return merged_results


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: pdf-extract-tables.py <input.pdf> <output_dir>"}))
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_dir = sys.argv[2]

    if not os.path.exists(pdf_path):
        print(json.dumps({"error": f"File not found: {pdf_path}"}))
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    try:
        extract_tables(pdf_path, output_dir)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
