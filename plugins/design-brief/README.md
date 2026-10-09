# design-brief

Produce a project **DESIGN.md** so an AI coding agent builds consistent, non-generic UI
instead of the default AI look. Part of [Giting Skills](https://github.com/hanmariyang/giting-skills). MIT.

AI coders go generic because nothing tells them what THIS product looks like. A DESIGN.md
at the repo root, colors + type + spacing + components + the reasoning, fixes that. This
skill builds it, picks a real visual direction, and seeds it with actual colors.

## What it ships

- **DESIGN.md template** — palette+roles, type, spacing/shape, components, voice, each token with a one-line WHY (the WHY is what stops the drift).
- **Anti-slop checklist** — the looks AI defaults to (cream+serif+terracotta, purple gradient, Inter, everything centered, `rounded-lg` everywhere...), so the brief sets an explicit floor.
- **Style catalog (46)** — named directions to commit to (Swiss, Bento, Neo-brutalism, Japandi, Claymorphism, ...); "make it clean" is not a direction.
- **Color extractor** — `scripts/extract_palette.py` (Pillow) pulls real HEX from a reference so the palette is chosen, not invented.
- **Site measurer** — `scripts/site_tokens.mjs` (Node 22+, Chrome, no dependencies) opens a site you like in a real browser and measures the rendered colors, fonts, type scale, radius and spacing, then writes a DESIGN.md draft with roles. No logo, name or image is carried over; it is a starting point, not a copy.

## Use

```sh
node scripts/site_tokens.mjs https://example.com --out DESIGN.md   # measure a live site
pip install pillow
python3 scripts/extract_palette.py reference.png --n 6             # colors from an image
```

Checked against two sites with known tokens (giting.kr, aiplab.kr): ground, ink, line, accent, fonts, card radius and spacing unit matched the source values.

## Install

```
/plugin marketplace add hanmariyang/giting-skills
/plugin install design-brief@giting
```

## Credit

The reusable-design-brief-for-AI idea is common (getdesign.md, DESIGN.md conventions). This
is an independent template with its own sections, anti-slop list, style catalog, and tool.
Match a reference's feel, never copy a real brand's identity.
