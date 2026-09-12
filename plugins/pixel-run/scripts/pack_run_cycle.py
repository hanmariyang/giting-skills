#!/usr/bin/env python3
"""
pack_run_cycle.py — turn a 4x4 pixel-art sprite sheet into a transparent
looping run-cycle GIF + individual PNG frames + a ZIP, with QA checks.

This is the DETERMINISTIC half of the `pixel-run` skill. The AI generates the
4x4 sheet image (see SKILL.md for the prompt template); this script slices it,
re-centers each frame so the character runs IN PLACE (not drifting across the
cell), assembles a clean transparent GIF with no ghosting, and reports QA.

Only dependency: Pillow (pip install pillow). No network, no services.

Usage:
  python3 pack_run_cycle.py sheet.png --out ./out
  python3 pack_run_cycle.py sheet.png --out ./out --cols 4 --rows 4 --ms 30
  python3 pack_run_cycle.py sheet.png --out ./out --no-recenter

Outputs in --out:
  run.gif            transparent looping GIF (loop forever)
  frames/frame_00.png .. frame_15.png   individual RGBA frames
  frames.zip         zip of the individual frames
  (prints a QA report to stdout; exits non-zero if a hard check fails)
"""
import argparse
import os
import sys
import zipfile

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.stderr.write("Pillow is required: pip install pillow\n")
    sys.exit(2)


def alpha_bbox(frame):
    """Bounding box of pixels with alpha above a small threshold, or None."""
    alpha = frame.split()[-1]
    mask = alpha.point(lambda a: 255 if a >= 16 else 0)
    return mask.getbbox()


def alpha_centroid_x(frame, bbox):
    """Alpha-weighted horizontal centroid inside bbox (float px, sheet coords)."""
    x0, y0, x1, y1 = bbox  # noqa: F841 (x0/x1/y0/y1 all used in the scan below)
    alpha = frame.split()[-1]
    total = 0
    weighted = 0
    px = alpha.load()
    for y in range(y0, y1):
        for x in range(x0, x1):
            a = px[x, y]
            if a:
                total += a
                weighted += a * x
    if total == 0:
        return (x0 + x1) / 2.0
    return weighted / total


def recenter(frame):
    """
    Place the character on a fresh transparent canvas so it runs IN PLACE:
      - horizontal: alpha centroid -> cell center (kills the sideways drift you
        get from slicing on cell borders alone; a hard-won lesson: cutting by
        cell boundary makes the character slide ~half a body width per cycle).
      - vertical: bottom of the character -> a fixed ground baseline.
    Returns (new_frame, dx, dy) where dx/dy are the applied shifts.
    """
    w, h = frame.size
    bbox = alpha_bbox(frame)
    if not bbox:
        return frame, 0, 0
    x0, y0, x1, y1 = bbox
    cx = alpha_centroid_x(frame, bbox)
    # target: centroid at cell center X, feet at baseline near the bottom
    baseline = h - max(2, h // 16)  # a few px of ground margin
    dx = int(round(w / 2.0 - cx))
    dy = int(round(baseline - y1))
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    canvas.paste(frame, (dx, dy), frame)
    return canvas, dx, dy


def rgba_to_gif_frame(frame):
    """
    Convert one RGBA frame to a P-mode image with a reserved transparent index,
    so the GIF has true 1-bit transparency and no colored matte.
    """
    alpha = frame.split()[-1]
    # GIF transparency is binary; threshold soft edges.
    solid = alpha.point(lambda a: 255 if a >= 128 else 0)
    rgb = frame.convert("RGB")
    # reserve palette index 255 for transparency -> quantize to 255 colors
    pal = rgb.quantize(colors=255, method=Image.Quantize.MEDIANCUT)
    transparent_index = 255
    # wherever the pixel is transparent, set palette index to the reserved one
    pal.paste(transparent_index, mask=ImageOps.invert(solid))
    pal.info["transparency"] = transparent_index
    return pal


def main():
    ap = argparse.ArgumentParser(description="Pack a 4x4 pixel-art sheet into a transparent run-cycle GIF + PNGs + ZIP.")
    ap.add_argument("sheet", help="path to the sprite sheet PNG (RGBA, e.g. 1024x1024 for 4x4 of 256px)")
    ap.add_argument("--out", default="./out", help="output directory (default ./out)")
    ap.add_argument("--cols", type=int, default=4)
    ap.add_argument("--rows", type=int, default=4)
    ap.add_argument("--ms", type=int, default=30, help="ms per frame (default 30 -> 16 frames = 480ms)")
    ap.add_argument("--no-recenter", action="store_true", help="keep raw cell crops; do not re-center in place")
    args = ap.parse_args()

    n = args.cols * args.rows
    sheet = Image.open(args.sheet).convert("RGBA")
    W, H = sheet.size
    if W % args.cols or H % args.rows:
        sys.stderr.write(f"[FAIL] sheet {W}x{H} is not evenly divisible into {args.cols}x{args.rows} cells\n")
        sys.exit(1)
    cw, ch = W // args.cols, H // args.rows

    # --- QA: is the sheet actually transparent, or a baked-in matte? ---
    full_alpha = sheet.split()[-1]
    _lo, hi = full_alpha.getextrema()
    if hi == 0:
        sys.stderr.write("[FAIL] sheet is fully transparent (empty)\n")
        sys.exit(1)
    transparent_share = 1.0 - (sum(full_alpha.histogram()[16:]) / float(W * H))
    matte_warning = transparent_share < 0.05  # almost no transparent pixels -> likely a baked background

    os.makedirs(args.out, exist_ok=True)
    frames_dir = os.path.join(args.out, "frames")
    os.makedirs(frames_dir, exist_ok=True)

    rgba_frames = []
    centers = []
    baselines = []
    for i in range(n):
        r, c = divmod(i, args.cols)
        cell = sheet.crop((c * cw, r * ch, c * cw + cw, r * ch + ch))
        if not args.no_recenter:
            cell, _, _ = recenter(cell)
        rgba_frames.append(cell)
        bb = alpha_bbox(cell)
        if bb:
            centers.append(alpha_centroid_x(cell, bb))
            baselines.append(bb[3])
        else:
            centers.append(cw / 2.0)
            baselines.append(ch)

    # write individual PNGs (preserve full RGBA / soft alpha)
    png_paths = []
    for i, f in enumerate(rgba_frames):
        p = os.path.join(frames_dir, f"frame_{i:02d}.png")
        f.save(p)
        png_paths.append(p)

    # zip the frames
    zip_path = os.path.join(args.out, "frames.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for p in png_paths:
            z.write(p, os.path.basename(p))

    # assemble transparent looping GIF (disposal=2 -> restore to background, no ghost trails)
    gif_frames = [rgba_to_gif_frame(f) for f in rgba_frames]
    gif_path = os.path.join(args.out, "run.gif")
    gif_frames[0].save(
        gif_path,
        save_all=True,
        append_images=gif_frames[1:],
        duration=args.ms,
        loop=0,
        disposal=2,
        transparency=255,
        optimize=False,
    )

    # --- QA report ---
    drift = max(centers) - min(centers) if centers else 0.0
    base_spread = max(baselines) - min(baselines) if baselines else 0
    total_ms = args.ms * n
    print("== pixel-run QA ==")
    print(f"frames            : {n} (grid {args.cols}x{args.rows}, cell {cw}x{ch})")
    print(f"loop duration     : {total_ms} ms ({total_ms/1000:.2f}s) @ {args.ms}ms/frame")
    print(f"transparency      : {transparent_share*100:.1f}% of pixels transparent"
          + ("  [WARN: looks like a baked background, not real alpha]" if matte_warning else "  [ok]"))
    print(f"horizontal drift  : {drift:.1f}px across frames"
          + ("  [ok: runs in place]" if drift <= max(4, cw*0.06) else "  [WARN: character slides — re-center or fix the sheet]"))
    print(f"baseline spread   : {base_spread}px (feet height variation)"
          + ("  [ok]" if base_spread <= max(3, ch*0.05) else "  [WARN: feet bob too much / sliding on ground]"))
    print(f"recenter          : {'off (raw cells)' if args.no_recenter else 'on (centroid->center, feet->baseline)'}")
    print(f"outputs           : {gif_path} · {frames_dir}/frame_00..{n-1:02d}.png · {zip_path}")

    # hard-fail only on structural problems; alignment issues are warnings
    if hi == 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
