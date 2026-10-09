#!/usr/bin/env node
// 사이트에서 디자인 토큰 재기. 좋아하는 사이트를 실제 브라우저로 띄워 색 · 글꼴 · 글자 단계 · 둥글기 · 간격 · 그림자를
// 화면에 그려진 값으로 재고, 역할(바탕 · 면 · 글자 · 흐린 글자 · 강조 · 선)을 붙여 DESIGN.md 초안을 낸다.
//
//   node site_tokens.mjs <url> [--width 1440] [--json] [--out DESIGN.md]
//
// CSS 파일을 읽어 추측하지 않는다. 그려진 요소의 계산된 스타일을 글자 양 · 면적으로 가중해 센다.
// 로고 · 이름 · 이미지는 담지 않는다. 결만 빌리고 그대로 베끼지 않게, 출처는 머리말에 한 줄만 남긴다.
// 의존성 없음. Node 22 이상(내장 WebSocket)과 크롬 계열 브라우저 하나.
//
// 끝 코드: 0 = 냄 · 2 = 실행 못 함
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const argv = process.argv.slice(2);
if (!argv.length || argv[0] === '-h' || argv[0] === '--help') {
  console.log(`사이트에서 디자인 토큰 재기

  node site_tokens.mjs <url> [--width 1440] [--json] [--out DESIGN.md] [--shot shot.png] [--dark]

  --width  재는 화면 폭 (기본 1440)
  --json   잰 값을 JSON 으로
  --out    DESIGN.md 초안을 파일로 (없으면 화면에)
  --shot   첫 화면 캡처를 저장 (강조색을 못 재면 extract_palette.py 에 넣는다)
  --dark   어두운 모드로 잰다`);
  process.exit(0);
}
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const URL_IN = argv[0];
if (!/^https?:\/\//.test(URL_IN)) { console.error('http(s) 주소를 준다'); process.exit(2); }
const WIDTH = Number(opt('width', 1440));
const JSON_OUT = argv.includes('--json');
const OUT = opt('out', '');
const SHOT = opt('shot', '');

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

const PROFILE = mkdtempSync(join(tmpdir(), 'site-tokens-'));
const PORT = 9500 + Math.floor(Math.random() * 400);
const proc = spawn(CHROME, ['--headless', '--disable-gpu', '--no-sandbox', '--disk-cache-size=1', '--hide-scrollbars',
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
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
  return r.result.result.value;
};

await send('Page.enable'); await send('Runtime.enable');
// 사이트가 밝기 설정을 따르면 밝은 쪽을 잰다. 어두운 쪽은 --dark 로
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: argv.includes('--dark') ? 'dark' : 'light' }] });
await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: 900, deviceScaleFactor: 1, mobile: WIDTH < 700 });
await send('Page.navigate', { url: URL_IN });
await sleep(2500);
// 늦게 뜨는 칸(지연 로딩)을 깨우려고 세 화면 아래까지 내렸다가 올린다
await evaluate(`(async()=>{for(let y=0;y<innerHeight*3;y+=innerHeight/2){scrollTo(0,y);await new Promise(r=>setTimeout(r,250))}scrollTo(0,0);await new Promise(r=>setTimeout(r,600));if(document.fonts)await document.fonts.ready;return 1})()`);

// ── 페이지 안에서 도는 셈 ─────────────────────────────
function measure() {
  const LIMIT = innerHeight * 4; // 첫 네 화면만. 끝없이 이어지는 피드에 끌려가지 않게
  const rgba = (s) => { const m = s && s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
  const add = (o, k, w) => { if (k == null || !(w > 0)) return; o[k] = (o[k] || 0) + w; };
  const T = {}, BG = {}, ACC = {}, LINE = {}, FAM = {}, DISP = {}, MONO = {}, SIZE = {}, RBTN = {}, RCARD = {}, SHADOW = {}, PADB = {}, GAPS = {};
  const vis = (_e, s) => s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05;
  const sat = (c) => { const mx = Math.max(c.r, c.g, c.b) / 255, mn = Math.min(c.r, c.g, c.b) / 255, l = (mx + mn) / 2; const d = mx - mn; return { s: d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)), l }; };
  const interactive = (e) => e.matches('a,button,[role=button],input[type=submit],input[type=button],summary');
  const pageBg = (() => { for (const e of [document.body, document.documentElement]) { const c = rgba(getComputedStyle(e).backgroundColor); if (c && c.a > 0.5) return hex(c); } return '#FFFFFF'; })();
  add(BG, pageBg, 400);

  for (const e of document.querySelectorAll('body *')) {
    if (e.closest('svg,iframe,canvas,video,picture,noscript')) continue;
    const b = e.getBoundingClientRect();
    if (b.width < 2 || b.height < 2 || b.top + scrollY > LIMIT) continue;
    const s = getComputedStyle(e);
    if (!vis(e, s)) continue;
    const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('');
    const chars = own.length;
    const fs = parseFloat(s.fontSize) || 16;
    if (chars) {
      const c = rgba(s.color);
      if (c && c.a > 0.4) {
        add(T, hex(c), chars);
        const { s: sa, l } = sat(c);
        if (sa > 0.35 && l > 0.2 && l < 0.85) add(ACC, hex(c), chars * (interactive(e) ? 3 : 0.5));
      }
      const fam = s.fontFamily.split(',')[0].replace(/["']/g, '').trim();
      if (/mono|code|consol|courier|menlo|jetbrains|fira code|sf mono/i.test(s.fontFamily)) add(MONO, fam, chars);
      else if (fs >= 28) add(DISP, fam, chars);
      else add(FAM, fam, chars);
      add(SIZE, `${Math.round(fs)}|${s.fontWeight}|${s.lineHeight === 'normal' ? 'normal' : (parseFloat(s.lineHeight) / fs).toFixed(2)}`, chars);
    }
    const bg = rgba(s.backgroundColor);
    const area = Math.min(b.width * b.height, innerWidth * innerHeight) / 1000;
    if (bg && bg.a > 0.5) {
      add(BG, hex(bg), area);
      const { s: sa, l } = sat(bg);
      if (sa > 0.35 && l > 0.2 && l < 0.85) add(ACC, hex(bg), interactive(e) ? 400 : Math.min(area, 40));
      if (interactive(e) && b.height < 80) add(PADB, `${Math.round(parseFloat(s.paddingTop))}/${Math.round(parseFloat(s.paddingLeft))}`, 1);
    }
    const bw = parseFloat(s.borderTopWidth) || parseFloat(s.borderBottomWidth) || 0;
    if (bw > 0 && bw <= 2) {
      const bc = rgba(s.borderTopWidth !== '0px' ? s.borderTopColor : s.borderBottomColor);
      if (bc && bc.a > 0.2) {
        add(LINE, hex(bc), 1);
      }
    }
    // 둥글기는 「상자로 보이는 것」만 센다: 바탕이 칠해졌거나 · 테두리 · 그림자 · 안의 그림을 둥글게 자르는 것.
    // 화면 폭을 꽉 채우는 구획은 모양이 아니라 띠라서 뺀다(넣으면 0 이 이긴다)
    if (b.width < innerWidth * 0.9) {
      const r = parseFloat(s.borderTopLeftRadius) || 0;
      const boxed = (bg && bg.a > 0.5 && bg.r + bg.g + bg.b !== -1) || bw > 0 || (s.boxShadow && s.boxShadow !== 'none') || (r > 0 && s.overflow !== 'visible');
      if (boxed) {
        const rr = r > 0 && r >= Math.min(b.height, b.width) / 2 - 1 ? 'pill' : `${Math.round(r)}`;
        if (b.height < 64 && (interactive(e) || (bg && bg.a > 0.5))) add(RBTN, rr, interactive(e) ? 2 : 1);
        else if (b.width > 120 && b.height > 80) add(RCARD, rr, 1);
      }
    }
    if (s.boxShadow && s.boxShadow !== 'none') add(SHADOW, s.boxShadow.replace(/\s+/g, ' ').slice(0, 120), 1);
    for (const g of [s.rowGap, s.columnGap]) { const v = parseFloat(g); if (v >= 4 && v < 200) add(GAPS, Math.round(v), 1); }
    for (const p of [s.paddingTop, s.paddingLeft]) { const v = parseFloat(p); if (v >= 4 && v < 200) add(GAPS, Math.round(v), 0.5); }
  }
  return { pageBg, T, BG, ACC, LINE, FAM, DISP, MONO, SIZE, RBTN, RCARD, SHADOW, PADB, GAPS, title: document.title };
}

let raw;
try { raw = await evaluate(`(${measure})()`); } catch (e) { console.error('페이지에서 셈이 실패했다:', e.message); process.exit(2); }
if (SHOT) {
  const { data } = (await send('Page.captureScreenshot', { format: 'png' })).result;
  writeFileSync(SHOT, Buffer.from(data, 'base64'));
}
ws.close();

// ── 셈 정리: 비슷한 색을 묶고, 역할을 붙인다 ─────────────────
const rgbOf = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const dist = (a, b) => { const x = rgbOf(a), y = rgbOf(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
const lum = (h) => { const [r, g, b] = rgbOf(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function cluster(o, tol = 14) {
  const items = Object.entries(o).sort((a, b) => b[1] - a[1]);
  const out = [];
  for (const [k, w] of items) {
    const hit = out.find((c) => dist(c.hex, k) < tol);
    if (hit) hit.w += w; else out.push({ hex: k, w });
  }
  const total = out.reduce((s, c) => s + c.w, 0) || 1;
  return out.map((c) => ({ hex: c.hex, share: c.w / total }));
}
const top = (o, n = 5) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);

const bgs = cluster(raw.BG);
const ground = raw.pageBg && bgs.find((c) => dist(c.hex, raw.pageBg) < 14) ? bgs.find((c) => dist(c.hex, raw.pageBg) < 14).hex : bgs[0]?.hex;
const surface = bgs.find((c) => dist(c.hex, ground) >= 6 && dist(c.hex, ground) < 60 && c.share > 0.02)?.hex || null;
const texts = cluster(raw.T, 10);
// ink = 자주 쓴 글자색(글자 양 5% 이상) 가운데 바탕과 대비가 가장 큰 것. 가장 많이 쓴 색이 흐린 회색인 사이트가 있다
const common = texts.filter((c) => c.share >= 0.05);
const ink = [...(common.length ? common : texts)].sort((a, b) => contrast(b.hex, ground) - contrast(a.hex, ground))[0]?.hex;
// muted = 나머지 가운데 가장 많이 쓴, 읽을 만한(대비 2.5 이상) 흐린 색
const muted = texts.find((c) => c.hex !== ink && dist(c.hex, ink) > 20 && contrast(c.hex, ground) >= 2.5 && contrast(c.hex, ground) < contrast(ink, ground) && c.share > 0.03)?.hex || null;
const accents = cluster(raw.ACC, 24);
const accent = accents[0]?.hex || null;
const accent2 = accents.find((c) => accent && dist(c.hex, accent) > 80 && c.share > 0.12)?.hex || null;
const lines = cluster(raw.LINE, 10);
const line = lines.find((c) => dist(c.hex, ground) > 6)?.hex || null;
const dark = lum(ground) < 0.2;

const fam = top(raw.FAM, 2).map(([k]) => k);
const disp = top(raw.DISP, 1).map(([k]) => k)[0] || fam[0];
const mono = top(raw.MONO, 1).map(([k]) => k)[0] || null;
const sizes = {};
for (const [k, w] of Object.entries(raw.SIZE)) { const [px, wt, lh] = k.split('|'); const s = sizes[px] ||= { px: +px, w: 0, weights: {}, lh: {} }; s.w += w; s.weights[wt] = (s.weights[wt] || 0) + w; s.lh[lh] = (s.lh[lh] || 0) + w; }
const total = Object.values(sizes).reduce((a, s) => a + s.w, 0) || 1;
// 글자 양 2% 미만인 크기는 잡음(위젯 · 배지)으로 본다. 큰 제목은 양이 적어도 남긴다
const scale = Object.values(sizes).filter((s) => s.w / total >= 0.02 || s.px >= 28).sort((a, b) => b.px - a.px).slice(0, 7)
  .map((s) => ({ px: s.px, weight: top(s.weights, 1)[0][0], lineHeight: top(s.lh, 1)[0][0], share: s.w / total }));
const body = [...scale].filter((s) => s.px < 24).sort((a, b) => b.share - a.share)[0];

const pick = (o) => { const t = top(o, 1)[0]; return t ? t[0] : null; };
const rBtn = pick(raw.RBTN);
const rCard = pick(raw.RCARD);
const gapVals = Object.entries(raw.GAPS).map(([k, w]) => [+k, w]);
const gapW = gapVals.reduce((s, [, w]) => s + w, 0) || 1;
const on = (u) => gapVals.filter(([v]) => v % u === 0).reduce((s, [, w]) => s + w, 0) / gapW;
const unit = on(8) >= 0.6 ? 8 : on(4) >= 0.6 ? 4 : null;
const steps = top(raw.GAPS, 8).map(([k]) => +k).sort((a, b) => a - b);
const shadows = top(raw.SHADOW, 2).map(([k]) => k);
const btnPad = pick(raw.PADB);

const host = new URL(URL_IN).host;
const today = new Date().toISOString().slice(0, 10);
const tokens = { source: URL_IN, measuredAt: today, width: WIDTH, mode: dark ? 'dark' : 'light',
  palette: { ground, surface, ink, muted, accent, accent2, line },
  type: { body: fam[0] || null, display: disp || null, mono, scale, bodySize: body?.px || null },
  shape: { buttonRadius: rBtn, cardRadius: rCard, buttonPadding: btnPad },
  space: { unit, steps }, shadow: shadows };

if (JSON_OUT) { console.log(JSON.stringify(tokens, null, 2)); sweep(); process.exit(0); }

const r = (v) => v == null ? '(못 잼)' : v === 'pill' ? '알약(높이의 절반)' : `${v}px`;
const c = (v) => v || '(못 잼)';
const cr = (fg) => fg && ground ? ` · 바탕 대비 ${contrast(fg, ground).toFixed(1)}:1` : '';
const md = `# DESIGN.md (초안)

> 출처: 실측 ${today}, 폭 ${WIDTH}px, ${dark ? '어두운' : '밝은'} 화면. 화면에 그려진 값을 재서 만든 **출발점**이다.
> 로고 · 이름 · 이미지는 담지 않았다. 그대로 베끼지 말고, 아래 「방향」을 내 제품에 맞게 정한 뒤 값을 고쳐 쓴다.
> (재 본 곳: ${host})

## 방향 (정할 것)

- 한두 문장으로 이름을 붙인다. 예: "Swiss typographic, 강조색 하나, 넉넉한 여백"
- 이 제품이 **아닌 것**도 한 줄로 적는다.

## 팔레트 (측정)

| 역할 | 값 | 비고 |
|---|---|---|
| ground (바탕) | ${c(ground)} | 페이지 바탕 |
| surface (면) | ${c(surface)} | 카드 · 구획 바탕 |
| ink (글자) | ${c(ink)} | 본문 글자${cr(ink)} |
| muted (흐린 글자) | ${c(muted)} | 보조 글자${cr(muted)} |
| accent (강조) | ${accent || '(못 잼: 그림·로고에만 있을 수 있다. `--shot` 캡처를 extract_palette.py 로)'} | 링크 · 버튼에서 가장 많이 쓴 채도 높은 색${accent2 ? `. 두 번째 강조 ${accent2}` : ''} |
| line (선) | ${c(line)} | 1~2px 테두리 |

의미 색(성공 · 경고 · 위험)은 재지 않았다. 강조색과 따로 정한다.

## 글자 (측정)

- 본문: ${c(fam[0])}${fam[1] ? ` (다음으로 많음: ${fam[1]})` : ''}
- 큰 제목: ${c(disp)}
- 고정폭: ${mono || '(쓰지 않음)'}

| 크기 | 굵기 | 줄 간격 | 글자 양 |
|---|---|---|---|
${scale.map((s) => `| ${s.px}px${body && s.px === body.px ? ' (본문)' : ''} | ${s.weight} | ${s.lineHeight} | ${(s.share * 100).toFixed(0)}% |`).join('\n')}

## 모양과 간격 (측정)

- 버튼 둥글기: ${r(rBtn)} · 버튼 안쪽 여백(세로/가로): ${btnPad ? btnPad.replace('/', 'px / ') + 'px' : '(못 잼)'}
- 카드 둥글기: ${r(rCard)}
- 간격 단위: ${unit ? `${unit}px (자주 쓴 간격의 대부분이 ${unit} 의 배수)` : '(일정한 단위가 안 보임)'}
- 자주 쓴 간격: ${steps.length ? steps.map((v) => v + 'px').join(' · ') : '(못 잼)'}
- 그림자: ${shadows.length ? shadows.map((s) => '`' + s + '`').join(' · ') : '없음'}

## 컴포넌트 · 말투 · 하지 않을 것 (정할 것)

재서 나오지 않는 것들이다. design-brief 의 절차대로 채운다.
`;

if (OUT) { writeFileSync(OUT, md); console.log(`초안 → ${OUT}`); } else console.log(md);
sweep();
process.exit(0);
