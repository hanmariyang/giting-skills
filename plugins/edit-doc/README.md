# edit-doc

Documents the reader edits and saves right in the browser. No server, no
extension, no login, no dependencies. Part of [Giting Skills](https://github.com/hanmariyang/giting-skills). MIT.

Two kinds:

- **HTML** — the editor travels inside the `.html` file. Open it, click 편집, save to disk. `skeleton.html` is the template to copy; `examples/demo.html` is a filled example.
- **Markdown** — `md-editor.html` is a standalone source + live-preview editor that opens and saves any `.md` (a plain `.md` can't carry an editor, so the tool is the vehicle).

Both save through the File System Access API when available (remembering the file across sessions), fall back to a download otherwise, autosave a localStorage backup, and can export a clean read-only copy.

## Install

```
/plugin marketplace add hanmariyang/giting-skills
/plugin install edit-doc@giting
```

Then ask for an editable report/letter/guide, or a browser markdown editor.

## Try it now

Open `examples/demo.html` (HTML editor) or `md-editor.html` (Markdown editor)
in any modern browser. `Cmd/Ctrl+E` toggles edit, `Cmd/Ctrl+S` saves.

## Build

Sources live in `assets/`. Regenerate the self-contained HTML with:

```sh
node build.mjs
```

`skeleton.html`, `examples/demo.html`, and `md-editor.html` are generated (committed) —
edit the assets and rebuild, never the inlined engine inside the HTML.

## Honest limits

- The HTML editor uses `document.execCommand` (deprecated but universally supported,
  and the pragmatic choice for a zero-dependency standalone file).
- No Shadow DOM isolation; the `ed-*` / `--ed-*` namespace avoids most CSS collisions.
- Saved HTML is not sanitized; treat documents you did not author as untrusted.
- The Markdown renderer is a compact subset, not full CommonMark, and escapes HTML.

## Credit

Inspired by community work on browser-editable standalone HTML documents. This is an
independent reimplementation: our own editor, save engine, Markdown renderer, and the
Markdown companion (an addition not in the original idea).
