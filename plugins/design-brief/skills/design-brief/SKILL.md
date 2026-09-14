---
name: design-brief
description: "Produce a project DESIGN.md so an AI coding agent builds consistent, non-generic UI instead of the default AI look. Use when the user wants a design system, a reusable style brief, to match a reference site's feel, to keep pages consistent, or says the AI's output looks generic. Ships a DESIGN.md template (palette+roles, type, spacing, components, and the reasoning), an anti-slop checklist of the looks AI defaults to, a named catalog of visual styles to choose from, and a deterministic color extractor to seed the brief from a real reference."
---

# design-brief — a DESIGN.md that stops the generic AI look

AI coders produce generic layouts because nothing tells them what THIS product looks like.
A DESIGN.md fixes that: one file at the repo root that captures colors, type, spacing,
components, and the reasoning, so every page an agent builds is consistent and specific.
This skill builds that file, chooses a real visual direction, and seeds it with actual
colors instead of the model's defaults.

## What a DESIGN.md must contain

Write these sections. Each token needs a role and a one-line WHY (the WHY is what stops
the generic drift, "chosen, not inherited"):

- **Direction** — one or two sentences naming the visual style (pick from the catalog below) and the feeling. What it is NOT (e.g., "not another cream + serif + terracotta").
- **Palette** — 4 to 6 named tokens with roles: ground, ink, one accent, semantic (good/warn/critical, separate from the accent). Real HEX (extract them, below). A neutral biased slightly toward the accent hue reads as chosen; a pure grey reads as unconsidered.
- **Type** — two or three faces with roles (a characterful display, a readable body, optional mono for data). A type scale (name the steps), weights, letter-spacing for uppercase labels. Body ~65 characters wide.
- **Spacing & shape** — base unit (e.g., 8px), radius scale, border weight. One decision, applied everywhere.
- **Components** — the conventions for buttons, cards, inputs, states (hover/focus/disabled), so they are not re-invented per page.
- **Voice** — how copy reads (labels name what the user recognizes; a control says exactly what happens).
- **Anti-slop** — the defaults this project explicitly avoids (list below).

## Choose a real direction (style catalog)

Don't leave the style implicit or the agent defaults to the slop cluster. Pick one and
commit, from these named looks (use the name in DESIGN.md so it is unambiguous):

Gradient background · Glassmorphism · Minimalism · Dark mode · Grain/noise · Big typography ·
Neumorphism · Neo-brutalism · Bento grid · De Stijl · Bauhaus · Duotone · Aurora UI ·
Mesh gradient · Swiss/International Typographic · Monochrome · Isometric · Corporate Memphis ·
Blob/organic · Maximalism · Line art · Neon/glow · Flat 2.0 · Material · Kinetic typography ·
Constructivism · Art Deco · Pop art · Mid-century modern · Skeuomorphism · Claymorphism ·
Brutalism · 3D render · Memphis · Frutiger Aero · Retro-futurism · Scandinavian · Acrylic ·
Liquid Glass · Y2K · Vaporwave · Cyberpunk · Art Nouveau · Japandi · Wabi-sabi.

Naming the style is half the brief. "Make it clean" is not a direction; "Swiss typographic,
one accent, generous whitespace, no gradients" is.

## Anti-slop — the looks to avoid unless the user asks for them

AI-generated design currently clusters on a few tells. If the user has not chosen one of
these, do not spend the brief's originality on them:

- warm cream (#F4F1EA) + serif display + terracotta accent
- near-black + a lone acid-green or vermilion pop
- a purple-to-blue gradient hero on white
- Inter or Space Grotesk as the "safe" default face
- emoji as section markers · everything centered · `rounded-lg` on everything · an accent bar on every card
- broadsheet hairline rules with dense columns as a reflex

State in DESIGN.md which of these the project rejects, so the agent has an explicit floor.

## Seed the palette from a real reference (deterministic)

Do not eyeball colors or let the model invent them. If the user likes a reference, extract
its real palette:

```sh
pip install pillow
python3 scripts/extract_palette.py reference.png --n 6            # dominant palette + product colors
python3 scripts/extract_palette.py reference.png --point 40,40    # exact color at a point
```

It prints HEX + RGB (and a "product colors, background dropped" line). Put those real HEX
into the Palette section with roles. Match the reference's FEEL, not its exact pixels, and
never copy a real brand's identity.

## Procedure

1. Ask (or infer) the one thing: what is this product and who is it for. That anchors every choice.
2. Pick a direction from the catalog; write what it is and is not.
3. If there is a reference, run `extract_palette.py` and seed real HEX.
4. Fill the DESIGN.md sections, each token with a role and a one-line WHY.
5. Add the anti-slop floor (which defaults this project rejects).
6. Save as `DESIGN.md` at the repo root so any agent reads it before building UI.

## QA checklist

- Every color/type/spacing token has a role and a WHY, not just a value.
- A named direction is chosen; the "what it is NOT" line rules out the slop cluster.
- Palette HEX came from the extractor or a deliberate choice, not a default.
- Semantic colors (good/warn/critical) are separate from the accent.
- The brief is specific enough that two agents building different pages would match.

## Notes and honest limits

- This skill does not design the UI; it writes the brief that makes the agent's design consistent and specific. The agent still builds; the brief constrains.
- The color extractor reads pixels only (Pillow, no network). It seeds colors; it does not judge taste.
- The idea of a reusable design brief for AI is common (e.g., getdesign.md, DESIGN.md conventions). This is an independent template with its own sections, anti-slop list, style catalog, and tool.
