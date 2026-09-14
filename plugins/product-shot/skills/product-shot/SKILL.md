---
name: product-shot
description: "Make commercial-grade product photos with an image model: liquid/texture (formulation) shots, product images that keep the real logo and packaging intact, and clean ad cuts. Use when the user has a product image (cosmetics, skincare, food, drink, any packaged good) and wants a texture/swatch shot, a hero ad image, a background/scene, or asks 'make a product photo / 제형 컷 / 광고컷 / keep the logo'. The skill gives a physical-property prompt grammar, a product-preservation discipline that stops the logo from being redrawn, ad-cut recipes, and a deterministic color extractor so the texture matches the real product color."
---

# product-shot — commercial product photos that don't lie

Three jobs, one rule underneath all of them: **describe physical reality, and never let the model reinvent what already exists.** Image generation itself runs on whatever image tool this environment has; this skill supplies the grammar, the preservation discipline, the recipes, and one deterministic tool (`scripts/extract_palette.py`).

## Job 1 — texture / formulation shots

A generic "make a serum texture" gives plastic-looking goo. A shot reads as real when the prompt names the **physics**: how thick it is, how light passes through it, how it moves, how it shines. Specify these five axes (pick what fits, don't dump all of them):

- **Body (consistency):** watery, fluid, light gel, gel, serum, essence, balm, cream, whipped, thick paste. This sets how it holds shape.
- **Clarity (how light passes):** crystal-clear, tinted-translucent, milky-translucent, opaque. A lip oil is clear; a lotion is opaque.
- **Behavior (what it's doing):** a single suspended droplet, a slow drip caught mid-fall, a settled shallow pool, a dragged swatch with a tapered tail, a soft peak or swirl, a thin ribbon. This is the story of the shot.
- **Finish (surface light):** wet gloss, satin sheen, dewy micro-speculars, oily catch-lights, matte. Wrong finish is the #1 tell of a fake.
- **Incidents (small truths):** tiny trapped air bubbles, condensation beads, a fingertip dip, a spatula pull, surface tension at the rim. One or two, not a pile.

Then set the shot: extreme close macro or top-down flat lay, single soft key light or window light, shallow depth of field, seamless or stone or acrylic surface.

**Use a reference for shape, not color.** If the user has a texture they like, upload it and instruct: match the *flow and form* of the reference, but rebuild it fresh in the product's own color. Do not clone the reference. Then vary the flow direction, thickness, spread, and droplet placement so the result is a new image, not a copy.

**Get the color exactly right (deterministic).** Do not eyeball the color or let the model guess it. Run:

```sh
python3 scripts/extract_palette.py reference.jpg --n 5
# a specific spot (e.g. the swatch center): --point 512,340
# an average over a region:                  --box 400,300,80,80
```

It prints the full palette AND a "product colors (background dropped)" line that filters out the studio backdrop (near-white / near-gray) so the actual formulation color surfaces first, not the seamless behind it. Put that HEX into the prompt ("the formulation color is `#E76E59`") so the texture carries the real product color. Save the finished texture to composite with the product cut-out or to use in a detail page / social post.

**Material sets the finish.** How light behaves depends on what the container and formula are: clear glass throws sharp specular highlights and refraction; frosted glass diffuses to a soft glow; a plastic tube gives a broad soft sheen; a jar of cream is matte with dewy micro-speculars; a pump adds a small metallic catch. Name the material so the light matches it.

## Job 2 — keep the logo and packaging intact

On product images the classic failure is the brand name mutating by a letter (a real 2026 pain: `Torriden` coming back as `Torniden`). Prompting harder rarely fixes it; the fix is the **method**.

**Do not let the model regenerate the product.** The moment you ask it to "make a similar product," it reinterprets the packaging and the logo with it.

- Weak: "make a product shot similar to this one."
- Strong: "keep the uploaded product exactly as it is; generate only the background and the scene around it."

**Lead the prompt with a preservation clause.** Something like (rephrase to fit, keep the intent):

> Treat the uploaded image as the exact, fixed product. Do not redraw, restyle, re-render, or alter any part of the packaging. The logo, brand name, and all printed text must stay pixel-for-pixel as in the reference: same spelling, letterforms, spacing, position, size, and color. Do not re-typeset or re-draw the logo. Change only the environment around the product.

The line that carries the most weight is the explicit "do not re-draw or re-typeset the logo."

**Best of all, don't generate product + scene in one pass.** The safest pipeline keeps the model away from the logo entirely:

1. Prepare a clean cut-out of the real product (remove the background).
2. Generate the background / scene / props with the model, product-free.
3. Composite the real product cut-out back in.
4. Match only the light and shadow (model or editor) so it sits in the scene.

Even a product floating over splashing water is safer this way: keep the real product pixels, generate only the water, shadow, and backdrop.

## Job 3 — ad cuts (recipes)

Ad cuts are compositions, not just prompts. Start from a real product cut-out (Job 2), then build one of these:

- **Hero float:** product centered and slightly tilted, floating, one soft key + rim light, a large calm negative-space background in a single brand-adjacent color, a faint contact shadow or ripple below.
- **Texture-beside-product:** product cut-out on one side, a fresh formulation swatch (Job 1, matched color) on the other, aligned on a shared baseline, seamless surface.
- **Flat lay:** top-down, product plus two or three restrained props (a leaf, a stone, a folded cloth), generous margin, one direction of soft light.
- **In-use moment:** product held or dispensed, hand and surroundings generated, product pixels preserved.

**Borrow a composition, not its contents.** If the user has an ad they like the layout of, use it the way Job 1 uses a texture reference: match the *arrangement* (where the product sits, how props are spaced, the light direction, the crop), but rebuild it with this product and this color. Never reproduce the reference's product, brand, or copy.

For each: state aspect ratio, one light direction, one background color (paste a HEX from the extractor), and keep props to a minimum. Minimal reads as premium; clutter reads as a template.

**Match the ratio to the channel** so nothing gets cropped wrong:

- Product detail page: tall, `4:5` or `2:3`
- Instagram feed: `1:1` or `4:5` · Threads / Reels / Stories: `9:16`
- Web banner / hero: `16:9` or wider

## What breaks (and why)

One-pass generation of a product fails in predictable ways. Watch for these and, if they show up, switch to the cut-out + composite pipeline (Job 2):

- **Logo mutates** a letter (`Torriden` to `Torniden`) or the typeface drifts. The model retyped it.
- **Sub-text turns to gibberish** (ingredients, volume like `30ml`, certifications). Legal text especially.
- **Geometry warps**: a leaning bottle, a melted cap, a cap color that changed.
- **Count changes**: an extra pump, a second bottle, a missing lid. The model "improved" the scene.
- **Finish contradicts material**: plastic-looking gloss on a matte cream, or a clear-glass highlight on a frosted bottle.

Guardrail to add to any product prompt: forbid redrawing or retyping the logo and printed text, forbid adding or removing products or parts, forbid changing the count, and forbid altering any printed claim.

## Procedure

1. Get the product image (and any texture reference).
2. For color, run `extract_palette.py` on the reference; keep the HEX.
3. Decide the job (texture / preserve / ad cut) and build the prompt from the grammar above.
4. Generate with the environment's image tool. For anything showing the product, prefer the cut-out + composite pipeline over one-pass generation.
5. Deliver the image(s); if you could not run an image tool here, output the finished prompt (with the extracted HEX filled in) for the user to run elsewhere.

## QA checklist

- Logo/brand text: spelled and shaped exactly as the reference (zoom in and read it).
- Texture: body, clarity, finish all consistent with a real material (no plastic gloss on a matte cream).
- Color: matches the extracted HEX, not a drifted guess.
- Composition: one light story, minimal props, intentional negative space.
- Reference used for form only, not cloned.

## Notes and honest limits

- This skill does not generate images. It supplies the grammar, the discipline, the recipes, and the color tool. Fidelity comes from your image model plus the cut-out/composite method.
- The color extractor is deterministic (Pillow, no network); it reads pixels, it does not alter the image.
- One-pass "product + scene" generation will occasionally still touch the logo. If the brand name matters, the composite pipeline is not optional.
- Credit: the workflow idea is common in commercial AI product photography. This is an independent write-up with its own taxonomy, prompts, recipes, and tool.
