// engine.js + menu.json → demos/m8-screen-transition.html(⑦ 40개) + demos/m14-screen-transition-2.html(⑪ 23개)
// 실행: node plugins/motion-menu/tools/transitions/gen.mjs   그다음 루트에서 node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const MM = join(HERE, '..', '..');
const src = readFileSync(join(HERE, 'engine.js'), 'utf8');
const helpers = src.split('/*@helpers*/')[1].split('/*@end*/')[0].trim();
const { TR } = createRequire(import.meta.url)(join(HERE, 'engine.js'));
const menu = JSON.parse(readFileSync(join(MM, 'menu.json'), 'utf8'));
export const PALETTE = {
  SWEEP: { acc: '#E8506E', label: '색면이 화면을 가로질러요' },
  SHAPE: { acc: '#21B795', label: '모양이 퍼지며 덮어요' },
  FLUID: { acc: '#F05032', label: '액체 · 파문 · 충격으로' },
  PANEL: { acc: '#6B5AE0', label: '판을 갈아 끼워요' },
  MOSAIC: { acc: '#2BA8E0', label: '나누고 섞어서 보여요' },
};
export const PALETTE2 = {
  BASIC: { acc: '#2BA8E0', label: '밀고 덮어요' },
  FADE: { acc: '#F05032', label: '빛과 어둠을 지나요' },
  SPIN: { acc: '#6B5AE0', label: '돌고 빨려 들어요' },
  SOLID: { acc: '#21B795', label: '입체로 넘어가요' },
  OBJECT: { acc: '#E8B520', label: '물건처럼 부서져요' },
};
// 코스별 설정: 범주 · 색 · 데모 파일
export const COURSES = {
  'screen-transition': { palette: PALETTE, demo: 'm8-screen-transition.html' },
  'screen-transition-2': { palette: PALETTE2, demo: 'm14-screen-transition-2.html' },
};
const all = menu.items.filter(i => COURSES[i.category]);
const missing = all.filter(i => !TR[i.id]).map(i => i.id);
if (missing.length) { console.error('engine.js 에 없는 전환:', missing.join(', ')); process.exit(1); }

export const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * t + parseInt(b.slice(i, i + 2), 16) * (1 - t)).toString(16).padStart(2, '0')).join('');
const frag = it => {
  const acc = COURSES[it.category].palette[it.group].acc;
  return `<!-- @${it.id} h=220 full -->
<style>
  .st{display:block;width:calc(100% - 24px);height:170px;margin:12px;border-radius:12px;background:#14161B}
</style>
<canvas class="st" role="img" aria-label="${it.name.ko} 데모: 화면 A 에서 B 로 넘어갔다가 돌아온다"></canvas>
<p class="cap">${it.name.ko} · ${it.oneliner}</p>
<script>(function(){
${helpers}
var T=${TR[it.id].toString()};
var cv=document.querySelector('canvas.st'),c=cv.getContext('2d'),K={acc:'${acc}',deep:'${mix(acc, '#14161B', .55)}',paper:'#F4F1EA',ink:'#14161B',n:0};
var still=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches,t0=performance.now();
function sizeCanvas(){var r=cv.getBoundingClientRect(),d=window.devicePixelRatio||1;cv.width=Math.round(r.width*d);cv.height=Math.round(r.height*d);c.setTransform(d,0,0,d,0,0);}
function frame(now){
  var r=cv.getBoundingClientRect(),w=r.width,h=r.height,t=still?1.2:(Math.max(0,(now-t0)/1000))%4,cyc=Math.floor((now-t0)/4000);
  var SA=scene(c,w,h,K.ink,K.paper,'A'),SB=scene(c,w,h,K.acc,K.ink,'B');
  K.n=cyc*2+(t<2?0:1);
  c.save();c.beginPath();c.rect(0,0,w,h);c.clip();
  if(t<.4)SA();else if(t<1.8)T(c,w,h,(t-.4)/1.4,SA,SB,K);else if(t<2.4)SB();else if(t<3.8)T(c,w,h,(t-2.4)/1.4,SB,SA,K);else SA();
  c.restore();
  if(!still)requestAnimationFrame(frame);
}
sizeCanvas();addEventListener('resize',sizeCanvas);requestAnimationFrame(frame);
})();</script>`;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
for (const [cat, C] of Object.entries(COURSES)) {
  const items = all.filter(i => i.category === cat);
  const out = `<!-- 생성물: tools/transitions/gen.mjs 가 engine.js 에서 만든다. 여기를 직접 고치지 않는다 -->
${items.map(frag).join('\n\n')}
`;
  writeFileSync(join(MM, 'demos', C.demo), out);
  console.log(`demos/${C.demo}: ${items.length}개 · ${(out.length / 1024).toFixed(0)}KB`);
}
}
