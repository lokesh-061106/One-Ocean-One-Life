#!/usr/bin/env python3
"""
Slice individual photos out of the 7 reference infographic images in
docs/Cirucular Economy/ and export them as WebP assets for the
Fisherwomen SHG "Waste to Wealth" web module.

Usage:
    python scripts/slice_shg_images.py            # slice + write WebP assets
    python scripts/slice_shg_images.py --sheets   # write contact sheets for review
    python scripts/slice_shg_images.py --grid     # write coordinate-grid overlays

Outputs -> apps/web/public/shg/*.webp
Sheets  -> %TEMP%/shg-contact/
"""

from __future__ import annotations

import os
import sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
SRC_DIR = os.path.join(ROOT, "docs", "Cirucular Economy")
OUT_DIR = os.path.join(ROOT, "apps", "web", "public", "shg")
SHEET_DIR = os.path.join(os.environ.get("TEMP", ROOT), "shg-contact")

S1 = "1 Why the current SHG model is already a circular economy.png"
S2 = "2 How to bring or deepen the Circular Economy.png"
S3 = "3 Revenue Oppotunities for FisherWolmen SHGs.png"
S4 = "4 How to get loans and dfinancial support.png"
S5 = "5 Marketing Strategies - Popular South Indian Recipies.JPG"
S6 = "6 Marketing Strategies - Fresh From the Sea.png"
S7 = "7 Marketing Strategies - From Sea to Plate to Prosperity.png"

# name, source, (left, top, right, bottom) — verified against grid overlays
MANIFEST: list[tuple[str, str, tuple[int, int, int, int]]] = [
    # ---------------- Page 1 : why it already IS circular ----------------
    ("p1-woman-processing", S1, (10, 458, 176, 805)),
    ("p1-poultry-feed", S1, (246, 437, 456, 498)),
    ("p1-fish-meal", S1, (246, 559, 456, 627)),
    ("p1-liquid-fertilizer", S1, (246, 690, 306, 780)),
    ("p1-solar-yard", S1, (490, 537, 886, 641)),
    ("p1-dried-fish", S1, (490, 647, 605, 767)),
    ("p1-pickled-fish", S1, (610, 647, 750, 767)),
    ("p1-smoked-fish", S1, (755, 647, 887, 767)),
    ("p1-seaweed-farm", S1, (914, 403, 1151, 497)),
    ("p1-seaweed-woman", S1, (914, 498, 1151, 821)),
    ("p1-banner-women", S1, (0, 1017, 316, 1145)),
    ("p1-banner-boats", S1, (1118, 1017, 1234, 1145)),

    # ---------------- Page 2 : deepening the model ----------------
    ("p2-plastic-waste", S2, (194, 266, 380, 415)),
    ("p2-bio-bags", S2, (200, 417, 380, 541)),
    ("p2-crates", S2, (200, 546, 380, 716)),
    ("p2-solar-tunnel", S2, (558, 419, 753, 507)),
    ("p2-solar-ice", S2, (558, 549, 753, 661)),
    ("p2-shell-waste", S2, (948, 264, 1130, 454)),
    ("p2-chitin", S2, (948, 458, 1130, 553)),
    ("p2-eco-icons", S2, (950, 605, 1148, 661)),
    ("p2-cold-hub", S2, (1338, 463, 1534, 598)),
    ("p2-truck", S2, (1338, 599, 1534, 714)),
    ("p2-banner-women", S2, (0, 884, 432, 1024)),
    ("p2-banner-sign", S2, (1368, 886, 1534, 1004)),

    # ---------------- Page 3 : revenue opportunity thumbnails ----------------
    ("p3-meal-feed", S3, (974, 185, 1213, 268)),
    ("p3-fertilizer", S3, (974, 272, 1213, 362)),
    ("p3-dried-fish", S3, (974, 368, 1213, 455)),
    ("p3-pickled-fish", S3, (974, 462, 1213, 552)),
    ("p3-seaweed", S3, (974, 557, 1104, 649)),
    ("p3-chitin", S3, (974, 654, 1104, 744)),
    ("p3-cold-storage", S3, (974, 747, 1104, 851)),
    ("p3-transport", S3, (974, 855, 1094, 949)),
    ("p3-hero-women", S3, (0, 1028, 446, 1285)),
    ("p3-hero-boats", S3, (840, 1028, 1070, 1188)),

    # ---------------- Page 4 : loans ----------------
    ("p4-shg-meeting", S4, (386, 183, 601, 301)),
    ("p4-business-plan", S4, (418, 325, 602, 465)),
    ("p4-bank", S4, (412, 479, 602, 623)),
    ("p4-loan-approved", S4, (425, 642, 601, 774)),
    ("p4-solar-equipment", S4, (378, 780, 606, 942)),
    ("p4-documents", S4, (1041, 655, 1215, 864)),
    ("p4-group-sign", S4, (616, 866, 1224, 1188)),

    # ---------------- Page 5 : recipes (fish + dish per recipe) ----------------
    ("r01-sardine-fish", S5, (6, 204, 145, 295)),
    ("r01-sardine-dish", S5, (6, 295, 145, 366)),
    ("r02-mackerel-fish", S5, (148, 204, 291, 295)),
    ("r02-mackerel-dish", S5, (148, 295, 291, 366)),
    ("r03-seer-fish", S5, (301, 204, 443, 295)),
    ("r03-seer-dish", S5, (301, 295, 443, 366)),
    ("r04-pomfret-fish", S5, (446, 204, 584, 295)),
    ("r04-pomfret-dish", S5, (446, 295, 584, 366)),
    ("r05-tuna-fish", S5, (594, 204, 728, 295)),
    ("r05-tuna-dish", S5, (594, 295, 728, 366)),
    ("r06-anchovy-fish", S5, (6, 592, 145, 656)),
    ("r06-anchovy-dish", S5, (6, 656, 145, 767)),
    ("r07-threadfin-fish", S5, (148, 592, 291, 656)),
    ("r07-threadfin-dish", S5, (148, 656, 291, 767)),
    ("r08-ribbon-fish", S5, (301, 592, 443, 656)),
    ("r08-ribbon-dish", S5, (301, 656, 443, 767)),
    ("r09-bass-fish", S5, (446, 592, 584, 656)),
    ("r09-bass-dish", S5, (446, 656, 584, 767)),
    ("r10-snapper-fish", S5, (594, 592, 728, 656)),
    ("r10-snapper-dish", S5, (594, 656, 728, 767)),

    # ---------------- Page 6 : fresh fish cards ----------------
    ("f01-sardine", S6, (8, 156, 385, 315)),
    ("f02-mackerel", S6, (392, 156, 765, 315)),
    ("f03-seer", S6, (772, 156, 1145, 315)),
    ("f04-pomfret", S6, (1153, 156, 1528, 315)),
    ("f05-tuna", S6, (8, 438, 385, 601)),
    ("f06-anchovy", S6, (392, 438, 765, 601)),
    ("f07-threadfin", S6, (772, 438, 1145, 601)),
    ("f08-ribbon", S6, (1153, 438, 1528, 601)),
    ("f09-bass", S6, (8, 723, 385, 894)),
    ("f10-snapper", S6, (392, 723, 765, 894)),
    ("f-hero-meal", S6, (918, 795, 1148, 1012)),
    ("f-harbour", S6, (1370, 0, 1536, 150)),

    # ---------------- Page 7 : sea → plate → prosperity ----------------
    ("p7-harvest", S7, (222, 217, 362, 395)),
    ("p7-landing", S7, (436, 217, 634, 402)),
    ("p7-market", S7, (782, 217, 856, 362)),
    ("p7-meals", S7, (1315, 217, 1536, 440)),
    ("p7-children", S7, (14, 513, 265, 647)),
    ("p7-vp-dried", S7, (1012, 534, 1109, 596)),
    ("p7-vp-pickle", S7, (1127, 534, 1198, 596)),
    ("p7-vp-cutlet", S7, (1217, 534, 1300, 596)),
    ("p7-vp-ready", S7, (1010, 638, 1128, 706)),
    ("p7-vp-masala", S7, (1174, 637, 1296, 686)),
    ("p7-role-fishermen", S7, (796, 810, 932, 944)),
    ("p7-role-fisherwomen", S7, (943, 810, 1098, 944)),
    ("p7-role-vendors", S7, (1108, 810, 1228, 944)),
    ("p7-role-stall", S7, (1240, 810, 1373, 944)),
    ("p7-role-shg", S7, (1385, 810, 1526, 944)),
    ("p7-bp-heads", S7, (24, 810, 161, 887)),
    ("p7-bp-skin", S7, (185, 810, 293, 887)),
    ("p7-bp-oil", S7, (322, 810, 427, 887)),
    ("p7-bp-scales", S7, (452, 810, 594, 887)),
    ("p7-bp-biogas", S7, (618, 810, 747, 887)),
    ("p7-plate", S7, (662, 512, 879, 624)),
    ("p7-people", S7, (636, 374, 930, 469)),
]

MAX_W = 900


def slice_all() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    cache: dict[str, Image.Image] = {}
    made = 0
    for name, src, box in MANIFEST:
        path = os.path.join(SRC_DIR, src)
        if not os.path.exists(path):
            print(f"!! missing source: {src}")
            continue
        if src not in cache:
            cache[src] = Image.open(path).convert("RGB")
        im = cache[src]
        w, h = im.size
        l, t, r, b = max(0, box[0]), max(0, box[1]), min(box[2], w), min(box[3], h)
        if r <= l or b <= t:
            print(f"!! bad box for {name}: {box}")
            continue
        crop = im.crop((l, t, r, b))
        if crop.width > MAX_W:
            nh = round(crop.height * MAX_W / crop.width)
            crop = crop.resize((MAX_W, nh), Image.LANCZOS)
        crop.save(os.path.join(OUT_DIR, f"{name}.webp"), "WEBP", quality=84, method=5)
        made += 1
    print(f"sliced {made} assets -> {OUT_DIR}")


def contact_sheets() -> None:
    os.makedirs(SHEET_DIR, exist_ok=True)
    groups: dict[str, list[tuple[str, tuple[int, int, int, int]]]] = {}
    for name, src, box in MANIFEST:
        groups.setdefault(src, []).append((name, box))

    thumb_w, label_h, pad, cols = 190, 22, 8, 6
    try:
        font = ImageFont.truetype("arial.ttf", 13)
    except Exception:
        font = ImageFont.load_default()

    for idx, (src, items) in enumerate(sorted(groups.items()), start=1):
        path = os.path.join(SRC_DIR, src)
        if not os.path.exists(path):
            continue
        src_im = Image.open(path).convert("RGB")
        rows = (len(items) + cols - 1) // cols
        cell_h = int(thumb_w * 0.8)
        sheet = Image.new(
            "RGB",
            (cols * (thumb_w + pad) + pad, rows * (cell_h + label_h + pad) + pad + 34),
            "white",
        )
        draw = ImageDraw.Draw(sheet)
        draw.text((pad, 6), f"CONTACT {idx} :: {src}", fill="black", font=font)
        for i, (name, box) in enumerate(items):
            crop = src_im.crop((max(0, box[0]), max(0, box[1]), min(box[2], src_im.width), min(box[3], src_im.height)))
            crop.thumbnail((thumb_w, cell_h), Image.LANCZOS)
            cx = pad + (i % cols) * (thumb_w + pad)
            cy = pad + 30 + (i // cols) * (cell_h + label_h + pad)
            sheet.paste(crop, (cx, cy + (cell_h - crop.height)))
            draw.text((cx, cy + cell_h + 3), name, fill="black", font=font)
        out = os.path.join(SHEET_DIR, f"contact-{idx}.jpg")
        sheet.save(out, quality=80)
        print(out)


def grid_overlays() -> None:
    os.makedirs(SHEET_DIR, exist_ok=True)
    try:
        font = ImageFont.truetype("arialbd.ttf", 16)
        big = ImageFont.truetype("arialbd.ttf", 34)
    except Exception:
        font = big = ImageFont.load_default()
    for i, f in enumerate(sorted(os.listdir(SRC_DIR)), 1):
        if not f.lower().endswith((".png", ".jpg")):
            continue
        im = Image.open(os.path.join(SRC_DIR, f)).convert("RGB")
        w, h = im.size
        dr = ImageDraw.Draw(im, "RGBA")
        for x in range(0, w, 100):
            dr.line([(x, 0), (x, h)], fill=(255, 0, 0, 170), width=2)
            dr.text((x + 3, 3), str(x), fill=(255, 0, 0), font=font, stroke_width=2, stroke_fill=(255, 255, 255))
        for y in range(0, h, 100):
            dr.line([(0, y), (w, y)], fill=(0, 0, 255, 170), width=2)
            dr.text((3, y + 3), str(y), fill=(0, 0, 255), font=font, stroke_width=2, stroke_fill=(255, 255, 255))
        dr.rectangle([0, h - 52, w, h], fill=(0, 0, 0, 220))
        dr.text((8, h - 46), f"SOURCE {i} :: {f[:38]}", fill=(255, 255, 0), font=big, stroke_width=2, stroke_fill=(0, 0, 0))
        out = os.path.join(SHEET_DIR, f"grid-{i}.jpg")
        im.save(out, quality=88)
        print(out)


if __name__ == "__main__":
    if "--sheets" in sys.argv:
        contact_sheets()
    elif "--grid" in sys.argv:
        grid_overlays()
    else:
        slice_all()
