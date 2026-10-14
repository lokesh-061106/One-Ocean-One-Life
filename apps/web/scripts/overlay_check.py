#!/usr/bin/env python3
"""Draw the slicing MANIFEST boxes over a reference infographic for visual review.

Usage: python scripts/overlay_check.py <source-index:1-7> <out.jpg>
Output -> %TEMP%/shg-contact/<out.jpg>
"""
from __future__ import annotations

import os
import sys

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import slice_shg_images as S


def main() -> None:
    idx = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    out_name = sys.argv[2] if len(sys.argv) > 2 else f"overlay-{idx}.jpg"
    src = sorted({m[1] for m in S.MANIFEST})[idx - 1]
    items = [m for m in S.MANIFEST if m[1] == src]

    im = Image.open(os.path.join(S.SRC_DIR, src)).convert("RGB")
    d = ImageDraw.Draw(im)
    try:
        font = ImageFont.truetype("arialbd.ttf", 15)
    except Exception:
        font = ImageFont.load_default()

    for name, _s, (l, t, r, b) in items:
        d.rectangle([l, t, r - 1, b - 1], outline=(255, 0, 0), width=3)
        d.text((l + 3, max(0, t + 2)), name, fill=(255, 0, 0), font=font)

    os.makedirs(S.SHEET_DIR, exist_ok=True)
    path = os.path.join(S.SHEET_DIR, out_name)
    im.save(path, quality=92)
    print(path, im.size, f"{len(items)} boxes")


if __name__ == "__main__":
    main()
