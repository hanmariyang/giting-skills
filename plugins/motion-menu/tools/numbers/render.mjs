// ⑱ 숫자 연출 16 홍보 영상 — 묶음마다 1080×1920 영상 하나 (쇼핑 4 · 게임 6 · 계기 6, 8초, 무음)
// node plugins/motion-menu/tools/numbers/render.mjs <출력폴더> [video|sheet|covers] [묶음…]
//   video 는 FFMPEG(환경변수, 기본 ffmpeg)로 mp4 를 굽는다. 이 맥은 ffmpeg 가 없어 owol-motion 의 ffmpeg-shim.sh 를 쓴다
// 그리는 함수는 numbers/engine.js 그대로다(갤러리 데모와 같은 함수). 손잡이는 menu.json 의 처음 값으로 그린다.
// 데모는 400×191 논리 크기로 그리고 칸에 맞춰 늘린다(엔진의 글자 크기가 그 크기 기준이라서).
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const HERE = dirname(fileURLToPath(import.meta.url));
const [, , outArg, mode = 'video', ...only] = process.argv;
if (!outArg) { console.error('출력 폴더를 주세요'); process.exit(1); }
const OUT = resolve(outArg); mkdirSync(OUT, { recursive: true });
const menu = JSON.parse(readFileSync(join(HERE, '..', '..', 'menu.json'), 'utf8'));
const items = menu.items.filter(i => i.category === 'number-motion');
const PALETTE = { SHOP: { acc: '#E8506E', label: '쇼핑' }, GAME: { acc: '#7A5AF0', label: '게임' }, METER: { acc: '#17A88A', label: '계기' } };
const groups = Object.keys(PALETTE).filter(g => !only.length || only.includes(g));
const FPS = 30, SECS = 8;
const fill = (t, V) => t.replace(/\{(\w+)(:ko|:c)?\}/g, (_, k, f) => f === ':c' ? String(Math.round(V[k])).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : String(Math.round(V[k] * 100) / 100));
const knobLine = it => it.knobs.map(k => `${k.label} ${fill(k.v >= 1000 ? '{v:c}' : '{v}', { v: k.v })}${k.unit === 'BPM' ? ' BPM' : k.unit}`).join(' · ');

const data = Object.fromEntries(Object.keys(PALETTE).map(g => [g, {
  acc: PALETTE[g].acc, label: PALETTE[g].label,
  items: items.filter(i => i.group === g).map(i => ({ id: i.id, no: items.indexOf(i) + 1, ko: i.name.ko, say: i.aliases[0], knob: knobLine(i), V: Object.fromEntries(i.knobs.map(k => [k.k, k.v])) })),
}]));

const page = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#000">
<canvas id="v" width="1080" height="1920"></canvas>
<script>var module;${readFileSync(join(HERE, 'engine.js'), 'utf8')}</script>
<script>
var D=${JSON.stringify(data)}, cv=document.getElementById('v'), c=cv.getContext('2d');
var SANS='-apple-system,"Apple SD Gothic Neo",system-ui,sans-serif', MFAM='"SF Mono",Menlo,monospace';
var COL={ink:"#141821",paper:"#F4F1EA",sub:"#8b93a1",acc:"#E07A3F",acc2:"#7a5af0",purple:"#7a5af0",card:"#E7D6BC",green:"#38BE86",pink:"#E8506E"};
function txt(s,x,y,font,col,al){c.font=font;c.fillStyle=col;c.textAlign=al||'left';c.textBaseline='alphabetic';c.fillText(s,x,y);}
function chipR(s,x,y,font,bg,fg,padX,hh){c.font=font;var tw=c.measureText(s).width,w=tw+padX*2;c.fillStyle=bg;c.beginPath();c.roundRect(x,y,w,hh,hh/2);c.fill();c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.fillText(s,x+w/2,y+hh/2+1);}
function cell(it,x,y,w,h,t){
  var LW=400,LH=LW*h/w;
  c.save();c.translate(x,y);c.beginPath();c.roundRect(0,0,w,h,14);c.clip();c.scale(w/LW,h/LH);
  KN[it.id].F(c,LW,LH,t,Object.assign({},it.V),COL);
  c.restore();
}
var GROUPS=Object.keys(D);
window.draw=function(g,t){
  var G=D[g],INK='#16181D',SUB='#6B6F7A',LINE='#E6E7EA';
  c.fillStyle='#FFFFFF';c.fillRect(0,0,1080,1920);
  chipR('AI 레벨업 · 시키는 말',56,196,'700 26px '+SANS,INK,'#FFFFFF',20,52);
  txt('쇼핑·게임 화면 숫자도',56,334,'800 70px '+SANS,INK);
  txt('이름으로 시키세요',56,422,'800 70px '+SANS,INK);
  c.font='700 26px '+MFAM;var gw=c.measureText(g).width;
  c.fillStyle=G.acc;c.beginPath();c.arc(64,488,8,0,7);c.fill();
  txt(g,84,497,'700 26px '+MFAM,INK);
  txt(G.label,84+gw+18,497,'500 26px '+SANS,SUB);
  txt((GROUPS.indexOf(g)+1)+' / '+GROUPS.length,1024,497,'600 26px '+MFAM,SUB,'right');
  c.fillStyle=INK;c.fillRect(56,526,968,3);
  var n=G.items.length,RH=Math.floor(1100/n),TH=Math.min(RH-12,230),TW=Math.round(TH*2.09),RY=546;
  G.items.forEach(function(it,i){
    var y=RY+i*RH, cy=y+(RH-TH)/2;
    cell(it,56,cy,TW,TH,t);
    var X=56+TW+30, mid=y+RH/2;
    txt('「'+it.say+'」',X,mid-34,'500 25px '+SANS,SUB);
    txt('→',X,mid+16,'700 36px '+SANS,G.acc);
    txt(it.ko,X+48,mid+16,'800 38px '+SANS,INK);
    txt('손잡이 · '+it.knob,X,mid+56,'500 21px '+SANS,'#9A9EA8');
    txt(String(it.no).padStart(2,'0'),1024,mid+16,'600 24px '+MFAM,'#A4A8B1','right');
    if(i<G.items.length-1){c.fillStyle=LINE;c.fillRect(X,y+RH-1,1024-X,2);}
  });
  c.fillStyle=INK;c.fillRect(56,1660,968,3);
  txt('GITING',56,1712,'800 26px '+MFAM,INK);
  txt('16개 · 값을 바꾸면 문장도 · giting.kr/skills/motion-menu',1024,1712,'500 23px '+SANS,SUB,'right');
};
window.sheet=function(){
  cv.width=1080;cv.height=16*120+40;c.fillStyle='#111318';c.fillRect(0,0,cv.width,cv.height);
  var k=0;GROUPS.forEach(function(g){D[g].items.forEach(function(it){
    var y=20+k*120;txt(String(it.no).padStart(2,'0')+' '+it.id,20,y+60,'600 20px '+MFAM,'#ccc');
    [1,2.5,4,6].forEach(function(t,j){cell(it,260+j*205,y,195,100,t);});k++;});});
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
