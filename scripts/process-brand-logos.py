"""Trim logo PNGs, remove light grey background, export tight white-bg versions."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / "public" / "logos"
OUT_DIR = SRC_DIR / "clean"

SOURCES = [
    ("logo-a-horizontal.png", "logo-a-horizontal-clean.png"),
    ("logo-b-stacked.png", "logo-b-stacked-clean.png"),
    ("logo-c-embossed.png", "logo-c-embossed-clean.png"),
    ("logo-d-gradient.png", "logo-d-gradient-clean.png"),
]

BG_THRESHOLD = 238
CONTENT_THRESHOLD = 245


def flatten_white(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r >= BG_THRESHOLD and g >= BG_THRESHOLD and b >= BG_THRESHOLD:
                px[x, y] = (255, 255, 255, 0)
    flat = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
    flat.paste(rgba, (0, 0), rgba)
    return flat


def trim_content(img: Image.Image) -> Image.Image:
    rgb = np.array(img.convert("RGB"))
    mask = (
        (rgb[:, :, 0] < CONTENT_THRESHOLD)
        | (rgb[:, :, 1] < CONTENT_THRESHOLD)
        | (rgb[:, :, 2] < CONTENT_THRESHOLD)
    )
    rows = np.where(mask.any(axis=1))[0]
    cols = np.where(mask.any(axis=0))[0]
    if rows.size == 0 or cols.size == 0:
        return img
    pad = 4
    top = max(int(rows[0]) - pad, 0)
    bottom = min(int(rows[-1]) + pad + 1, rgb.shape[0])
    left = max(int(cols[0]) - pad, 0)
    right = min(int(cols[-1]) + pad + 1, rgb.shape[1])
    return img.crop((left, top, right, bottom))


def process_logo(src: Path, dest: Path) -> None:
    img = flatten_white(Image.open(src))
    img = trim_content(img)
    img.save(dest, "PNG", optimize=True)
    print(f"{dest.name}: {img.size[0]}x{img.size[1]}")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for src_name, out_name in SOURCES:
        process_logo(SRC_DIR / src_name, OUT_DIR / out_name)


if __name__ == "__main__":
    main()
