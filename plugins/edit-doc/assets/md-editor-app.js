/*!
 * md-editor-app.js — the standalone Markdown editor (source + live preview) that
 * opens and saves a .md file. A .md is plain text so it cannot carry a JS editor;
 * this is a reusable tool that edits any markdown file, using GitingSave to write
 * back to disk (or download) and GitingMd for the preview. Giting edit-doc. MIT.
 */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var ta = $('md-src'), preview = $('md-preview'), title = $('md-title');
  if (!ta) return;

  var docKey = 'md:' + location.origin + location.pathname;
  var engine = new window.GitingSave.Engine({
    key: docKey, accept: { 'text/markdown': ['.md', '.markdown', '.mdown'], 'text/plain': ['.txt'] },
    acceptDesc: 'Markdown 문서', mime: 'text/markdown;charset=utf-8'
  });
  var autosave = new window.GitingSave.Autosave(docKey);
  var curName = 'document.md';

  function toast(t) {
    var el = $('md-toast'); if (!el) return;
    el.textContent = t; el.classList.add('show');
    clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('show'); }, 2800);
  }
  function getText() { return ta.value; }
  function renderPreview() { if (preview) preview.innerHTML = window.GitingMd.render(ta.value); }
  function stats() {
    var t = ta.value, words = (t.trim().match(/\S+/g) || []).length;
    var c = $('md-stats'); if (c) c.textContent = words + '단어 · ' + t.length + '자';
  }
  function firstHeading() {
    var m = ta.value.match(/^#{1,6}\s+(.+)$/m);
    return (m ? m[1] : 'document').replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 60) || 'document';
  }
  function suggestName() { return (curName && /\.(md|markdown|mdown|txt)$/i.test(curName)) ? curName : (firstHeading() + '.md'); }

  function onChange() {
    renderPreview(); stats(); autosave.schedule(getText);
    if (title) title.textContent = firstHeading();
  }
  ta.addEventListener('input', onChange);
  window.addEventListener('pagehide', function () { if (autosave.pending()) autosave.flush(getText); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && autosave.pending()) autosave.flush(getText);
  });

  // ---- open ----
  function loadText(text, name) {
    ta.value = text; curName = name || curName; onChange();
    autosave.markSaved(text); toast('열었습니다 · ' + (name || ''));
  }
  function openFile() {
    if (window.showOpenFilePicker) {
      window.showOpenFilePicker({ types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md', '.markdown', '.mdown'], 'text/plain': ['.txt'] } }] })
        .then(function (arr) {
          var handle = arr[0]; engine.handle = handle;
          return handle.getFile().then(function (f) { return f.text().then(function (t) { loadText(t, f.name); }); });
        }).catch(function (e) { if (e && e.name !== 'AbortError') toast('열기에 실패했습니다'); });
    } else {
      var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.md,.markdown,.mdown,.txt,text/markdown,text/plain';
      inp.onchange = function () { var f = inp.files[0]; if (!f) return; f.text().then(function (t) { loadText(t, f.name); }); };
      inp.click();
    }
  }

  // ---- save ----
  function reportSave(res) {
    if (!res || res.method === 'cancel') return;
    autosave.markSaved(getText());
    if (res.method === 'file') { curName = res.name || curName; toast('저장했습니다 · ' + res.name); }
    else toast('내려받았습니다 (이 브라우저는 직접 저장을 지원하지 않아 다운로드했습니다)');
  }
  function save(forceNew) {
    autosave.flush(getText);
    engine.save(getText(), suggestName(), forceNew).then(reportSave).catch(function () { toast('저장에 실패했습니다'); });
  }
  function exportHtml() {
    var docHtml = '<!doctype html>\n<html lang="ko"><head><meta charset="utf-8">'
      + '<meta name="viewport" content="width=device-width,initial-scale=1"><title>' + firstHeading() + '</title>'
      + '<style>body{max-width:52rem;margin:2rem auto;padding:0 1.2rem;font:16px/1.7 system-ui,-apple-system,"Segoe UI",sans-serif;color:#1c1c22}'
      + 'pre{background:#f4f4f6;padding:1rem;border-radius:8px;overflow:auto}code{font-family:ui-monospace,monospace}'
      + 'blockquote{border-left:3px solid #d0d0d8;margin:0;padding:.2rem 1rem;color:#55555f}'
      + 'table{border-collapse:collapse}th,td{border:1px solid #d0d0d8;padding:.4rem .7rem}img{max-width:100%}'
      + '@media(prefers-color-scheme:dark){body{background:#16161a;color:#e8e8ee}pre{background:#26262c}}</style></head><body>'
      + window.GitingMd.render(ta.value) + '</body></html>';
    window.GitingSave.download(docHtml, firstHeading() + '.html', 'text/html;charset=utf-8');
    toast('HTML로 내려받았습니다');
  }

  // ---- toolbar: wrap/prefix selection ----
  function surround(before, after) {
    ta.focus();
    var s = ta.selectionStart, e = ta.selectionEnd, v = ta.value, sel = v.slice(s, e);
    ta.value = v.slice(0, s) + before + sel + after + v.slice(e);
    ta.selectionStart = s + before.length; ta.selectionEnd = e + before.length;
    onChange();
  }
  function prefixLines(prefix) {
    ta.focus();
    var s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
    var ls = v.lastIndexOf('\n', s - 1) + 1;
    var block = v.slice(ls, e).split('\n').map(function (l) { return prefix + l; }).join('\n');
    ta.value = v.slice(0, ls) + block + v.slice(e); onChange();
  }
  var acts = {
    'md-bold': function () { surround('**', '**'); }, 'md-italic': function () { surround('*', '*'); },
    'md-code': function () { surround('`', '`'); }, 'md-h': function () { prefixLines('## '); },
    'md-ul': function () { prefixLines('- '); }, 'md-ol': function () { prefixLines('1. '); },
    'md-quote': function () { prefixLines('> '); },
    'md-link': function () { var u = window.prompt('링크 주소', 'https://'); if (u) surround('[', '](' + u + ')'); }
  };
  Object.keys(acts).forEach(function (id) { var b = $(id); if (b) b.addEventListener('click', acts[id]); });

  // ---- view modes ----
  function setView(mode) {
    document.body.setAttribute('data-view', mode);
    ['split', 'source', 'preview'].forEach(function (m) { var b = $('md-view-' + m); if (b) b.classList.toggle('on', m === mode); });
  }
  ['split', 'source', 'preview'].forEach(function (m) { var b = $('md-view-' + m); if (b) b.addEventListener('click', function () { setView(m); }); });

  // controls
  var o = $('md-open'); if (o) o.addEventListener('click', openFile);
  var sv = $('md-save'); if (sv) sv.addEventListener('click', function () { save(false); });
  var sa = $('md-saveas'); if (sa) sa.addEventListener('click', function () { save(true); });
  var ex = $('md-exporthtml'); if (ex) ex.addEventListener('click', exportHtml);

  document.addEventListener('keydown', function (e) {
    var mod = e.metaKey || e.ctrlKey; if (!mod) return;
    var k = e.key.toLowerCase();
    if (k === 's') { e.preventDefault(); save(false); }
    else if (k === 'o') { e.preventDefault(); openFile(); }
    else if (k === 'b') { e.preventDefault(); surround('**', '**'); }
    else if (k === 'i') { e.preventDefault(); surround('*', '*'); }
  });

  // boot
  window.EditMd = { getText: getText, setText: function (t) { loadText(t, curName); } };
  engine.restore();
  setView('split');
  // restore autosave if newer than initial content
  var a = autosave.read();
  if (a && a.text && a.text !== ta.value) {
    var banner = $('md-restore');
    if (banner) {
      var w = $('md-restore-when'); if (w) { try { w.textContent = new Date(a.ts).toLocaleString('ko-KR'); } catch (e) { w.textContent = a.ts; } }
      banner.hidden = false;
      var y = $('md-restore-yes'), n = $('md-restore-no');
      if (y) y.onclick = function () { loadText(a.text, curName); banner.hidden = true; };
      if (n) n.onclick = function () { banner.hidden = true; autosave.markSaved(ta.value); };
    }
  } else { autosave.markSaved(ta.value); }
  onChange();
})();
