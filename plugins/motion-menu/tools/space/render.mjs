// 3D 공간 48 홍보 영상: 묶음마다 1080×1920 영상 하나 (8개씩 6편, 8초, 끝과 처음이 이어진다)
// node plugins/motion-menu/tools/space/render.mjs <출력폴더> [video|sheet|covers] [묶음…]
//   sheet: 48개를 1 · 3 · 5 · 7초에서 멈춘 확인용 한 장(sheet.png)
//   covers: 묶음마다 3초 지점 한 장(still-<묶음>.png)
//   still <id> <초>: 장면 하나를 1080×540 으로 한 장(one-<id>-<초>.png) · 고칠 때 본다
//   video: 프레임을 PNG 로 떠서 FFMPEG(환경변수, 기본 ffmpeg)로 mp4 를 굽는다. 무음
// 그리는 함수는 engine.js 그대로다. 갤러리 데모와 영상이 같은 함수에서 나온다.
// 브라우저는 Chrome for Testing 만 쓴다(시스템 크롬 headless 는 오너 크롬의 링크를 가로챈다 · 워크스페이스 §9.11).
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { setTimeout as sleep } from 'node:timers/promises';
import { PALETTE, mix } from './gen.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const [, , outArg, mode = 'video', ...only] = process.argv;
if (!outArg) { console.error('출력 폴더를 주세요'); process.exit(1); }
const OUT = resolve(outArg); mkdirSync(OUT, { recursive: true });
const menu = JSON.parse(readFileSync(join(HERE, '..', '..', 'menu.json'), 'utf8'));
const items = menu.items.filter(i => i.category === 'space-3d');
const groups = Object.keys(PALETTE).filter(g => items.some(i => i.group === g) && (!only.length || mode === 'still' || only.includes(g)));
const FPS = 30, SECS = 8;

const data = Object.fromEntries(groups.map(g => [g, {
  acc: PALETTE[g].acc, deep: mix(PALETTE[g].acc, '#14161B', .55), label: PALETTE[g].label,
  items: items.filter(i => i.group === g).map(i => ({ id: i.id, no: items.indexOf(i) + 1, ko: i.name.ko, en: i.name.en, say: i.aliases[0], ask: i.ask, one: i.oneliner })),
}]));

const page = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#000">
<canvas id="v" width="1080" height="1920"></canvas>
<script>${readFileSync(join(HERE, 'engine.js'), 'utf8')}</script>
<script>
var D=${JSON.stringify(data)}, cv=document.getElementById('v'), c=cv.getContext('2d');
var SANS='-apple-system,"Apple SD Gothic Neo",system-ui,sans-serif', MONO='"SF Mono",Menlo,monospace';
function txt(s,x,y,font,col,al){c.font=font;c.fillStyle=col;c.textAlign=al||'left';c.textBaseline='alphabetic';c.fillText(s,x,y);}
function pill(s,x,y,font,bg,fg,padX,hh,right){c.font=font;var tw=c.measureText(s).width,w=tw+padX*2,x0=right?x-w:x;c.fillStyle=bg;c.beginPath();c.roundRect(x0,y,w,hh,hh/2);c.fill();c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.fillText(s,x0+w/2,y+hh/2+1);}
function cell(it,x,y,w,h,t,G,r){
  var K={acc:G.acc,deep:G.deep,paper:'#F4F1EA',ink:'#14161B'};
  c.save();c.translate(x,y);c.beginPath();c.roundRect(0,0,w,h,r||18);c.clip();
  SP[it.id](c,w,h,t,K);
  c.restore();
}
var GROUPS=Object.keys(D);
// 세로 한 편: 먹 바탕 · 제목(묶음 색 한 단어) · 2열×4줄 여덟 칸 · 칸 아래 번호 · 이름 · 영어 · 하던 말
window.draw=function(g,t){
  var G=D[g],INK='#F4F1EA',SUB='#9A9DA5',BG='#0E0F12';
  c.fillStyle=BG;c.fillRect(0,0,1080,1920);
  txt('3D 공간 메뉴판 · '+(GROUPS.indexOf(g)+1)+' / '+GROUPS.length,56,150,'700 24px '+MONO,G.acc);
  txt('AI 한테 치는 문장으로',56,236,'800 66px '+SANS,INK);
  c.font='800 66px '+SANS;var lw=c.measureText(G.label).width;
  txt(G.label,56,316,'800 66px '+SANS,G.acc);
  var CW=476,CH=244,GX=20,GY=26,Y0=372,X0=56;
  G.items.forEach(function(it,i){
    var x=X0+(i%2)*(CW+GX),y=Y0+Math.floor(i/2)*(CH+GY+70);
    cell(it,x,y,CW,CH,t,G,16);
    txt(String(it.no).padStart(2,'0'),x,y+CH+40,'700 24px '+MONO,G.acc);
    txt(it.ko,x+46,y+CH+42,'800 30px '+SANS,INK);
    c.font='800 30px '+SANS;var kw=c.measureText(it.ko).width;
    txt(it.en,x+46+kw+12,y+CH+42,'600 20px '+SANS,SUB);
    txt(it.say,x,y+CH+74,'500 21px '+SANS,SUB);
  });
  txt('GITING',56,1836,'800 26px '+MONO,INK);
  txt('48개 전부 · 치는 문장 · 실물 데모 · giting.kr/skills/motion-menu',1024,1836,'500 22px '+SANS,SUB,'right');
};
window.one=function(id,t){cv.width=1080;cv.height=540;var G=null;GROUPS.forEach(function(g){D[g].items.forEach(function(it){if(it.id===id)G=D[g];});});if(!G)throw new Error('no group for '+id+' · groups='+GROUPS.join(',')+' · n='+GROUPS.map(function(g){return D[g].items.length;}).join(','));c.fillStyle='#111318';c.fillRect(0,0,1080,540);cell({id:id},0,0,1080,540,t,G,0);};
window.sheet=function(){
  var n=0;GROUPS.forEach(function(g){n+=D[g].items.length;});
  cv.width=1080;cv.height=n*120+40;c.fillStyle='#111318';c.fillRect(0,0,cv.width,cv.height);
  var k=0;GROUPS.forEach(function(g){var G=D[g];G.items.forEach(function(it){
    var y=20+k*120;txt(String(it.no).padStart(2,'0')+' '+it.id,20,y+60,'600 18px '+MONO,'#ccc');
    [1,3,5,7].forEach(function(t,j){cell(it,250+j*207,y,197,100,t,G,12);});k++;});});
};
</script>`;
const PAGE = join(OUT, 'render-page.html'); writeFileSync(PAGE, page);

const CHROME = process.env.CHROME || join(homedir(), 'Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const PORT = 9600 + (process.pid % 200), PROFILE = join(OUT, '.chrome');
const proc = spawn(CHROME, ['--headless=new', '--no-sandbox', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, 'about:blank'], { stdio: 'ignore' });
const done = () => { try { proc.kill('SIGKILL'); } catch {} };
process.on('exit', done);
let tg = null; for (let i = 0; i < 60 && !tg; i++) { try { tg = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(x => x.type === 'page'); } catch {} if (!tg) await sleep(250); }
if (!tg) { console.error('크롬이 안 떴다'); process.exit(1); }
const ws = new WebSocket(tg.webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map(), errs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') errs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); };
const send = (m, p = {}) => new Promise(r => { const n = ++id; pend.set(n, r); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const ev = async x => { const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description); return r.result.result.value; };
await send('Runtime.enable'); await send('Page.enable');
await send('Page.navigate', { url: 'file://' + PAGE }); await sleep(800);
for (let i = 0; i < 40; i++) { let ok = false; try { ok = await ev("typeof draw==='function' && typeof SP==='object' && document.readyState==='complete'"); } catch {} if (ok) break; await sleep(250); }
const png = async name => writeFileSync(name, Buffer.from((await ev(`document.getElementById('v').toDataURL('image/png')`)).split(',')[1], 'base64'));

if (mode === 'still') { const [sid, st = '3'] = only; await ev(`one(${JSON.stringify(sid)}, ${Number(st)})`); await png(join(OUT, `one-${sid}-${st}.png`)); console.log('still', sid, st); }
else if (mode === 'covers') { for (const g of groups) { await ev(`draw(${JSON.stringify(g)}, 3)`); await png(join(OUT, `still-${g}.png`)); } console.log('covers', groups.join(' ')); }
else if (mode === 'sheet') { await ev('sheet()'); await png(join(OUT, 'sheet.png')); console.log('sheet', join(OUT, 'sheet.png')); }
else {
  const FF = process.env.FFMPEG || 'ffmpeg';
  for (const g of groups) {
    const dir = join(OUT, 'frames-' + g); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir);
    for (let f = 0; f < FPS * SECS; f++) { await ev(`draw(${JSON.stringify(g)}, ${f / FPS})`); await png(join(dir, String(f).padStart(4, '0') + '.png')); }
    await ev(`draw(${JSON.stringify(g)}, 3)`); await png(join(OUT, `cover-${g}.png`));
    const name = `${String(Object.keys(PALETTE).indexOf(g) + 1).padStart(2, '0')}-${g.toLowerCase()}.mp4`;
    const r = spawnSync(FF, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(dir, '%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', join(OUT, name)]);
    if (r.status) { console.error(r.stderr.toString()); process.exit(1); }
    rmSync(dir, { recursive: true, force: true });
    console.log('video', name);
  }
}
console.log('errors:', errs.length ? errs : 'none');
ws.close(); done(); await sleep(500); rmSync(PROFILE, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); process.exit(0);
