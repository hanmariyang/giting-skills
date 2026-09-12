/*!
 * save-engine.js — browser file saving for editable standalone documents.
 * File System Access API (remember the file across sessions via IndexedDB) with
 * a Blob-download fallback, plus a localStorage autosave. Standard web APIs only:
 * no server, no dependencies. Shared by edit-doc's HTML editor and Markdown editor.
 * Giting edit-doc. MIT.
 */
(function (global) {
  'use strict';

  var DB_NAME = 'giting-edit-doc';
  var STORE = 'handles';
  var supported = typeof global.showSaveFilePicker === 'function';

  function openDb() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(STORE); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }
  function idbGet(key) {
    return openDb().then(function (db) {
      return new Promise(function (resolve) {
        var r = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
        r.onsuccess = function () { resolve(r.result || null); db.close(); };
        r.onerror = function () { resolve(null); db.close(); };
      });
    }).catch(function () { return null; });
  }
  function idbSet(key, val) {
    return openDb().then(function (db) {
      return new Promise(function (resolve) {
        var r = db.transaction(STORE, 'readwrite').objectStore(STORE).put(val, key);
        r.onsuccess = function () { resolve(true); db.close(); };
        r.onerror = function () { resolve(false); db.close(); };
      });
    }).catch(function () { return false; });
  }

  function download(text, name, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name || 'document';
    a.setAttribute('data-ed-transient', '');
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  function verifyPermission(handle) {
    if (!handle.queryPermission) return Promise.resolve(true);
    var q = { mode: 'readwrite' };
    return handle.queryPermission(q).then(function (p) {
      if (p === 'granted') return true;
      return handle.requestPermission(q).then(function (p2) { return p2 === 'granted'; });
    });
  }

  // opts: { key, accept:{mime:[ext]}, acceptDesc, mime }
  function Engine(opts) {
    opts = opts || {};
    this.key = opts.key || ('url:' + location.origin + location.pathname);
    this.accept = opts.accept || { 'text/html': ['.html', '.htm'] };
    this.acceptDesc = opts.acceptDesc || 'HTML 문서';
    this.mime = opts.mime || 'text/html;charset=utf-8';
    this.handle = null;
  }
  Engine.prototype.savedName = function () { return this.handle && this.handle.name ? this.handle.name : null; };
  Engine.prototype.restore = function () {
    var self = this;
    if (!supported) return Promise.resolve(null);
    return idbGet(this.key).then(function (h) {
      if (h && typeof h.createWritable === 'function') { self.handle = h; return h; }
      return null;
    });
  };
  // returns { method: 'file'|'download'|'cancel', name?, reason? }
  Engine.prototype.save = function (text, suggestedName, forceNew) {
    var self = this;
    if (!supported) { download(text, suggestedName, this.mime); return Promise.resolve({ method: 'download' }); }
    return Promise.resolve().then(function () {
      if (forceNew || !self.handle) {
        return global.showSaveFilePicker({
          suggestedName: suggestedName,
          types: [{ description: self.acceptDesc, accept: self.accept }]
        }).then(function (h) { self.handle = h; });
      }
      return verifyPermission(self.handle).then(function (ok) {
        if (!ok) { var e = new Error('perm'); e.code = 'perm'; throw e; }
      });
    }).then(function () {
      return self.handle.createWritable().then(function (w) {
        return w.write(text).then(function () { return w.close(); });
      });
    }).then(function () {
      return idbSet(self.key, self.handle).then(function () { return { method: 'file', name: self.handle.name }; });
    }).catch(function (err) {
      if (err && err.name === 'AbortError') return { method: 'cancel' };
      download(text, suggestedName, self.mime);
      if (forceNew) self.handle = null;
      return { method: 'download', reason: err && (err.code || err.name) };
    });
  };

  function Autosave(key) { this.key = 'giting-edit-doc:autosave:' + key; this.last = null; this.timer = null; }
  Autosave.prototype.schedule = function (getText) {
    var self = this;
    clearTimeout(this.timer);
    this.timer = setTimeout(function () { self.flush(getText); }, 700);
  };
  Autosave.prototype.pending = function () { return this.timer !== null; };
  Autosave.prototype.flush = function (getText) {
    clearTimeout(this.timer); this.timer = null;
    try {
      var t = getText();
      if (t === this.last) return true;
      localStorage.setItem(this.key, JSON.stringify({ ts: new Date().toISOString(), text: t }));
      this.last = t; return true;
    } catch (e) { return false; }
  };
  Autosave.prototype.read = function () {
    try { var raw = localStorage.getItem(this.key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  };
  Autosave.prototype.clear = function () { try { localStorage.removeItem(this.key); } catch (e) {} };
  Autosave.prototype.markSaved = function (t) { this.last = t; };

  global.GitingSave = { supported: supported, Engine: Engine, Autosave: Autosave, download: download };
})(window);
