# pixel-run

A character reference image in, a clean looping pixel-art **run cycle** out:
a transparent GIF, a 4x4 (16-frame) sprite sheet PNG, and a ZIP of the frames.

Part of [Giting Skills](https://github.com/hanmariyang/giting-skills). MIT.

## Why it exists

Most "make a run cycle" prompts produce a sheet whose character **slides sideways**
across the loop and whose feet drift off the ground line, because the frames are
cut on cell borders alone. `pixel-run` pairs a rigorous, character-agnostic
generation prompt with a **deterministic post-processor** that re-centers every
frame (alpha centroid to cell center, feet to a fixed baseline) so the character
runs *in place*, then assembles a transparent GIF with no ghost trails.

## Install

```
/plugin marketplace add hanmariyang/giting-skills
/plugin install pixel-run@giting
```

Then: share a character image and ask for a run cycle.

## The post-processor (use it directly too)

```sh
pip install pillow
python3 scripts/pack_run_cycle.py your_sheet.png --out ./out
```

Outputs `out/run.gif` (transparent, 16 frames, 480 ms loop), `out/frames/frame_00..15.png`,
and `out/frames.zip`. It prints a QA report: frame count, loop time, transparency %,
horizontal drift (runs-in-place check), and baseline spread (foot-slide check).

Flags: `--no-recenter` (keep raw cells), `--cols/--rows` (non-4x4), `--ms` (frame duration).

## Two layers

- **Generation prompt** (`skills/pixel-run/SKILL.md`) — fill in the character, generate the 4x4 sheet with any image tool.
- **Post-processor** (`scripts/pack_run_cycle.py`) — slice, re-center, assemble, QA. No network, Pillow only.

The script never redesigns the character or adds anything to its hands. All fidelity
comes from the sheet; the script only crops, centers, and packs.

## Credit

The idea of codifying a strict run-cycle spec was inspired by community pixel-art
animation prompts. This skill is an independent reimplementation: our own prompt
wording, our own slicing/centering/GIF-assembly code, and our own QA gate.
