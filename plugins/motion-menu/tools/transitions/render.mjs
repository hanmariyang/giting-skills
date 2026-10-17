// 화면 전환 홍보 영상 — 묶음마다 1080×1920 영상 하나 (⑦ 8개씩 5편 · ⑪ 4~5개씩 5편)
// [TR_CAT=screen-transition-2] node plugins/motion-menu/tools/transitions/render.mjs <출력폴더> [sheet|video] [묶음…]
//   covers: 묶음마다 전환 한가운데 멈춘 한 장(still-<묶음>.png) — 레이아웃 확인용
//   sheet: 전환 40개를 진행 0.3 · 0.6 에서 멈춘 확인용 한 장(sheet.png)
//   video: 프레임을 PNG 로 떠서 FFMPEG(환경변수, 기본 ffmpeg)로 mp4 를 굽는다. 무음
// 그리는 함수는 engine.js 그대로다. 갤러리 데모와 영상이 같은 함수에서 나온다.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import { COURSES, mix } from './gen.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const [, , outArg, mode = 'video', ...only] = process.argv;
if (!outArg) { console.error('출력 폴더를 주세요'); process.exit(1); }
const OUT = resolve(outArg); mkdirSync(OUT, { recursive: true });
const menu = JSON.parse(readFileSync(join(HERE, '..', '..', 'menu.json'), 'utf8'));
const CAT = process.env.TR_CAT || 'screen-transition', PALETTE = COURSES[CAT].palette;
const items = menu.items.filter(i => i.category === CAT);
const groups = Object.keys(PALETTE).filter(g => !only.length || only.includes(g));
const FPS = 30, SECS = 8;

const data = Object.fromEntries(Object.keys(PALETTE).map(g => [g, {
  acc: PALETTE[g].acc, deep: mix(PALETTE[g].acc, '#14161B', .55), label: PALETTE[g].label,
  items: items.filter(i => i.group === g).map(i => ({ id: i.id, no: items.indexOf(i) + 1, en: i.name.en, say: i.aliases[0], mood: i.mood })),
}]));

const page = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#000">
<canvas id="v" width="1080" height="1920"></canvas>
<script>${readFileSync(join(HERE, 'engine.js'), 'utf8')}</script>
<script>
var D=${JSON.stringify(data)}, TOTAL=${items.length}, cv=document.getElementById('v'), c=cv.getContext('2d');
var SANS='-apple-system,"Apple SD Gothic Neo",system-ui,sans-serif', MONO='"SF Mono",Menlo,monospace';
function txt(s,x,y,font,col,al){c.font=font;c.fillStyle=col;c.textAlign=al||'left';c.textBaseline='alphabetic';c.fillText(s,x,y);}
function pill(s,x,y,font,bg,fg,padX,hh,right){c.font=font;var tw=c.measureText(s).width,w=tw+padX*2,x0=right?x-w:x;c.fillStyle=bg;c.beginPath();c.roundRect(x0,y,w,hh,hh/2);c.fill();c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.fillText(s,x0+w/2,y+hh/2+1);}
function cell(it,x,y,w,h,p,dir,G,n,r,tag){
  var K={acc:G.acc,deep:G.deep,paper:'#F4F1EA',ink:'#14161B',n:n};
  c.save();c.translate(x,y);c.beginPath();c.roundRect(0,0,w,h,r||18);c.clip();
  var SA=scene(c,w,h,K.ink,K.paper,'A'),SB=scene(c,w,h,K.acc,K.ink,'B');
  if(p===null)(dir?SB:SA)();else if(dir)TR[it.id](c,w,h,p,SB,SA,K);else TR[it.id](c,w,h,p,SA,SB,K);
  c.restore();
  if(tag)pill(it.mood,x+w-14,y+14,'700 19px '+SANS,'rgba(20,22,27,.88)','#F4F1EA',13,34,true);
}
// 한 칸의 시간표: 4초 주기 = 머묾 .4 · A→B 1.4 · 머묾 .6 · B→A 1.4 · 머묾 .2
function phase(t){t=((t%4)+4)%4;if(t<.4)return[null,0];if(t<1.8)return[(t-.4)/1.4,0];if(t<2.4)return[null,1];if(t<3.8)return[(t-2.4)/1.4,1];return[null,0];}
// Giting 인스타 카드 결: 흰 지면 · 검은 태그 칩 · 굵은 제목 · 아래 GITING. 한 줄 = 하던 말 → 이름
var GROUPS=Object.keys(D);
window.draw=function(g,t){
  var G=D[g],INK='#16181D',SUB='#6B6F7A',LINE='#E6E7EA';
  c.fillStyle='#FFFFFF';c.fillRect(0,0,1080,1920);
  pill('AI 레벨업 · 시키는 말',56,196,'700 26px '+SANS,INK,'#FFFFFF',20,52,false);
  txt('말로 하던 그 전환,',56,334,'800 70px '+SANS,INK);
  txt('이름은 따로 있어요',56,422,'800 70px '+SANS,INK);
  c.font='700 26px '+MONO;var gw=c.measureText(g).width;
  c.fillStyle=G.acc;c.beginPath();c.arc(64,488,8,0,7);c.fill();
  txt(g,84,497,'700 26px '+MONO,INK);
  txt(G.label,84+gw+18,497,'500 26px '+SANS,SUB);
  txt((GROUPS.indexOf(g)+1)+' / '+GROUPS.length,1024,497,'600 26px '+MONO,SUB,'right');
  c.fillStyle=INK;c.fillRect(56,526,968,3);
  var TW=272,TH=130,RY=546,RH=138;
  G.items.forEach(function(it,i){
    var y=RY+i*RH,ph=phase(t-i*.11),n=Math.floor((t-i*.11+8)/2);
    cell(it,56,y+4,TW,TH,ph[0],ph[1],G,n,12,false);
    txt('「'+it.say+'」',358,y+54,'500 28px '+SANS,SUB);
    txt('→',358,y+108,'700 38px '+SANS,G.acc);
    txt(it.en,410,y+108,'800 42px '+SANS,INK);
    txt(String(it.no).padStart(2,'0'),1024,y+108,'600 24px '+MONO,'#A4A8B1','right');
    if(i<G.items.length-1){c.fillStyle=LINE;c.fillRect(358,y+RH-1,666,2);}
  });
  c.fillStyle=INK;c.fillRect(56,1660,968,3);
  txt('GITING',56,1712,'800 26px '+MONO,INK);
  txt(TOTAL+'개 전부 · giting.kr/skills/motion-menu',1024,1712,'500 24px '+SANS,SUB,'right');
};
window.sheet=function(){
  cv.width=1080;cv.height=TOTAL*120+40;c.fillStyle='#111318';c.fillRect(0,0,cv.width,cv.height);
  var k=0;Object.keys(D).forEach(function(g){var G=D[g];G.items.forEach(function(it){
    var y=20+k*120;txt(String(it.no).padStart(2,'0')+' '+it.id,20,y+60,'600 22px '+MONO,'#ccc');
    [.15,.35,.55,.8].forEach(function(p,j){cell(it,260+j*205,y,195,100,p,0,G,1,18,true);});k++;});});
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

if (mode === 'covers') { for (const g of groups) { await ev(`draw(${JSON.stringify(g)}, 1.1)`); await png(join(OUT, `still-${g}.png`)); } console.log('covers', groups.join(' ')); }
else if (mode === 'sheet') { await ev('sheet()'); await png(join(OUT, 'sheet.png')); console.log('sheet', join(OUT, 'sheet.png')); }
else {
  const FF = process.env.FFMPEG || 'ffmpeg';
  for (const g of groups) {
    const dir = join(OUT, 'frames-' + g); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir);
    for (let f = 0; f < FPS * SECS; f++) { await ev(`draw(${JSON.stringify(g)}, ${f / FPS})`); await png(join(dir, String(f).padStart(4, '0') + '.png')); }
    await ev(`draw(${JSON.stringify(g)}, 0.2)`); await png(join(OUT, `cover-${g}.png`));
    const name = `${String(groups.indexOf(g) + 1).padStart(2, '0')}-${g.toLowerCase()}.mp4`;
    const r = spawnSync(FF, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(dir, '%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', join(OUT, name)]);
    if (r.status) { console.error(r.stderr.toString()); process.exit(1); }
    rmSync(dir, { recursive: true, force: true });
    console.log('video', name);
  }
}
console.log('errors:', errs.length ? errs : 'none');
ws.close(); done(); await sleep(500); rmSync(PROFILE, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); process.exit(0);
