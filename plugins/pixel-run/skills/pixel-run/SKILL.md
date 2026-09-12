---
name: pixel-run
description: "Turn a character reference image into a clean, looping pixel-art RUN cycle. Produces a transparent GIF, a 4x4 (16-frame) sprite sheet PNG, and a ZIP of individual frames. Use when the user shares a character image and asks for a running animation, run cycle, sprite sheet, pixel-art walk/run, or 'make this character run'. The skill gives the AI a rigorous, character-agnostic generation prompt AND a deterministic post-processor (slice + re-center + assemble transparent GIF + QA) so the character runs IN PLACE without sliding or ghosting."
---

# pixel-run — pixel-art run cycle from a character reference

This skill has two layers. Use both. Do not skip the script.

1. A **generation prompt template** (below) that turns a character reference into a 4x4 / 16-frame run-cycle sprite sheet. Fill it in, then generate the sheet with whatever image capability this environment has.
2. A **deterministic post-processor** — `scripts/pack_run_cycle.py` — that slices the sheet, **re-centers each frame so the character runs in place**, assembles a transparent looping GIF with no ghosting, writes the 16 PNG frames + a ZIP, and prints a QA report.

The hard-won reason for layer 2: slicing a sheet on cell borders alone makes the character **drift sideways** across the cycle (a body slides ~half a cell per loop) and the feet bob off the ground line. The post-processor fixes both by anchoring each frame's alpha centroid to the cell center and the feet to a fixed baseline. Never hand the raw cell crops back as the final animation.

## Procedure

1. **Read the reference.** Identify face, hairstyle, outfit, colors, accessories, body proportions, and the character's facing. If it is already pixel art, preserve its pixel size, outline weight, and palette; do not redesign it. If a second motion GIF is attached, use it ONLY for run timing and pose (stride, lean, airborne beats, loop speed), never its character/colors/background.
2. **Fill the prompt template** below with the character's specifics.
3. **Generate the 4x4 sheet** with the image tool available here. Target a 1024x1024 RGBA sheet (16 cells of 256x256), real alpha transparency, no baked background. If no image tool is available, output the filled prompt so the user can generate the sheet elsewhere, then continue at step 4 once they provide it.
4. **Post-process.** Run:
   ```sh
   python3 scripts/pack_run_cycle.py <sheet.png> --out ./out
   ```
   (only dependency: `pip install pillow`). Read the QA report it prints.
5. **Deliver the actual files** — `out/run.gif`, `out/frames/frame_00..15.png`, `out/frames.zip` — and a short QA summary. Show the GIF. Do not stop at describing the prompt.

## Generation prompt template

Fill the {braces}, then send this as the image prompt. Keep it in English.

```
Create a 4x4 pixel-art sprite sheet: one complete RIGHT-facing RUN CYCLE of
{CHARACTER}, split into 16 sequential frames (not 16 unrelated poses).

CHARACTER FIDELITY — identical in every frame:
- face and expression, head size and shape, body proportions
- outfit and colors: {OUTFIT/COLORS}
- accessories and their positions: {ACCESSORIES, or "none"}
- overall character size, pixel size, and outline thickness
Do not warp the face or body between frames. Recognizable chibi pixel-art
character. If the reference is already pixel art, preserve its style and palette.

RUN MECHANICS — running in place, camera fixed:
- torso leans slightly forward into the run
- clear stride: legs cross far front-to-back
- ground contact -> compression -> push-off -> short airborne -> other foot contact
- the planted foot stays at a FIXED height and moves backward relative to the body;
  it does not slide on the ground or sink below it
- the recovering foot lifts and swings forward
- two short airborne beats per cycle
- small, regular vertical bob synced to footfalls; slight torso rotation/weight shift

ARMS — both attached at the shoulders, exact opposite phase to the legs:
- right leg forward -> LEFT arm forward; left leg forward -> RIGHT arm forward
- elbows stay naturally bent; upper/lower arm lengths constant every frame
- never: an arm detached from the shoulder, a hand fused to the torso, rubber-band
  stretching, reversed elbows, both arms swinging the same way, or an arm frozen
  by the head. Do not add any object to the hands that the character was not holding.

ACCESSORIES: hat / hair / ears / tail / scarf follow the body with a slight lag,
small and restrained; they never change shape or detach.

16-FRAME ORDER (one cycle, seamless 16 -> 1, do NOT clone frame 1 as frame 16):
left-foot contact -> compression -> push-off -> short airborne -> right-foot contact
-> compression -> push-off -> short airborne -> back to the opening pose.

STYLE: crisp 16-bit game pixel art, readable silhouette, uniform square pixels,
sharp edges, limited palette, nearest-neighbor scaling only. No blur, no
anti-aliasing, no soft gradients, no motion blur. No per-frame style drift.

SHEET: exactly 4 columns x 4 rows = 16 cells, total 1024x1024, each cell 256x256,
read left-to-right then top-to-bottom. Equal cells, fixed camera, same character
size and a stable ground baseline in every cell, one character per cell, whole body
+ accessories inside the cell with transparent margin on all sides. Cells must not
bleed into neighbors. No text, numbers, gridlines, borders, watermark, or background.

TRANSPARENCY: real RGBA alpha. Do NOT paint a checkerboard, green, white, or any
solid color as a fake transparent background.
```

## Timing

16 frames at 30 ms each = a 480 ms (~0.48 s) loop, repeating forever. The
post-processor sets exactly this. If a reference motion GIF is attached, match its
overall cycle speed instead and pass `--ms <value>` accordingly.

## QA checklist (the script reports most of these; you confirm the visual ones)

- sheet is exactly 4x4 and yields 16 frames  *(script: hard-checks divisibility + count)*
- loop is ~0.48 s and repeats infinitely  *(script)*
- background is truly transparent, not a baked matte  *(script warns if <5% transparent)*
- character runs IN PLACE, not sliding  *(script: horizontal-drift check; use default re-center)*
- feet do not slide or bob off the ground line  *(script: baseline-spread check)*
- arms swing opposite the legs, attached at the shoulders  *(you: inspect the GIF)*
- face and body are not deformed across frames  *(you)*
- all body parts + accessories stay inside each cell  *(you)*
- frame 16 flows smoothly into frame 1  *(you)*
- no ghost trails / background flicker in the GIF  *(script uses GIF disposal=2)*

## Flags

- `--no-recenter` keeps raw cell crops (only if the sheet is already perfectly centered).
- `--cols/--rows` for non-4x4 sheets. `--ms` to change frame duration.

## Notes

- The script never touches the network and adds nothing to the hands or design; it
  only crops, re-centers, and assembles. All fidelity comes from the generated sheet.
- If the QA report warns about drift or a baked background, fix the SHEET (regenerate
  with the transparency/centering lines emphasized) rather than forcing the output.
