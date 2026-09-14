#!/usr/bin/env python3
"""
extract_palette.py — pull exact colors out of a reference image, as HEX + RGB.

The DETERMINISTIC half of the `product-shot` skill. When you shoot a formulation
(texture) shot from a reference, you want the product's real color, not the model's
guess. This reads the reference and returns:
  - the dominant palette (K colors) with HEX, RGB, and coverage %
  - optionally the exact color at one point (--point X,Y), e.g. the swatch center
  - optionally the average color of a box region (--box X,Y,W,H)
  - optionally a palette swatch PNG (--swatch out.png)

Feed the HEX values back into the generation prompt so the texture matches the
product color instead of drifting. Only dependency: Pillow. No network.

Usage:
  python3 extract_palette.py ref.jpg
  python3 extract_palette.py ref.jpg --n 6
  python3 extract_palette.py ref.jpg --point 512,340
  python3 extract_palette.py ref.jpg --box 400,300,80,80
  python3 extract_palette.py ref.jpg --n 5 --swatch palette.png
"""
import argparse
import colorsys
import sys

try:
    from PIL import Image
except ImportError:
    sys.stderr.write("Pillow is required: pip install pillow\n")
    sys.exit(2)


def hexof(rgb):
    return "#{:02X}{:02X}{:02X}".format(rgb[0], rgb[1], rgb[2])


def sat_val(rgb):
    """HSV saturation and value (0..1) for a 0..255 RGB."""
    _h, s, v = colorsys.rgb_to_hsv(rgb[0] / 255.0, rgb[1] / 255.0, rgb[2] / 255.0)
    return s, v


def dominant(img, k):
    """K dominant colors via median-cut quantization, sorted by coverage."""
    small = img.convert("RGB")
    small.thumbnail((256, 256))  # speed; color ratios preserved
    q = small.quantize(colors=k, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()
    counts = q.getcolors() or []  # [(count, index), ...]
    total = sum(c for c, _ in counts) or 1
    out = []
    for count, idx in sorted(counts, key=lambda x: -x[0]):
        rgb = (pal[idx * 3], pal[idx * 3 + 1], pal[idx * 3 + 2])
        out.append((rgb, count / total))
    return out


def is_product_color(rgb, min_sat=0.15, min_val=0.08, max_val=0.95):
    """A chromatic color, not near-white / near-black / near-gray background."""
    s, v = sat_val(rgb)
    return s >= min_sat and min_val <= v <= max_val


def box_avg(img, x, y, w, h):
    region = img.convert("RGB").crop((x, y, x + w, y + h))
    px = list(region.getdata())
    n = len(px) or 1
    r = sum(p[0] for p in px) // n
    g = sum(p[1] for p in px) // n
    b = sum(p[2] for p in px) // n
    return (r, g, b)


def main():
    ap = argparse.ArgumentParser(description="Extract HEX/RGB colors from a reference image.")
    ap.add_argument("image")
    ap.add_argument("--n", type=int, default=5, help="dominant colors to return (default 5)")
    ap.add_argument("--point", help="exact color at X,Y (e.g. 512,340)")
    ap.add_argument("--box", help="average color of a box X,Y,W,H")
    ap.add_argument("--swatch", help="write a palette swatch PNG to this path")
    args = ap.parse_args()

    img = Image.open(args.image)
    W, H = img.size
    print(f"image: {args.image}  ({W}x{H})")

    if args.point:
        x, y = (int(v) for v in args.point.split(","))
        rgb = img.convert("RGB").getpixel((x, y))
        print(f"point ({x},{y}): {hexof(rgb)}  rgb{rgb}")

    if args.box:
        x, y, w, h = (int(v) for v in args.box.split(","))
        rgb = box_avg(img, x, y, w, h)
        print(f"box  ({x},{y},{w}x{h}) avg: {hexof(rgb)}  rgb{rgb}")

    pal = dominant(img, args.n)
    print(f"dominant palette (top {len(pal)}):")
    for rgb, cov in pal:
        print(f"  {hexof(rgb)}  rgb{rgb}  {cov*100:4.1f}%")

    # product colors: drop the background (near-white / near-black / near-gray) so the
    # actual formulation/packaging color surfaces first, not the studio backdrop.
    wide = dominant(img, max(args.n, 12))
    prod = [(rgb, cov) for rgb, cov in wide if is_product_color(rgb)]
    print("product colors (background dropped):")
    if prod:
        for rgb, cov in prod[:args.n]:
            print(f"  {hexof(rgb)}  rgb{rgb}  {cov*100:4.1f}%  <- use this in the prompt")
    else:
        print("  (none — image is mostly neutral; use --point on the product itself)")

    if args.swatch:
        sw = 80
        strip = Image.new("RGB", (sw * len(pal), sw), (255, 255, 255))
        for i, (rgb, _) in enumerate(pal):
            strip.paste(Image.new("RGB", (sw, sw), rgb), (i * sw, 0))
        strip.save(args.swatch)
        print(f"swatch: {args.swatch}")


if __name__ == "__main__":
    main()
