#!/usr/bin/env node
// 한글 줄바꿈 실측. 어절이 두 줄로 쪼개진 자리 · 한 글자만 넘어간 줄 · 상자를 뚫은 글자를 찾는다.
// 글자를 키운 상태(--text · --zoom)에서는 버튼 글자가 잘리는지 · 버튼이 실제로 눌리는지도 본다.
//
//   node wrapcheck.mjs <url|파일> [폭들] [--scope 셀렉터] [--text 150,200] [--zoom 150,200] [--json]
//
// 눈으로 훑으면 안 보인다. 쪼개짐은 특정 폭에서만 생기기 때문이다. 그래서 폭 여럿에서 실제로 띄워 잰다.
// 의존성 없음. Node 22 이상(내장 WebSocket)과 크롬 계열 브라우저 하나만 있으면 된다.
//
// 끝 코드: 0 = 문제 없음 · 1 = 쪼개짐 · 넘침 · 버튼 잘림 · 눌리지 않음이 있음 · 2 = 실행 못 함
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const argv = process.argv.slice(2);
if (!argv.length || argv[0] === '-h' || argv[0] === '--help') {
  console.log(`한글 줄바꿈 실측

  node wrapcheck.mjs <url|파일> [폭들] [--scope 셀렉터] [--text 150,200] [--zoom 150,200] [--json]

  폭들     쉼표로 여럿. 기본 390,768,1280
  --scope  이 안만 본다 (기본 body)
  --text   글자만 키운다(%). 폰의 글자 크기 설정처럼 배치 폭은 그대로. 예) 150,200
  --zoom   브라우저 확대(%). 화면 전체가 커져 실제 배치 폭이 줄어든다. 예) 150,200
  --json   결과를 JSON 으로

  --text · --zoom 을 주면 기본 크기(100%)와 함께 잰다.
  키운 상태에서는 버튼 글자가 잘리는지 · 다른 것에 덮여 안 눌리는지도 센다.

  예) node wrapcheck.mjs index.html
      node wrapcheck.mjs http://localhost:3000 360,390 --scope main
      node wrapcheck.mjs index.html 390 --text 150,200 --zoom 200`);
  process.exit(0);
}
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const JSON_OUT = argv.includes('--json');
const SCOPE = opt('scope', 'body');
let target = argv[0];
if (!/^(https?|file):/.test(target)) {
  if (!existsSync(target)) { console.error(`파일이 없다: ${target}`); process.exit(2); }
  target = pathToFileURL(realpathSync(target)).href;
}
const widths = (argv[1] && !argv[1].startsWith('--') ? argv[1] : '390,768,1280')
  .split(',').map(Number).filter((n) => n > 0);
const pcts = (n) => (opt(n, '') || '').split(',').map(Number).filter((x) => x > 100 && x <= 400);
// 잴 조건: 기본 크기 하나 + 글자만 키운 것 + 확대한 것
const modes = [{ kind: 'base', pct: 100 }, ...pcts('text').map((pct) => ({ kind: 'text', pct })), ...pcts('zoom').map((pct) => ({ kind: 'zoom', pct }))];

// ── 브라우저 찾기 ─────────────────────────────────────
const CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean);
const CHROME = CANDIDATES.find((p) => existsSync(p));
if (!CHROME) { console.error('크롬 계열 브라우저를 못 찾았다. CHROME_PATH 로 경로를 알려 준다.'); process.exit(2); }
if (typeof WebSocket === 'undefined') { console.error('Node 22 이상이 필요하다(내장 WebSocket).'); process.exit(2); }

const PROFILE = mkdtempSync(join(tmpdir(), 'wrapcheck-'));
const PORT = 9500 + Math.floor(Math.random() * 400);
const proc = spawn(CHROME, ['--headless', '--disable-gpu', '--no-sandbox', '--disk-cache-size=1',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, 'about:blank'], { stdio: 'ignore' });
let swept = false;
const sweep = () => {
  if (swept) return; swept = true;
  try { proc.kill('SIGKILL'); } catch {}
  try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300); } catch {}
  try { rmSync(PROFILE, { recursive: true, force: true }); } catch {}
};
process.on('exit', sweep);
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => { sweep(); process.exit(130); });

let page = null;
for (let i = 0; i < 80 && !page; i++) {
  try { page = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((x) => x.type === 'page'); } catch {}
  if (!page) await sleep(250);
}
if (!page) { console.error('브라우저가 뜨지 않았다'); process.exit(2); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => { ws.onopen = r; });
let seq = 0; const wait = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } };
const send = (method, params = {}) => new Promise((r) => { const id = ++seq; wait.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
await send('Page.enable'); await send('Runtime.enable');

// ── 페이지 안에서 도는 셈 ─────────────────────────────
// 글자만 키우기: 모든 요소의 지금 글자 크기(와 px 로 정한 줄 높이)에 배율을 곱한다. 배치 폭은 그대로 둔다.
// 폰의 글자 크기 설정처럼 상자 크기는 그대로인데 글자만 커지는 상태를 흉내 낸다.
function scaleText(f) {
  const els = [document.body, ...document.body.querySelectorAll('*')];
  const was = els.map((e) => { const cs = getComputedStyle(e); return [e, parseFloat(cs.fontSize), cs.lineHeight]; });
  for (const [e, fs, lh] of was) {
    if (fs) e.style.setProperty('font-size', fs * f + 'px', 'important');
    if (lh.endsWith('px')) e.style.setProperty('line-height', parseFloat(lh) * f + 'px', 'important');
  }
  return els.length;
}
// 버튼 · 링크: 글자가 상자 밖으로 잘리는지, 가운데를 눌렀을 때 그 버튼이 눌리는지
function taps(scopeSel) {
  const scope = document.querySelector(scopeSel) || document.body;
  const out = [];
  for (const el of scope.querySelectorAll('button,a[href],[role=button],input[type=submit],input[type=button],summary')) {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || !el.getClientRects().length) continue;
    const label = (el.innerText || el.value || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
    if (!label) continue;
    const found = [];
    // 잘림: 상자보다 글자가 크다(가로 또는 세로). 말줄임(…)은 일부러 그런 것이라 뺀다
    const cw = el.scrollWidth - el.clientWidth, ch = el.scrollHeight - el.clientHeight;
    if (el.clientWidth > 0 && cs.textOverflow !== 'ellipsis' && (cw > 1 || ch > 1)) found.push({ kind: 'clip', px: Math.max(cw, ch) });
    // 눌림: 화면 가운데로 끌어온 뒤 버튼 한가운데를 누르면 그 버튼(이나 그 안의 것)이 맞는지
    el.scrollIntoView({ block: 'center', inline: 'center' });
    const r = el.getBoundingClientRect();
    // 두 줄로 꺾인 링크는 상자 한가운데가 두 조각 사이 빈 곳이라, 줄 조각마다 가운데를 눌러 보고 하나라도 맞으면 눌리는 것으로 친다
    const pieces = [...el.getClientRects()].filter((q) => q.width > 0 && q.height > 0);
    const hits = (pieces.length ? pieces : [r]).map((q) => document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2));
    const ok = hits.some((h) => h && (h === el || el.contains(h)));
    const hit = hits[0];
    if (r.width > 0 && r.height > 0 && !ok) {
      const by = hit ? hit.tagName.toLowerCase() + (typeof hit.className === 'string' && hit.className.trim() ? '.' + hit.className.trim().split(/\s+/)[0] : '') : '화면 밖';
      found.push({ kind: 'blocked', by });
    }
    if (!found.length) continue;
    const cls = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    out.push({ el: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + cls, role: 'tap', wordBreak: '', textWrap: '', lines: [label.slice(0, 40)], found });
  }
  window.scrollTo(0, 0);
  return out;
}

// 글자 하나하나의 실제 위치(Range rect)로 줄을 되살린다. CSS 를 읽어 추측하지 않는다.
function measure(scopeSel) {
  const WORD = /[\uAC00-\uD7A3\u3131-\u318E0-9A-Za-z]/;
  const HANGUL = /[\uAC00-\uD7A3]/;
  const SPACE = /[\s\u200B\u00A0]/;
  const scope = document.querySelector(scopeSel) || document.body;
  const isInline = (el) => getComputedStyle(el).display.startsWith('inline') && getComputedStyle(el).display !== 'inline-block' && getComputedStyle(el).display !== 'inline-flex' && getComputedStyle(el).display !== 'inline-grid';
  const blockOf = (node) => { let el = node.parentElement; while (el && el !== scope && isInline(el)) el = el.parentElement; return el; };
  const visible = (el) => { const s = getComputedStyle(el); return s.visibility !== 'hidden' && s.display !== 'none' && el.getClientRects().length > 0; };

  // 글자가 든 블록을 모은다
  const blocks = new Map();
  const tw = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = tw.nextNode())) {
    if (!n.nodeValue.trim()) continue;
    const p = n.parentElement;
    if (!p || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|TEXTAREA|OPTION)$/.test(p.tagName)) continue;
    const b = blockOf(n);
    if (!b || !visible(b)) continue;
    if (!blocks.has(b)) blocks.set(b, []);
    blocks.get(b).push(n);
  }

  const roleOf = (el, cs) => {
    if (el.closest('pre,code,kbd,samp')) return 'code';
    const fs = parseFloat(cs.fontSize) || 16;
    const w = el.getBoundingClientRect().width;
    if (/^H[1-6]$/.test(el.tagName) || fs >= 22) return 'heading';
    if (/^(TD|TH)$/.test(el.tagName) && w / fs < 14) return 'narrow';
    if (w / fs < 8) return 'narrow';
    return 'body';
  };

  const out = [];
  let budget = 80000;
  for (const [el, nodes] of blocks) {
    const cs = getComputedStyle(el);
    // 글자 순서대로 [문자, 줄 top] 을 만든다. 줄바꿈 요소(br)나 사이에 낀 블록은 띄어쓰기로 친다
    const seqs = [];
    let prev = null;
    for (const node of nodes) {
      if (prev) {
        const r = document.createRange(); r.setStartAfter(prev); r.setEndBefore(node);
        const frag = r.cloneContents();
        if (frag.querySelector && frag.querySelector('br,div,p,li,img,svg')) seqs.push({ ch: ' ', top: null });
      }
      const s = node.nodeValue;
      for (let i = 0; i < s.length && budget > 0; i++, budget--) {
        if (SPACE.test(s[i])) { seqs.push({ ch: ' ', top: null }); continue; }
        const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + 1);
        const rect = r.getClientRects()[0];
        seqs.push({ ch: s[i], top: rect && rect.width > 0 ? rect.top : null, h: rect ? rect.height : 0 });
      }
      prev = node;
    }
    const chars = seqs.filter((c) => c.ch !== ' ' && c.top !== null);
    if (!chars.length || !chars.some((c) => HANGUL.test(c.ch))) continue;

    // 줄 번호 매기기
    let line = 0, lastTop = null;
    for (const c of seqs) {
      if (c.ch === ' ' || c.top === null) continue;
      if (lastTop !== null && Math.abs(c.top - lastTop) > Math.max(4, c.h * 0.5)) line++;
      c.line = line; lastTop = c.top;
    }
    const lines = [];
    for (const c of seqs) { if (c.line === undefined) { if (lines.length) lines[lines.length - 1] += ' '; continue; } (lines[c.line] ??= ''); lines[c.line] += c.ch; }
    const text = lines.map((l) => l.replace(/\s+/g, ' ').trim());

    const role = roleOf(el, cs);
    const found = [];
    // 쪼개짐: 서로 다른 줄에 놓인 이웃 글자 사이에 띄어쓰기가 없으면 어절이 갈린 것
    let a = null, gap = false;
    for (let i = 0; i < seqs.length; i++) {
      const c = seqs[i];
      if (c.ch === ' ' || c.line === undefined) { if (c.ch === ' ') gap = true; continue; }
      if (a && !gap && a.line !== c.line && WORD.test(a.ch) && WORD.test(c.ch) && (HANGUL.test(a.ch) || HANGUL.test(c.ch))) {
        // 쪼개진 어절 전체를 보여 준다
        let s = i - 1; while (s > 0 && seqs[s - 1].ch !== ' ') s--;
        let e = i; while (e < seqs.length - 1 && seqs[e + 1].ch !== ' ') e++;
        const left = seqs.slice(s, i).map((x) => x.ch).join('');
        const right = seqs.slice(i, e + 1).map((x) => x.ch).join('');
        found.push({ kind: 'split', word: `${left}/${right}` });
      }
      a = c; gap = false;
    }
    // 한 글자만 넘어간 마지막 줄
    if (text.length >= 2 && role !== 'narrow') {
      const last = text[text.length - 1].replace(/\s/g, '');
      if (last.length <= 2 && HANGUL.test(last)) found.push({ kind: 'orphan', word: last });
    }
    // 상자를 뚫음
    const ov = el.scrollWidth - el.clientWidth;
    // 가로 스크롤 상자 안이나 말줄임(…)은 일부러 그런 것이라 넘침으로 치지 않는다
    const scrolls = (() => { for (let x = el; x && x !== document.documentElement; x = x.parentElement) { const o = getComputedStyle(x).overflowX; if (o === 'auto' || o === 'scroll') return true; } return false; })();
    if (el.clientWidth > 0 && ov > 1 && !scrolls && cs.textOverflow !== 'ellipsis') found.push({ kind: 'overflow', px: ov });

    if (!found.length) continue;
    const id = el.id ? '#' + el.id : '';
    const cls = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    out.push({ el: el.tagName.toLowerCase() + id + cls, role, wordBreak: cs.wordBreak, textWrap: cs.textWrap || cs.textWrapMode || '', lines: text, found });
  }
  // 페이지 전체가 옆으로 밀리는지. nowrap·keep-all 을 넓게 주면 여기서 터진다
  const pageOver = document.documentElement.scrollWidth - window.innerWidth;
  if (pageOver > 1) out.push({ el: 'html', role: 'body', wordBreak: '', textWrap: '', lines: [], found: [{ kind: 'overflow', px: pageOver, page: true }] });
  return out;
}

const report = [];
for (const W of widths) for (const M of modes) {
  // 확대는 화면 전체가 커지는 것이라 실제 배치 폭(CSS px)이 W / 배율 로 줄어든다
  const cssW = M.kind === 'zoom' ? Math.round(W * 100 / M.pct) : W;
  await send('Emulation.setDeviceMetricsOverride', { width: cssW, height: M.kind === 'zoom' ? Math.round(900 * 100 / M.pct) : 900, deviceScaleFactor: 1, mobile: W < 700 });
  await send('Page.navigate', { url: target });
  await sleep(1200);
  await send('Runtime.evaluate', { expression: 'document.fonts ? document.fonts.ready.then(()=>1) : 1', awaitPromise: true });
  if (M.kind === 'text') await send('Runtime.evaluate', { expression: `(${scaleText})(${M.pct / 100})` });
  await sleep(300);
  const r = await send('Runtime.evaluate', { expression: `(${measure})(${JSON.stringify(SCOPE)})`, returnByValue: true });
  if (r.result.exceptionDetails) { console.error('페이지에서 셈이 실패했다:', r.result.exceptionDetails.text); process.exit(2); }
  const blocks = r.result.result.value;
  if (modes.length > 1) {
    const t = await send('Runtime.evaluate', { expression: `(${taps})(${JSON.stringify(SCOPE)})`, returnByValue: true });
    if (t.result.exceptionDetails) { console.error('버튼 셈이 실패했다:', t.result.exceptionDetails.text); process.exit(2); }
    const tapList = t.result.result.value;
    // 같은 버튼이 「넘침」과 「버튼 글자 잘림」으로 두 번 잡히면 버튼 쪽 하나만 남긴다
    const clipped = new Set(tapList.filter((x) => x.found.some((f) => f.kind === 'clip')).map((x) => x.el + '|' + x.lines[0]));
    for (const b of blocks) if (clipped.has(b.el + '|' + (b.lines.join(' ').replace(/\s+/g, ' ').trim().slice(0, 40)))) b.found = b.found.filter((f) => f.kind !== 'overflow');
    blocks.splice(0, blocks.length, ...blocks.filter((b) => b.found.length), ...tapList);
  }
  report.push({ width: W, mode: M.kind, pct: M.pct, cssWidth: cssW, blocks });
}
ws.close();

const count = (k) => report.reduce((s, w) => s + w.blocks.reduce((t, b) => t + b.found.filter((f) => f.kind === k).length, 0), 0);
const summary = { split: count('split'), orphan: count('orphan'), overflow: count('overflow'), clip: count('clip'), blocked: count('blocked') };
const bad = summary.split + summary.overflow + summary.clip + summary.blocked > 0;

if (JSON_OUT) {
  console.log(JSON.stringify({ target, widths, modes, summary, report }, null, 2));
} else {
  const ROLE = { heading: '제목', body: '본문', narrow: '좁은 칸', code: '코드·주소', tap: '버튼' };
  const MARK = { split: '✂ 쪼개짐', orphan: '· 외톨이', overflow: '⛔ 넘침', clip: '✂ 버튼 글자 잘림', blocked: '⛔ 안 눌림' };
  const MODE = (w) => w.mode === 'text' ? ` · 글자만 ${w.pct}%` : w.mode === 'zoom' ? ` · 확대 ${w.pct}% (배치 폭 ${w.cssWidth}px)` : '';
  for (const w of report) {
    console.log(`\n── ${w.width}px${MODE(w)} ${w.blocks.length ? '' : '  문제 없음'}`);
    for (const b of w.blocks) {
      const what = b.found.map((f) => f.kind === 'overflow' ? `${MARK.overflow} ${f.px}px${f.page ? ' (페이지가 옆으로 밀림)' : ''}` : f.kind === 'clip' ? `${MARK.clip} ${f.px}px` : f.kind === 'blocked' ? `${MARK.blocked} (가운데를 누르면 ${f.by})` : `${MARK[f.kind]} 「${f.word}」`).join('  ');
      console.log(`  ${ROLE[b.role]}  ${b.el}  (word-break:${b.wordBreak}${b.textWrap ? ' · text-wrap:' + b.textWrap : ''})`);
      console.log(`    ${what}`);
      b.lines.slice(0, 4).forEach((l, i) => console.log(`    ${String(i + 1).padStart(2)}│ ${l}`));
      if (b.lines.length > 4) console.log(`      … ${b.lines.length - 4}줄 더`);
    }
  }
  console.log(`\n합계  쪼개짐 ${summary.split} · 외톨이 ${summary.orphan} · 넘침 ${summary.overflow}${modes.length > 1 ? ` · 버튼 글자 잘림 ${summary.clip} · 안 눌림 ${summary.blocked}` : ''}`);
}
sweep();
// 파이프로 받을 때 출력이 64KB 에서 잘리지 않게, 다 써진 뒤에 끝낸다 (process.exit 를 바로 부르면 남은 출력이 버려진다)
process.stdout.write('', () => process.exit(bad ? 1 : 0));
