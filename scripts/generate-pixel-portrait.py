#!/usr/bin/env -S uv run --quiet --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=10.4"]
# ///
"""Derive the retro pixel-art portrait from the full-resolution photo.

Run locally when the source photo changes; the generated PNG is committed so
CI never needs Python:

    uv run scripts/generate-pixel-portrait.py

Source : picture.jpg (repo root)
Output : website/template/profile-pixel.png
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "picture.jpg"
OUTPUT = ROOT / "website" / "template" / "profile-pixel.png"

TARGET_WIDTH = 132
ASPECT = (4, 3)
PALETTE_SIZE = 20

# Horizontal/vertical centre of the subject's face as a fraction of the source,
# and the fraction of source height the crop should span.
FACE_CENTRE = (0.50, 0.42)
CROP_HEIGHT = 0.74

CONTRAST = 1.2
SATURATION = 1.18

# Luma-indexed grade ramp: deep navy shadows through steel and slate blue to
# pale ice highlights. Built from DESIGN.md's azure accent ramp so the portrait
# carries the same colour story as the phosphor around it — which is what lets
# the CSS overlays on top of it stay almost transparent.
# Re-run this script whenever that ramp moves; the grade is baked into the PNG.
RAMP_STOPS: list[tuple[float, tuple[int, int, int]]] = [
    (0.00, (0x0C, 0x12, 0x20)),
    (0.16, (0x1C, 0x2A, 0x44)),
    (0.32, (0x33, 0x4C, 0x70)),
    (0.46, (0x4F, 0x74, 0x9C)),
    (0.58, (0x74, 0x97, 0xB8)),
    (0.70, (0x9C, 0xBC, 0xD6)),
    (0.84, (0xC6, 0xDD, 0xEF)),
    (1.00, (0xED, 0xF6, 0xFF)),
]
RAMP_STRENGTH = 0.72


def build_ramp() -> list[tuple[int, int, int]]:
    ramp: list[tuple[int, int, int]] = []
    for index in range(256):
        position = index / 255
        lower, upper = RAMP_STOPS[0], RAMP_STOPS[-1]
        for current, following in zip(RAMP_STOPS, RAMP_STOPS[1:]):
            if current[0] <= position <= following[0]:
                lower, upper = current, following
                break
        span = upper[0] - lower[0]
        t = 0.0 if span == 0 else (position - lower[0]) / span
        ramp.append(tuple(round(lower[1][c] + (upper[1][c] - lower[1][c]) * t) for c in range(3)))
    return ramp


def crop_to_subject(image: Image.Image) -> Image.Image:
    width, height = image.size
    crop_height = height * CROP_HEIGHT
    crop_width = crop_height * ASPECT[0] / ASPECT[1]

    if crop_width > width:
        crop_width = float(width)
        crop_height = crop_width * ASPECT[1] / ASPECT[0]

    left = min(max(width * FACE_CENTRE[0] - crop_width / 2, 0), width - crop_width)
    top = min(max(height * FACE_CENTRE[1] - crop_height / 2, 0), height - crop_height)
    return image.crop((round(left), round(top), round(left + crop_width), round(top + crop_height)))


def apply_ramp(image: Image.Image, ramp: list[tuple[int, int, int]]) -> Image.Image:
    luma = image.convert("L")
    pixels = image.load()
    luma_pixels = luma.load()
    width, height = image.size

    for y in range(height):
        for x in range(width):
            source = pixels[x, y]
            target = ramp[luma_pixels[x, y]]
            pixels[x, y] = tuple(
                round(source[c] + (target[c] - source[c]) * RAMP_STRENGTH) for c in range(3)
            )
    return image


def main() -> int:
    if not SOURCE.exists():
        print(f"Source photo not found: {SOURCE}", file=sys.stderr)
        return 1

    image = crop_to_subject(Image.open(SOURCE).convert("RGB"))

    target_height = round(TARGET_WIDTH * ASPECT[1] / ASPECT[0])
    # BOX averages every source pixel in a cell, which is what gives clean flat
    # blocks; LANCZOS would ring and smear the edges at this reduction factor.
    image = image.resize((TARGET_WIDTH, target_height), Image.Resampling.BOX)

    image = ImageEnhance.Contrast(image).enhance(CONTRAST)
    image = apply_ramp(image, build_ramp())
    image = ImageEnhance.Color(image).enhance(SATURATION)

    image = image.quantize(colors=PALETTE_SIZE, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    image.convert("P").save(OUTPUT, optimize=True)

    print(f"Wrote {OUTPUT.relative_to(ROOT)} ({TARGET_WIDTH}x{target_height}, {PALETTE_SIZE} colours)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
