// engine.js + menu.json → demos/m11-basics.html (메뉴판에 새로 넣은 기본기 8개의 갤러리 데모)
// 실행: node plugins/motion-menu/tools/basics/gen.mjs   그다음 루트에서 node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const MM = join(HERE, '..', '..');
const src = readFileSync(join(HERE, 'engine.js'), 'utf8');
const helpers = src.split('/*@helpers*/')[1].split('/*@end*/')[0].trim();
const { BS } = createRequire(import.meta.url)(join(HERE, 'engine.js'));
const menu = JSON.parse(readFileSync(join(MM, 'menu.json'), 'utf8'));
export const PALETTE = {
  APPEAR: { acc: '#E8506E', label: '나오는 법' },
  FEEL: { acc: '#17A88A', label: '움직임의 맛' },
  SWITCH: { acc: '#6B5AE0', label: '바꾸고 보여 주기' },
};
// 영상 순서. 16개는 원래 코스에 있던 항목, NEW 8개는 이번에 메뉴판에 넣은 것
export const ORDER = {
  APPEAR: ['pop-in', 'stagger', 'burst', 'line-draw', 'mask-reveal', 'type-on', 'count-up', 'kinetic-typography'],
  FEEL: ['easing', 'overshoot', 'squash-stretch', 'shape-morph', 'liquid-motion', 'motion-trail', 'particles', 'parallax'],
  SWITCH: ['wipe', 'circle-wipe', 'drip-wipe', 'screen-dive', 'grid-flip', 'light-sweep', 'glitch', 'impact-shake'],
};
export const NEW = ['pop-in', 'burst', 'line-draw', 'count-up', 'shape-morph', 'liquid-motion', 'particles', 'impact-shake'];
export const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * t + parseInt(b.slice(i, i + 2), 16) * (1 - t)).toString(16).padStart(2, '0')).join('');
const all = Object.values(ORDER).flat(), byId = Object.fromEntries(menu.items.map(i => [i.id, i]));
const missing = all.filter(id => !BS[id] || !byId[id]);
if (missing.length) { console.error('engine.js 나 menu.json 에 없는 기본기:', missing.join(', ')); process.exit(1); }
const items = NEW.map(id => byId[id]).filter(it => !it.knobs); // 손잡이가 붙은 것은 tools/knobs 가 데모를 낸다
const groupOf = id => Object.keys(ORDER).find(g => ORDER[g].includes(id));

const frag = it => {
  const acc = PALETTE[groupOf(it.id)].acc;
  return `<!-- @${it.id} h=220 full -->
<style>
  .bs{display:block;width:calc(100% - 24px);height:170px;margin:12px;border-radius:12px;background:#14161B}
</style>
<canvas class="bs" role="img" aria-label="${it.name.ko} 데모: 반복해서 움직이는 모션"></canvas>
<p class="cap">${it.name.ko} · ${it.oneliner}</p>
<script>(function(){
${helpers}
var F=${BS[it.id].toString()};
var cv=document.querySelector('canvas.bs'),c=cv.getContext('2d'),K={acc:'${acc}',deep:'${mix(acc, '#14161B', .55)}',paper:'#F4F1EA',ink:'#14161B'};
var still=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches,t0=performance.now();
function sizeCanvas(){var r=cv.getBoundingClientRect(),d=window.devicePixelRatio||1;cv.width=Math.round(r.width*d);cv.height=Math.round(r.height*d);c.setTransform(d,0,0,d,0,0);}
function frame(now){
  var r=cv.getBoundingClientRect();
  c.save();c.beginPath();c.rect(0,0,r.width,r.height);c.clip();F(c,r.width,r.height,still?1.1:Math.max(0,(now-t0)/1000),K);c.restore();
  if(!still)requestAnimationFrame(frame);
}
sizeCanvas();addEventListener('resize',sizeCanvas);requestAnimationFrame(frame);
})();</script>`;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
const out = `<!-- 생성물: tools/basics/gen.mjs 가 engine.js 에서 만든다. 여기를 직접 고치지 않는다 -->
${items.map(frag).join('\n\n')}
`;
writeFileSync(join(MM, 'demos', 'm11-basics.html'), out);
console.log(`demos/m11-basics.html: ${items.length}개 · ${(out.length / 1024).toFixed(0)}KB`);
}
