"""Render each PDF page to a PNG image at 1920px width using PyMuPDF."""
import sys
import os
import json

try:
    import fitz
except ImportError:
    print(json.dumps({"error": "pymupdf not installed. Run: pip install pymupdf"}))
    sys.exit(1)

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python pdf-render-pages.py <input.pdf> <output-dir>"}))
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_dir = sys.argv[2]
    target_width = int(sys.argv[3]) if len(sys.argv) > 3 else 1920

    if not os.path.isfile(pdf_path):
        print(json.dumps({"error": f"File not found: {pdf_path}"}))
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    pdf = fitz.open(pdf_path)
    page_count = pdf.page_count
    pages = []

    for i in range(page_count):
        pg = pdf[i]
        scale = target_width / pg.rect.width
        mat = fitz.Matrix(scale, scale)
        pix = pg.get_pixmap(matrix=mat, alpha=False)

        out_path = os.path.join(output_dir, f"slide{i + 1}.jpg")
        pix.pil_save(out_path, optimize=True, quality=85)

        pages.append({
            "page": i + 1,
            "width": pix.width,
            "height": pix.height,
            "path": out_path,
        })

    pdf.close()

    print(json.dumps({"pageCount": page_count, "pages": pages}))

if __name__ == "__main__":
    main()
