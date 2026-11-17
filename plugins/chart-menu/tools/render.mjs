// 차트 메뉴판 확인 시트 · 홍보 카드
// node plugins/chart-menu/tools/render.mjs <출력폴더> sheet|card [코스…]
//   sheet: 48개를 한 장(sheet.png, 2열)
//   card: 코스마다 1080×1350 한 장(card-<코스>.png): 질문 제목 + 여덟 칸 + 표 모양 칩 + 치는 문장
// 브라우저는 Chrome for Testing 만 쓴다(워크스페이스 §9.11).
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { setTimeout as sleep } from 'node:timers/promises';
import { K } from './gen.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const [, , outArg, mode = 'sheet', ...only] = process.argv;
if (!outArg) { console.error('출력 폴더를 주세요'); process.exit(1); }
const OUT = resolve(outArg); mkdirSync(OUT, { recursive: true });
const menu = JSON.parse(readFileSync(join(HERE, '..', 'menu.json'), 'utf8'));
const cats = menu.categories.filter(c => !only.length || only.includes(c.id));
const ACC = '#2a78d6';

const page = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#fff">
<canvas id="v" width="1080" height="1350"></canvas>
<script>${readFileSync(join(HERE, 'engine.js'), 'utf8')}</script>
<script>
var M=${JSON.stringify(menu)}, K=${JSON.stringify(K)}, cv=document.getElementById('v'), c=cv.getContext('2d');
var SANS='-apple-system,"Apple SD Gothic Neo",system-ui,sans-serif', MONO='"SF Mono",Menlo,monospace';
function T(s,x,y,font,col,al,maxw){c.font=font;c.fillStyle=col;c.textAlign=al||'left';c.textBaseline='alphabetic';if(maxw){while(c.measureText(s).width>maxw&&s.length>2)s=s.slice(0,-2)+'…';}c.fillText(s,x,y);}
function wrap(s,font,maxw){c.font=font;var out=[],line='';for(var i=0;i<s.length;i++){var t=line+s[i];if(c.measureText(t).width>maxw&&line){out.push(line);line=s[i];}else line=t;}if(line)out.push(line);return out;}
function cell(it,x,y,w,h,r){c.save();c.translate(x,y);c.beginPath();c.roundRect(0,0,w,h,r||14);c.clip();CH[it.id](c,w,h,K);c.restore();c.strokeStyle='#e1e0d9';c.lineWidth=1;c.beginPath();c.roundRect(x+.5,y+.5,w-1,h-1,r||14);c.stroke();}
window.card=function(cid){
  var cat=M.categories.filter(function(x){return x.id===cid;})[0], items=M.items.filter(function(i){return i.category===cid;}), INK='#0b0b0b', SUB='#52514e', MUTED='#898781';
  cv.width=1080;cv.height=1350;c.fillStyle='#fcfcfb';c.fillRect(0,0,1080,1350);
  T('Giting · 차트 메뉴판 '+cat.no,56,96,'700 22px '+MONO,'${ACC}');
  T('「'+cat.ko+'」',56,176,'800 60px '+SANS,INK); T('이 질문엔 이 차트',56,246,'800 60px '+SANS,'${ACC}');
  T(cat.sub+' · 표 모양부터 맞추고, 이름으로 시킨다',56,292,'500 22px '+SANS,SUB);
  var CW=476,CH0=184,GX=20,Y0=330,X0=56,RH=234;
  items.forEach(function(it,i){var x=X0+(i%2)*(CW+GX),y=Y0+Math.floor(i/2)*RH;cell(it,x,y,CW,CH0,12);
    T(String(M.items.indexOf(it)+1).padStart(2,'0'),x,y+CH0+26,'700 16px '+MONO,'${ACC}');T(it.name.ko,x+34,y+CH0+27,'800 20px '+SANS,INK);c.font='800 20px '+SANS;var kw=c.measureText(it.name.ko).width;T(it.name.en,x+34+kw+8,y+CH0+27,'600 13px '+SANS,MUTED);
    T('표 모양 · '+it.shape,x,y+CH0+46,'500 13px '+SANS,SUB,'left',CW);});
  T('GITING',56,1312,'800 22px '+MONO,INK); T('48개 전부 · 질문 · 표 모양 · 치는 문장 · 실물 · giting.kr/skills/chart-menu',1024,1312,'500 18px '+SANS,SUB,'right');
};
window.sheet=function(){var n=M.items.length,rows=Math.ceil(n/2);cv.width=1080;cv.height=rows*230+40;c.fillStyle='#f1f1ee';c.fillRect(0,0,cv.width,cv.height);
  M.items.forEach(function(it,i){var x=20+(i%2)*530,y=20+Math.floor(i/2)*230;cell(it,x,y,500,190,10);T(String(i+1).padStart(2,'0')+' '+it.id+' · '+it.name.ko,x,y+212,'600 14px '+MONO,'#333');});};
</script>`;
const PAGE = join(OUT, 'render-page.html'); writeFileSync(PAGE, page);
const CHROME = process.env.CHROME || join(homedir(), 'Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const PORT = 9700 + (process.pid % 200), PROFILE = join(OUT, '.chrome');
const proc = spawn(CHROME, ['--headless=new', '--no-sandbox', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, 'about:blank'], { stdio: 'ignore' });
const done = () => { try { proc.kill('SIGKILL'); } catch {} }; process.on('exit', done);
let tg = null; for (let i = 0; i < 60 && !tg; i++) { try { tg = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(x => x.type === 'page'); } catch {} if (!tg) await sleep(250); }
if (!tg) { console.error('크롬이 안 떴다'); process.exit(1); }
const ws = new WebSocket(tg.webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map(), errs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') errs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); };
const send = (m, p = {}) => new Promise(r => { const n = ++id; pend.set(n, r); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const ev = async x => { const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description); return r.result.result.value; };
await send('Runtime.enable'); await send('Page.enable'); await send('Page.navigate', { url: 'file://' + PAGE }); await sleep(600);
for (let i = 0; i < 40; i++) { let ok = false; try { ok = await ev("typeof card==='function' && typeof CH==='object' && document.readyState==='complete'"); } catch {} if (ok) break; await sleep(250); }
const png = async name => writeFileSync(name, Buffer.from((await ev(`document.getElementById('v').toDataURL('image/png')`)).split(',')[1], 'base64'));
if (mode === 'sheet') { await ev('sheet()'); await png(join(OUT, 'sheet.png')); console.log('sheet', join(OUT, 'sheet.png')); }
else { for (const cat of cats) { await ev(`card(${JSON.stringify(cat.id)})`); await png(join(OUT, `card-${cat.id}.png`)); console.log('card', cat.id); } }
console.log('errors:', errs.length ? errs : 'none');
ws.close(); done(); await sleep(400); rmSync(PROFILE, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); process.exit(0);
