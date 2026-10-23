// ui-menu 검수 기록기 (의존성 0) — components/<id>.html 을 헤드리스 크롬으로 열어 세 가지를 재고 verify.json 에 날짜와 함께 남긴다.
//   render   : 열었을 때 예외·console.error 0
//   interact : 버튼·요약·라벨·체크박스를 다 누르고 입력칸에 글을 쳐도 예외 0
//   phone    : 폭 390 에서 페이지가 옆으로 넘치지 않음
//   device   : 실기기는 이 도구가 못 잰다 → 늘 not_run (사람이 보고 손으로 고친다)
// 쓰는 법: node plugins/ui-menu/tools/verify.mjs [id ...]   (id 를 주면 그것만 다시 잰다)
// ⚠️ 폰 폭은 innerWidth 와 비교하면 안 된다 — mobile 에뮬레이션은 넘친 만큼 축소해 innerWidth 도 같이 커진다(일부러 넘친 견본으로 확인).
// 결과는 passed / failed / not_run 세 낱말만 쓴다. 상태(검증·부분·옛 자료)는 build.mjs 가 날짜로 계산한다.
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const PLUGIN = join(dirname(fileURLToPath(import.meta.url)), '..');
const menu = JSON.parse(readFileSync(join(PLUGIN, 'menu.json'), 'utf8'));
const OUT = join(PLUGIN, 'verify.json');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const only = process.argv.slice(2);
const ids = menu.items.map(i => i.id).filter(id => !only.length || only.includes(id));
const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });

const prof = mkdtempSync(join(tmpdir(), 'uim-verify-'));
const PORT = 9300 + Math.floor(Math.random() * 400);
const proc = spawn(CHROME, ['--headless', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
let tg; for (let i = 0; i < 80 && !tg; i++) { try { tg = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(x => x.type === 'page'); } catch {} if (!tg) await sleep(250); }
if (!tg) { console.error('크롬을 못 띄웠다:', CHROME); process.exit(1); }
const ws = new WebSocket(tg.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let n = 0, errs = []; const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errs.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text || '').split('\n')[0].slice(0, 160));
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push('console.error ' + JSON.stringify(m.params.args.map(a => a.value ?? a.description)).slice(0, 160)); };
const send = (method, params = {}) => new Promise(r => { const k = ++n; pend.set(k, r); ws.send(JSON.stringify({ id: k, method, params })); });
const ev = async x => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result.result?.value;
const view = (w, h, mobile) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
const open = async url => { await send('Page.navigate', { url }); await sleep(500); };
await send('Runtime.enable'); await send('Page.enable');

const INTERACT = `(async () => {
  const w = ms => new Promise(r => setTimeout(r, ms));
  for (const el of [...document.querySelectorAll('button, summary, label, [role=tab], [role=button], input[type=checkbox], input[type=radio]')]) { try { el.click(); } catch (e) {} await w(120); }
  for (const el of [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]), textarea')]) {
    el.focus(); el.value = el.type === 'email' ? 'name@example.com' : el.type === 'number' ? '3' : '가나다 abc';
    el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); el.blur(); await w(80); }
  for (const el of [...document.querySelectorAll('input[type=range]')]) { el.value = el.max || 100; el.dispatchEvent(new Event('input', { bubbles: true })); }
  for (const el of [...document.querySelectorAll('select')]) { if (el.options.length > 1) { el.selectedIndex = 1; el.dispatchEvent(new Event('change', { bubbles: true })); } }
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await w(900);
})()`;

const rec = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
delete rec._doc;
let bad = 0;
for (const id of ids) {
  const url = 'file://' + join(PLUGIN, 'components', id + '.html');
  const r = { checked: today, render: 'passed', interact: 'passed', phone: 'passed', device: 'not_run' }, note = [];
  await view(1024, 720, false); errs = []; await open(url); await sleep(700);
  if (errs.length) { r.render = 'failed'; note.push('열 때 ' + errs[0]); }
  errs = []; await ev(INTERACT);
  if (errs.length) { r.interact = 'failed'; note.push('누를 때 ' + errs[0]); }
  await view(390, 760, true); errs = []; await open(url); await sleep(700);
  const ov = await ev('Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - 390');
  if (ov > 1) { r.phone = 'failed'; note.push(`폭 390 에서 ${ov}px 넘침`); }
  if (note.length) { r.note = note.join(' · '); bad++; }
  rec[id] = r;
  process.stdout.write(note.length ? `\n✕ ${id}: ${r.note}\n` : '.');
}
ws.close(); proc.kill('SIGKILL'); await sleep(300); rmSync(prof, { recursive: true, force: true });

const sorted = { _doc: 'tools/verify.mjs 가 쓴다. 손으로 고치는 것은 device(실기기) 칸뿐 — passed 로 바꿀 때 checked 도 그날로. 상태·다시 볼 날은 build.mjs 가 계산한다.' };
for (const it of menu.items) if (rec[it.id]) sorted[it.id] = rec[it.id];
writeFileSync(OUT, JSON.stringify(sorted, null, 1) + '\n');
console.log(`\n${ids.length}개 잼 · 통과 ${ids.length - bad} · 걸림 ${bad} → ${OUT}`);
