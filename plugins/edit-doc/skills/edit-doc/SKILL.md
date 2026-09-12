---
name: edit-doc
description: "Make a document the reader can edit and save right in the browser, with no server, extension, or login. Two kinds: (1) a standalone HTML document that carries its own editor (reports, letters, guides, notices) — copy skeleton.html and write the content; (2) a Markdown document edited in a standalone source+preview editor that saves .md — ship md-editor.html. Use when the user asks for an editable document, an HTML report they can tweak, a shareable doc the recipient can fix, a browser markdown editor, or 'make this editable and saveable'."
---

# edit-doc — documents you edit and save in the browser

Two deliverables live in `assets/` (built, self-contained) and their sources.

- **HTML document** — the editor travels *inside* the `.html` file. Open it, click 편집, save. `skeleton.html` is the golden template; `examples/demo.html` is a filled example.
- **Markdown document** — a `.md` is plain text and cannot carry a JS editor, so `md-editor.html` is a standalone source+preview editor that opens and saves any `.md`. Ship it next to the markdown file.

Both save through one engine (`assets/save-engine.js`): the File System Access API when the browser supports it (and it remembers the file across sessions via IndexedDB), a plain download otherwise. Both autosave a backup to localStorage and offer to restore it. No dependencies, no network.

## Make a new HTML document

1. Copy `skeleton.html` to the requested path.
2. Put the document's design in `<style id="doc-style">` and its body inside `<main id="doc-content">`. Preserve the user's content, language, and any design they gave you; do not impose the example's look.
3. Leave the editor untouched: keep `<style id="ed-editor-style">`, `<script id="ed-editor-script">`, the `#ed-*` UI blocks, and `<script id="doc-meta">`. Give `doc-meta` a fresh unique `id` (replace `REPLACE-WITH-UNIQUE-ID`) so autosave and the saved-file link track this document.
4. Open the result in a browser tool if one is available and verify (see Verification). If no browser tool is available, say which interactive checks you could not run.

Do NOT re-type or summarize the engine by hand. Copy the built file.

## Make an editable Markdown workflow

1. Copy `md-editor.html` to the output folder (it is fully self-contained).
2. If there is existing markdown, either write it into the `<textarea id="md-src">` initial content, or tell the user to open their `.md` with the 열기 button.
3. The editor saves back to `.md` (Cmd/Ctrl+S), can 다른 이름 to a new file, and can export the rendered preview to a standalone `.html`.

## Saving, autosave, export — describe these accurately

- **저장 (Save):** first time, supported browsers ask where to put the file; after that the same file can be reused (permission may need re-granting). Unsupported browsers download instead. Never promise silent first-time overwrite.
- **다른 이름 (Save as):** always picks a new destination (or downloads).
- **Autosave:** a localStorage backup, separate from the file. On reload, if the backup differs, a banner offers to restore it. It is not a file save.
- **배포용 (HTML read-only export):** downloads a clean copy with the editor UI, engine, and doc-meta removed, content and design kept. It does not embed external resources or publish anything.
- The Markdown editor's **HTML** button exports the rendered preview as a standalone styled `.html`.

Keyboard: Cmd/Ctrl+E toggles edit (HTML), Cmd/Ctrl+S saves, Cmd/Ctrl+O opens (Markdown).

## Rebuilding the engine

Edit sources in `assets/` (`doc-editor.css`, `doc-editor.js`, `save-engine.js`, `md-render.js`, `md-editor-app.js`), then:

```sh
node build.mjs
```

This regenerates `skeleton.html`, `examples/demo.html`, and `md-editor.html` with the engine inlined. Never hand-edit the generated HTML's engine; edit the source and rebuild.

## Verification (per generated document)

- The HTML doc has exactly one `#doc-content` and all `#ed-*` UI blocks; `doc-meta` has a unique id.
- Parse `EditDoc.getHTML()`: the editor is present and `#doc-content` is not actively editable.
- Parse `EditDoc.getReadOnlyHTML()`: no `#ed-bar`, no `#ed-editor-script`, content and design intact.
- Toggle edit, apply a format, confirm the body updates.
- Markdown: the preview renders headings/lists/tables, and the source+preview toggle works.
- Do not claim native file-picker or cross-browser save works from a headless/simulated run; state what was not exercised.

## Notes and honest limits

- The HTML editor uses `document.execCommand` for formatting. It is deprecated but still works in every current browser and needs zero dependencies, which is the whole point of a file that runs standalone. Rich structural editing (nested components, track changes) is out of scope.
- The editor is not isolated with Shadow DOM, so it can inherit the document's own CSS. Namespacing (`ed-*`, `--ed-*`) avoids most collisions; check unusual document stylesheets.
- Saved HTML is not sanitized. Treat a document you did not author as untrusted content.
- The Markdown renderer is a compact subset (headings, bold/italic/code, lists, quotes, hr, links, images, tables), not full CommonMark. It escapes HTML, so pasted markup shows as text.
