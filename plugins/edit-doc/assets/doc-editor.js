/*!
 * doc-editor.js — the in-page WYSIWYG editor that travels inside an edit-doc HTML file.
 * Toggles contentEditable on #doc-content, drives a formatting toolbar via
 * document.execCommand, autosaves to localStorage, restores on reload, saves the
 * whole file (editor included) to disk via GitingSave, and exports a clean read-only
 * copy. Namespaced ed-* IDs. Standard web APIs only. Giting edit-doc. MIT.
 */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var content = $('doc-content');
  if (!content) return;

  // stable per-document id (so autosave/file handle track THIS document)
  var meta = {};
  try { meta = JSON.parse(($('doc-meta') || {}).textContent || '{}'); } catch (e) {}
  if (!meta.id) { meta.id = 'doc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7); }

  var engine = new window.GitingSave.Engine({ key: meta.id });
  var autosave = new window.GitingSave.Autosave(meta.id);
  var editing = false;
  var savedRange = null;

  function toast(t) {
    var el = $('ed-toast'); if (!el) return;
    el.textContent = t; el.classList.add('show');
    clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('show'); }, 2800);
  }

  // ---- edit mode ----
  function setEdit(on) {
    editing = on;
    content.setAttribute('contenteditable', on ? 'true' : 'false');
    var bar = $('ed-bar'); if (bar) bar.hidden = !on;
    var toggle = $('ed-toggle'); if (toggle) toggle.textContent = on ? '보기' : '편집';
    try { document.execCommand('styleWithCSS', false, true); } catch (e) {}
    if (on) content.focus({ preventScroll: true });
  }

  function focusContent() {
    content.focus({ preventScroll: true });
    if (savedRange) { var s = window.getSelection(); s.removeAllRanges(); s.addRange(savedRange); }
  }
  document.addEventListener('selectionchange', function () {
    var s = window.getSelection();
    if (s.rangeCount && content.contains(s.anchorNode)) savedRange = s.getRangeAt(0).cloneRange();
  });

  function exec(cmd, val) {
    if (!editing) return;
    focusContent();
    try { document.execCommand('styleWithCSS', false, true); } catch (e) {}
    document.execCommand(cmd, false, val);
    autosave.schedule(fullDoc);
    syncToolbar();
  }
  function block(tag) { exec('formatBlock', tag); }

  function insertTable() {
    if (!editing) return; focusContent();
    var r = 2, c = 2, cells = '';
    for (var i = 0; i < r; i++) { var row = ''; for (var j = 0; j < c; j++) row += '<td>&nbsp;</td>'; cells += '<tr>' + row + '</tr>'; }
    var html = '<table class="ed-tbl" style="border-collapse:collapse;width:100%"><tbody>' + cells + '</tbody></table><p><br></p>';
    document.execCommand('insertHTML', false, html);
    autosave.schedule(fullDoc);
  }

  function makeLink() {
    if (!editing) return; focusContent();
    var url = window.prompt('링크 주소 (https://...)', 'https://');
    if (url) exec('createLink', url);
  }

  // toolbar active-state sync
  function q(c) { try { return document.queryCommandState(c); } catch (e) { return false; } }
  function syncToolbar() {
    var bar = $('ed-bar'); if (!bar) return;
    ['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList',
     'justifyLeft', 'justifyCenter', 'justifyRight'].forEach(function (cmd) {
      var b = bar.querySelector('[data-cmd="' + cmd + '"]');
      if (b) b.classList.toggle('on', q(cmd));
    });
  }

  // ---- serialize ----
  function suggestName() {
    var h = content.querySelector('h1,h2,h3');
    var t = (h && h.textContent.trim()) || (document.title || '').trim() || '문서';
    return t.replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 60) + '.html';
  }
  // full document WITH the editor, opening in view mode
  function fullDoc() {
    var was = editing;
    if (was) setEdit(false);
    var restore = $('ed-restore'); var rWasOpen = restore && !restore.hidden;
    if (restore) restore.hidden = true;
    var meta$ = $('doc-meta'); if (meta$) meta$.textContent = JSON.stringify({ id: meta.id });
    var html = '<!doctype html>\n' + document.documentElement.outerHTML;
    if (rWasOpen && restore) restore.hidden = false;
    if (was) setEdit(true);
    return html;
  }
  // clean read-only copy: editor UI, engine, style, meta all removed
  function readOnlyDoc() {
    var clone = document.documentElement.cloneNode(true);
    ['ed-bar', 'ed-toast', 'ed-restore', 'ed-editor-style', 'ed-editor-script', 'doc-meta'].forEach(function (id) {
      var el = clone.querySelector('#' + id); if (el) el.remove();
    });
    clone.querySelectorAll('.ed-controls,[data-ed-transient]').forEach(function (el) { el.remove(); });
    var body = clone.querySelector('#doc-content'); if (body) body.setAttribute('contenteditable', 'false');
    return '<!doctype html>\n' + clone.outerHTML;
  }
  // exposed for verification (SKILL.md references these)
  window.EditDoc = { getHTML: fullDoc, getReadOnlyHTML: readOnlyDoc, setEdit: setEdit, id: meta.id };

  // ---- save / export ----
  function reportSave(res) {
    if (!res || res.method === 'cancel') return;
    autosave.markSaved(fullDoc());
    if (res.method === 'file') toast('저장했습니다 · ' + res.name);
    else toast('내려받았습니다 (이 브라우저는 직접 저장을 지원하지 않아 다운로드했습니다)');
  }
  function save(forceNew) {
    autosave.flush(fullDoc);
    engine.save(fullDoc(), suggestName(), forceNew).then(reportSave).catch(function () { toast('저장에 실패했습니다'); });
  }
  function exportReadOnly() {
    var name = suggestName().replace(/\.html$/i, '-배포용.html');
    window.GitingSave.download(readOnlyDoc(), name, 'text/html;charset=utf-8');
    toast('배포용 사본을 내려받았습니다 (편집기 없음)');
  }

  // ---- autosave + restore ----
  content.addEventListener('input', function () { if (editing) autosave.schedule(fullDoc); });
  window.addEventListener('pagehide', function () { if (autosave.pending()) autosave.flush(fullDoc); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && autosave.pending()) autosave.flush(fullDoc);
  });

  function checkRestore() {
    var a = autosave.read(); if (!a || !a.text) return;
    // only offer if the backup differs from what is on the page now
    if (a.text === fullDoc()) return;
    var banner = $('ed-restore'); if (!banner) return;
    var when = $('ed-restore-when');
    if (when) { try { when.textContent = new Date(a.ts).toLocaleString('ko-KR'); } catch (e) { when.textContent = a.ts; } }
    banner.hidden = false;
    var yes = $('ed-restore-yes'), no = $('ed-restore-no');
    if (yes) yes.onclick = function () {
      var d = document.implementation.createHTMLDocument(''); d.documentElement.innerHTML = a.text.replace(/^<!doctype[^>]*>/i, '');
      var src = d.querySelector('#doc-content');
      if (src) { content.innerHTML = src.innerHTML; toast('자동저장 백업을 불러왔습니다'); }
      banner.hidden = true;
    };
    if (no) no.onclick = function () { banner.hidden = true; };
  }

  // ---- wire toolbar ----
  var bar = $('ed-bar');
  if (bar) {
    bar.querySelectorAll('[data-cmd]').forEach(function (b) { b.addEventListener('click', function () { exec(b.getAttribute('data-cmd')); }); });
    bar.querySelectorAll('[data-block]').forEach(function (b) { b.addEventListener('click', function () { block(b.getAttribute('data-block')); }); });
    bar.addEventListener('mousedown', function (e) { if (e.target.closest('button')) e.preventDefault(); });
    var bsel = $('ed-block'); if (bsel) bsel.addEventListener('change', function () { block(bsel.value); bsel.selectedIndex = 0; });
    var fsel = $('ed-fontsize'); if (fsel) fsel.addEventListener('change', function () { exec('fontSize', fsel.value); });
    var fc = $('ed-forecolor'); if (fc) fc.addEventListener('input', function () { exec('foreColor', fc.value); });
    var bc = $('ed-backcolor'); if (bc) bc.addEventListener('input', function () { if (!document.execCommand('hiliteColor', false, bc.value)) exec('backColor', bc.value); autosave.schedule(fullDoc); });
    var lk = $('ed-link'); if (lk) lk.addEventListener('click', makeLink);
    var tb = $('ed-table'); if (tb) tb.addEventListener('click', insertTable);
  }
  document.addEventListener('selectionchange', function () { if (editing) syncToolbar(); });

  // controls
  var toggle = $('ed-toggle'); if (toggle) toggle.addEventListener('click', function () { setEdit(!editing); });
  var saveBtn = $('ed-save'); if (saveBtn) saveBtn.addEventListener('click', function () { save(false); });
  var saveAsBtn = $('ed-saveas'); if (saveAsBtn) saveAsBtn.addEventListener('click', function () { save(true); });
  var exportBtn = $('ed-export'); if (exportBtn) exportBtn.addEventListener('click', exportReadOnly);

  // keyboard: Cmd/Ctrl+E toggle edit, Cmd/Ctrl+S save
  document.addEventListener('keydown', function (e) {
    var mod = e.metaKey || e.ctrlKey; if (!mod) return;
    var k = e.key.toLowerCase();
    if (k === 'e') { e.preventDefault(); setEdit(!editing); }
    else if (k === 's') { e.preventDefault(); if (!editing) setEdit(true); save(false); }
  });

  // boot: remember a prior file handle, offer restore
  engine.restore().then(function (h) { if (h) { /* handle remembered; save() will reuse it */ } });
  autosave.markSaved(fullDoc());
  checkRestore();
})();
