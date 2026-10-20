#!/usr/bin/env node
/* smoke — 브라우저 없이 페이지 스크립트를 3초 돌려 본다 (의존성 0).
 * 사용: node smoke.mjs <page.html>
 * 가짜 캔버스로 그리기 호출을 기록해 세 가지를 본다.
 *   S1 오류 없이 돈다   S2 화면 안에 보이는 것이 그려진다   S3 프레임마다 그림이 바뀐다(움직인다)
 * 통과하지 못하면 exit 1. 진짜 브라우저가 아니라서 「통과 = 예쁘다」는 아니다. 「실패 = 확실히 깨졌다」다.
 */
import fs from 'node:fs';
import vm from 'node:vm';
import { dirname, resolve } from 'node:path';

const file = process.argv[2];
if (!file) { console.error('사용: node smoke.mjs <page.html>'); process.exit(1); }
const html = fs.readFileSync(file, 'utf8');
const W = 1280, H = 720;
const errors = [];
let frameMarks = [], frames = [];

function makeCtx(canvas) {
  const st = { fillStyle: '#000', strokeStyle: '#000', globalAlpha: 1, lineWidth: 1, path: [] };
  const vis = (x, y) => Number.isFinite(x) && Number.isFinite(y) && x >= 0 && y >= 0 && x <= W && y <= H;
  const alphaOf = (c) => { const m = /rgba?\([^)]*,\s*([\d.]+)\s*\)/.exec(String(c)); return (m ? +m[1] : 1) * st.globalAlpha; };
  const mark = (kind, pts, color) => {
    const a = alphaOf(color);
    if (a < 0.04) return;
    const inside = pts.filter(([x, y]) => vis(x, y));
    if (!inside.length) return;
    frameMarks.push(kind + ':' + inside.map(([x, y]) => (x | 0) + ',' + (y | 0)).join(';'));
  };
  const grad = () => ({ addColorStop() {} });
  const target = {
    canvas, save() {}, restore() {}, setTransform() {}, resetTransform() {}, transform() {}, scale() {}, rotate() {}, translate() {},
    beginPath() { st.path = []; }, closePath() {}, moveTo(x, y) { st.path.push([x, y]); }, lineTo(x, y) { st.path.push([x, y]); },
    arc(x, y) { st.path.push([x, y]); }, ellipse(x, y) { st.path.push([x, y]); }, rect(x, y, w, h) { st.path.push([x, y], [x + w, y + h]); },
    roundRect(x, y, w, h) { st.path.push([x, y], [x + w, y + h]); },
    quadraticCurveTo(_a, _b, x, y) { st.path.push([x, y]); }, bezierCurveTo(_a, _b, _c, _d, x, y) { st.path.push([x, y]); }, arcTo(_a, _b, x, y) { st.path.push([x, y]); },
    fill() { mark('f', st.path, st.fillStyle); }, stroke() { mark('s', st.path, st.strokeStyle); }, clip() {},
    fillRect(x, y, w, h) { if (!(w >= W * 0.9 && h >= H * 0.9)) mark('r', [[x, y], [x + w, y + h]], st.fillStyle); },
    strokeRect(x, y) { mark('sr', [[x, y]], st.strokeStyle); }, clearRect() {},
    fillText(s, x, y) { mark('t', [[x, y]], st.fillStyle); }, strokeText() {}, measureText(s) { return { width: String(s).length * 8 }; },
    drawImage(img, ...a) { const [x, y] = a.length >= 6 ? [a[4], a[5]] : [a[0], a[1]]; mark('i', [[x, y]], 'rgba(0,0,0,1)'); },
    createLinearGradient: grad, createRadialGradient: grad, createConicGradient: grad, createPattern() { return {}; },
    getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h }; },
    createImageData(w, h) { return { data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h }; }, putImageData() {},
    setLineDash() {}, getLineDash() { return []; }, isPointInPath() { return false; },
  };
  return new Proxy(target, {
    get(t, k) { if (k in t) return t[k]; if (k in st) return st[k]; return undefined; },
    set(t, k, v) { st[k] = v; return true; },
  });
}

function makeEl(tag) {
  const el = {
    tagName: String(tag).toUpperCase(), style: {}, dataset: {}, children: [], classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    width: 300, height: 150, clientWidth: W, clientHeight: H, offsetWidth: W, offsetHeight: H, textContent: '', innerHTML: '',
    appendChild(c) { this.children.push(c); return c; }, append() {}, prepend() {}, remove() {}, insertBefore(c) { return c; }, removeChild(c) { return c; },
    setAttribute() {}, getAttribute() { return null; }, addEventListener() {}, removeEventListener() {},
    getBoundingClientRect() { return { left: 0, top: 0, x: 0, y: 0, width: W, height: H, right: W, bottom: H }; },
    querySelector() { return makeEl('div'); }, querySelectorAll() { return []; }, focus() {}, closest() { return makeEl('div'); },
  };
  el.parentNode = el.parentElement = el.tagName === 'HTML' ? null : { ...el, tagName: 'DIV', children: [] };
  if (el.tagName === 'CANVAS') { let ctx; el.getContext = () => (ctx ||= makeCtx(el)); el.toDataURL = () => 'data:,'; }
  return el;
}

const canvases = new Map();
const byId = (id) => { if (!canvases.has(id)) canvases.set(id, makeEl(/<canvas[^>]*id=["']?([\w-]+)/i.exec(html)?.[1] === id || /canvas|cv|bg|c$/i.test(id) ? 'canvas' : 'div')); return canvases.get(id); };
const rafQ = [];
const listeners = {};
const doc = {
  getElementById: byId, querySelector: (s) => (/canvas/i.test(s) ? byId('__q' + s) : makeEl('div')), querySelectorAll: (s) => (/canvas/i.test(s) ? [byId('__q' + s)] : []),
  createElement: makeEl, body: makeEl('body'), documentElement: makeEl('html'), head: makeEl('head'), hidden: false, readyState: 'complete',
  addEventListener(t, f) { (listeners['d:' + t] ||= []).push(f); }, removeEventListener() {}, fonts: { ready: Promise.resolve() },
};
// <canvas id> 는 진짜 캔버스로
for (const m of html.matchAll(/<canvas[^>]*id=["']([\w-]+)/gi)) canvases.set(m[1], makeEl('canvas'));
const win = {
  document: doc, innerWidth: W, innerHeight: H, devicePixelRatio: 2, performance, console, Math, Date, JSON, Float32Array, Uint8ClampedArray, Array, Object, Number, String, Map, Set, Promise, Symbol, Error,
  setTimeout: (f) => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  requestAnimationFrame(f) { rafQ.push(f); return rafQ.length; }, cancelAnimationFrame() {},
  matchMedia: (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
  addEventListener(t, f) { (listeners[t] ||= []).push(f); }, removeEventListener() {}, dispatchEvent() { return true; },
  Event: class { constructor(t) { this.type = t; } }, Image: class { constructor() { this.width = 1; this.height = 1; } set src(v) { this.onload && this.onload(); } },
  ResizeObserver: class { observe() {} disconnect() {} }, IntersectionObserver: class { observe() {} disconnect() {} },
  navigator: { userAgent: 'smoke' }, location: { href: 'file://' + file, search: '', hash: '' }, getComputedStyle: () => ({ getPropertyValue: () => '' }),
};
win.window = win; win.self = win; win.globalThis = win;
const ctx = vm.createContext(win);

const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)];
for (const [, attrs, body] of scripts) {
  if (/type=["'](application\/json|text\/template)/i.test(attrs)) continue;
  let code = body;
  const src = /src=["']([^"']+)/i.exec(attrs)?.[1];
  if (src) { if (/^https?:/.test(src)) { errors.push('외부 스크립트는 못 돌림: ' + src); continue; } try { code = fs.readFileSync(resolve(dirname(file), src), 'utf8'); } catch { errors.push('스크립트 파일 없음: ' + src); continue; } }
  try { vm.runInContext(code, ctx, { timeout: 2000 }); } catch (e) { errors.push(String(e && e.stack || e).split('\n').slice(0, 2).join(' ')); }
}
for (const t of ['DOMContentLoaded', 'load']) for (const f of [...(listeners['d:' + t] || []), ...(listeners[t] || [])]) try { f({ type: t }); } catch (e) { errors.push(String(e).slice(0, 160)); }

let now = 16;
for (let i = 0; i < 180 && rafQ.length; i++) {           // 3초 · 60fps
  const q = rafQ.splice(0); frameMarks = [];
  for (const f of q) { try { f(now); } catch (e) { if (errors.length < 5) errors.push(String(e && e.stack || e).split('\n').slice(0, 2).join(' ')); } }
  frames.push(frameMarks); now += 1000 / 60;
}
const lastMarks = frames.at(-1) || [];
const sig = (m) => m.join('|');
const moving = frames.length > 60 && sig(frames[60]) !== sig(frames.at(-1));
const S1 = errors.length === 0, S2 = lastMarks.length >= 5, S3 = moving;
console.log(`■ ${file}`);
console.log(`  [S1 오류 없이 돈다] ${S1 ? '통과' : '실패 — ' + errors[0]}`);
console.log(`  [S2 화면 안에 보이는 것] ${S2 ? '통과' : '실패'} — 마지막 프레임에 보이는 그리기 ${lastMarks.length}개 (불투명도 4% 넘고 화면 안)`);
console.log(`  [S3 움직인다] ${S3 ? '통과' : '실패'} — 돈 프레임 ${frames.length}개`);
process.exit(S1 && S2 && S3 ? 0 : 1);
