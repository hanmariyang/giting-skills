# slide-pick

Decide **what to draw on each slide before you design** the deck. Given a topic and the
judgment the audience must make, slide-pick picks the right layout, chart, and diagram,
names it, and blocks the choices that mislead. Part of
[Giting Skills](https://github.com/hanmariyang/giting-skills). MIT.

The rule under everything: **every slide states one judgment the viewer must make, and
the form is chosen to serve that judgment, not to decorate it.**

## What it ships

- **A selection method** — 판단 문장 → 후보 좁히기(레이아웃/차트/도형) → 이름 붙이기 → 금지 규칙 체크.
- **A fill-in PPT prompt** — hand it to any slide-making AI (목적 → 사고 순서 → 표 먼저 → 점검).
- **Concise taxonomies** — layouts by purpose, charts by intent, SmartArt-style diagrams by relationship, plus a forbidden list (3D, dual-Y, truncated axis, "감사합니다" 마무리 등).

## Install

```
/plugin marketplace add hanmariyang/giting-skills
/plugin install slide-pick@giting
```

## Sources & licensing

Chart categories are referenced from the Financial Times Visual Vocabulary (CC BY-SA 4.0)
and SmartArt names from Microsoft (both linked in SKILL.md). The when-to-use guidance and
the selection method are this skill's own; the source descriptions are not reproduced
verbatim, and you should not paste them into a deck either.
