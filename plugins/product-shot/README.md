# product-shot

Commercial product photos with an image model, done so they don't lie: liquid/texture
(formulation) shots, product images that keep the real logo intact, and clean ad cuts.
Part of [Giting Skills](https://github.com/hanmariyang/giting-skills). MIT.

Three jobs, one rule: **describe physical reality, and never let the model reinvent
what already exists.**

- **Texture shots** — a five-axis prompt grammar (body, clarity, behavior, finish, incidents) so a swatch reads as a real material, not plastic goo.
- **Logo-safe product images** — a preservation discipline + a cut-out/composite pipeline that keeps the model away from the brand name (no more `Torriden → Torniden`).
- **Ad cuts** — minimal composition recipes (hero float, texture-beside-product, flat lay, in-use).

## The deterministic tool: exact color

Don't let the model guess the product color. Extract it from the reference:

```sh
pip install pillow
python3 scripts/extract_palette.py reference.jpg --n 5
python3 scripts/extract_palette.py reference.jpg --point 512,340   # exact spot
python3 scripts/extract_palette.py reference.jpg --swatch pal.png  # save a swatch
```

Prints HEX + RGB (+ coverage). Put the HEX into the prompt so the texture matches the
real product. Reads pixels only, no network.

## Install

```
/plugin marketplace add hanmariyang/giting-skills
/plugin install product-shot@giting
```

## Honest limits

- Does not generate images; supplies the grammar, discipline, recipes, and the color tool.
- One-pass "product + scene" generation can still touch the logo; if the brand matters, the cut-out + composite pipeline is not optional.

## Credit

The workflow idea is common in commercial AI product photography. This is an
independent write-up with its own taxonomy, prompts, recipes, and tool.
