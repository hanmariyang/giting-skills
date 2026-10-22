// 오프닝 타이틀 홍보 영상: 묶음마다 1080×1920 영상 하나 (6개씩 4편, 8초, 끝과 처음이 이어진다)
// node plugins/motion-menu/tools/opening/render.mjs <출력폴더> [video|sheet|covers|grid] [묶음…]
//   grid: 스레드용 1080×1350 한 편(8칸씩 3장, 15초, opening-grid.mp4)
//   covers: 묶음마다 1.1초 지점 한 장(still-<묶음>.png): 레이아웃 확인용
//   sheet: 24개를 1 · 2.5 · 4 · 6초에서 멈춘 확인용 한 장(sheet.png)
//   video: 프레임을 PNG 로 떠서 FFMPEG(환경변수, 기본 ffmpeg)로 mp4 를 굽는다. 무음
// 그리는 함수는 engine.js 그대로다. 갤러리 데모와 영상이 같은 함수에서 나온다.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import { PALETTE, mix } from './gen.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const [, , outArg, mode = 'video', ...only] = process.argv;
if (!outArg) { console.error('출력 폴더를 주세요'); process.exit(1); }
const OUT = resolve(outArg); mkdirSync(OUT, { recursive: true });
const menu = JSON.parse(readFileSync(join(HERE, '..', '..', 'menu.json'), 'utf8'));
const items = menu.items.filter(i => i.category === 'opening-title');
const groups = Object.keys(PALETTE).filter(g => !only.length || only.includes(g));
const FPS = 30, SECS = 8, DRAW = 'draw';

const data = Object.fromEntries(Object.keys(PALETTE).map(g => [g, {
  acc: PALETTE[g].acc, deep: mix(PALETTE[g].acc, '#14161B', .55), label: PALETTE[g].label,
  items: items.filter(i => i.group === g).map(i => ({ id: i.id, no: items.indexOf(i) + 1, en: i.name.en, say: i.aliases[0], mood: i.mood })),
}]));

const page = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#000">
<canvas id="v" width="1080" height="1920"></canvas>
<script>${readFileSync(join(HERE, 'engine.js'), 'utf8')}</script>
<script>
var D=${JSON.stringify(data)}, cv=document.getElementById('v'), c=cv.getContext('2d');
var SANS='-apple-system,"Apple SD Gothic Neo",system-ui,sans-serif', MONO='"SF Mono",Menlo,monospace';
function txt(s,x,y,font,col,al){c.font=font;c.fillStyle=col;c.textAlign=al||'left';c.textBaseline='alphabetic';c.fillText(s,x,y);}
function pill(s,x,y,font,bg,fg,padX,hh,right){c.font=font;var tw=c.measureText(s).width,w=tw+padX*2,x0=right?x-w:x;c.fillStyle=bg;c.beginPath();c.roundRect(x0,y,w,hh,hh/2);c.fill();c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.fillText(s,x0+w/2,y+hh/2+1);}
function cell(it,x,y,w,h,t,G,r,tag){
  var K={acc:G.acc,deep:G.deep,paper:'#F4F1EA',ink:'#14161B'};
  c.save();c.translate(x,y);c.beginPath();c.roundRect(0,0,w,h,r||18);c.clip();
  OP[it.id](c,w,h,t,K);
  c.restore();
  if(tag)pill(it.mood,x+w-14,y+14,'700 19px '+SANS,'rgba(20,22,27,.88)','#F4F1EA',13,34,true);
}
// Giting 인스타 카드 결: 흰 지면 · 검은 태그 칩 · 굵은 제목 · 아래 GITING. 한 줄 = 하던 말 → 이름
var GROUPS=Object.keys(D);
window.draw=function(g,t){
  var G=D[g],INK='#16181D',SUB='#6B6F7A',LINE='#E6E7EA';
  c.fillStyle='#FFFFFF';c.fillRect(0,0,1080,1920);
  pill('AI 레벨업 · 시키는 말',56,196,'700 26px '+SANS,INK,'#FFFFFF',20,52,false);
  txt('말로 하던 그 오프닝 타이틀,',56,334,'800 70px '+SANS,INK);
  txt('이름은 따로 있어요',56,422,'800 70px '+SANS,INK);
  c.font='700 26px '+MONO;var gw=c.measureText(g).width;
  c.fillStyle=G.acc;c.beginPath();c.arc(64,488,8,0,7);c.fill();
  txt(g,84,497,'700 26px '+MONO,INK);
  txt(G.label,84+gw+18,497,'500 26px '+SANS,SUB);
  txt((GROUPS.indexOf(g)+1)+' / '+GROUPS.length,1024,497,'600 26px '+MONO,SUB,'right');
  c.fillStyle=INK;c.fillRect(56,526,968,3);
  var n=G.items.length,RH=Math.floor(1100/n),TW=Math.round((RH-8)*2.09),TH=RH-8,RY=546;
  G.items.forEach(function(it,i){
    var y=RY+i*RH;
    cell(it,56,y+4,TW,TH,t,G,12,false);
    var X=56+TW+30;
    txt('「'+it.say+'」',X,y+RH*.36,'500 26px '+SANS,SUB);
    txt('→',X,y+RH*.72,'700 38px '+SANS,G.acc);
    txt(it.en,X+52,y+RH*.72,'800 40px '+SANS,INK);
    txt(String(it.no).padStart(2,'0'),1024,y+RH*.72,'600 24px '+MONO,'#A4A8B1','right');
    if(i<G.items.length-1){c.fillStyle=LINE;c.fillRect(X,y+RH-1,1024-X,2);}
  });
  c.fillStyle=INK;c.fillRect(56,1660,968,3);
  txt('GITING',56,1712,'800 26px '+MONO,INK);
  txt('24개 전부 · giting.kr/skills/motion-menu',1024,1712,'500 24px '+SANS,SUB,'right');
};
// 스레드용 한 편: 1080×1350, 한 장에 8칸(2열×4줄), 3장 × 5초. 칸마다 이름과 하던 말
var ALL=[];GROUPS.forEach(function(g){D[g].items.forEach(function(it){ALL.push([it,D[g]]);});});
window.grid=function(T){
  cv.width=1080;cv.height=1350;var pg=Math.min(2,Math.floor(T/5)),t=T-pg*5,INK='#16181D',SUB='#6B6F7A';
  c.fillStyle='#FFFFFF';c.fillRect(0,0,1080,1350);
  pill('오프닝 타이틀 24 · 시키는 말',48,52,'700 24px '+SANS,INK,'#FFFFFF',18,46,false);
  txt((pg+1)+' / 3',1032,86,'600 26px '+MONO,SUB,'right');
  txt('말로 하던 오프닝, 이름은 따로 있어요',48,168,'800 52px '+SANS,INK);
  c.fillStyle=INK;c.fillRect(48,198,984,3);
  var CW=480,CH=228,GX=24,Y0=226,RH=270;
  ALL.slice(pg*8,pg*8+8).forEach(function(p,i){
    var it=p[0],G=p[1],x=48+(i%2)*(CW+GX),y=Y0+Math.floor(i/2)*RH;
    cell(it,x,y,CW,CH-46,t,G,14,false);
    txt(String(it.no).padStart(2,'0'),x,y+CH-12,'700 26px '+MONO,G.acc);
    txt(it.en,x+44,y+CH-12,'800 28px '+SANS,INK);
    txt('「'+it.say+'」',x,y+CH+18,'500 20px '+SANS,SUB);
  });
  txt('GITING',48,1318,'800 24px '+MONO,INK);
  txt('giting.kr/skills/motion-menu',1032,1318,'500 22px '+SANS,SUB,'right');
};
window.sheet=function(){
  cv.width=1080;cv.height=24*120+40;c.fillStyle='#111318';c.fillRect(0,0,cv.width,cv.height);
  var k=0;Object.keys(D).forEach(function(g){var G=D[g];G.items.forEach(function(it){
    var y=20+k*120;txt(String(it.no).padStart(2,'0')+' '+it.id,20,y+60,'600 20px '+MONO,'#ccc');
    [1,2.5,4,6].forEach(function(t,j){cell(it,260+j*205,y,195,100,t,G,18,j===0);});k++;});});
};
</script>`;
const PAGE = join(OUT, 'render-page.html'); writeFileSync(PAGE, page);

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', PORT = 9600 + (process.pid % 200), PROFILE = join(OUT, '.chrome');
const proc = spawn(CHROME, ['--headless', '--no-sandbox', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, 'about:blank'], { stdio: 'ignore' });
const done = () => { try { proc.kill('SIGKILL'); } catch {} };
process.on('exit', done);
let tg = null; for (let i = 0; i < 60 && !tg; i++) { try { tg = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(x => x.type === 'page'); } catch {} if (!tg) await sleep(250); }
const ws = new WebSocket(tg.webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map(), errs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') errs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); };
const send = (m, p = {}) => new Promise(r => { const n = ++id; pend.set(n, r); ws.send(JSON.stringify({ id: n, method: m, params: p })); });
const ev = async x => { const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description); return r.result.result.value; };
await send('Runtime.enable'); await send('Page.enable');
await send('Page.navigate', { url: 'file://' + PAGE }); await sleep(800);
const png = async name => writeFileSync(name, Buffer.from((await ev(`document.getElementById('v').toDataURL('image/png')`)).split(',')[1], 'base64'));

if (mode === 'covers') { for (const g of groups) { await ev(`draw(${JSON.stringify(g)}, 5)`); await png(join(OUT, `still-${g}.png`)); } console.log('covers', groups.join(' ')); }
else if (mode === 'grid') {
  const FF = process.env.FFMPEG || 'ffmpeg', dir = join(OUT, 'frames-grid'); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir);
  for (let f = 0; f < FPS * 15; f++) { await ev(`grid(${f / FPS})`); await png(join(dir, String(f).padStart(4, '0') + '.png')); }
  for (const s of [3.8, 8.8, 13.8]) { await ev(`grid(${s})`); await png(join(OUT, `grid-${Math.floor(s / 5) + 1}.png`)); }
  const r = spawnSync(FF, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(dir, '%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', join(OUT, 'opening-grid.mp4')]);
  if (r.status) { console.error(r.stderr.toString()); process.exit(1); }
  rmSync(dir, { recursive: true, force: true }); console.log('grid', join(OUT, 'opening-grid.mp4'));
}
else if (mode === 'sheet') { await ev('sheet()'); await png(join(OUT, 'sheet.png')); console.log('sheet', join(OUT, 'sheet.png')); }
else {
  const FF = process.env.FFMPEG || 'ffmpeg';
  for (const g of groups) {
    const dir = join(OUT, 'frames-' + g); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir);
    for (let f = 0; f < FPS * SECS; f++) { await ev(`draw(${JSON.stringify(g)}, ${f / FPS})`); await png(join(dir, String(f).padStart(4, '0') + '.png')); }
    await ev(`draw(${JSON.stringify(g)}, 5)`); await png(join(OUT, `cover-${g}.png`));
    const name = `${String(groups.indexOf(g) + 1).padStart(2, '0')}-${g.toLowerCase()}.mp4`;
    const r = spawnSync(FF, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(dir, '%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', join(OUT, name)]);
    if (r.status) { console.error(r.stderr.toString()); process.exit(1); }
    rmSync(dir, { recursive: true, force: true });
    console.log('video', name);
  }
}
console.log('errors:', errs.length ? errs : 'none');
ws.close(); done(); await sleep(500); rmSync(PROFILE, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); process.exit(0);
