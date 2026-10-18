// engine.js + menu.json → demos/m15-data-motion.html (갤러리 데모 프래그먼트 24개)
// 실행: node plugins/motion-menu/tools/data/gen.mjs   그다음 루트에서 node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const MM = join(HERE, '..', '..');
const src = readFileSync(join(HERE, 'engine.js'), 'utf8');
const helpers = src.split('/*@helpers*/')[1].split('/*@end*/')[0].trim();
const { DM } = createRequire(import.meta.url)(join(HERE, 'engine.js'));
const menu = JSON.parse(readFileSync(join(MM, 'menu.json'), 'utf8'));
export const PALETTE = {
  NUMBER: { acc: '#F05032', label: '숫자 하나를 세워요' },
  BAR: { acc: '#2B7FE0', label: '막대로 비교해요' },
  LINE: { acc: '#17A88A', label: '선으로 흐름을 보여요' },
  SHARE: { acc: '#6B5AE0', label: '비율을 나눠 보여요' },
};
export const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * t + parseInt(b.slice(i, i + 2), 16) * (1 - t)).toString(16).padStart(2, '0')).join('');
const items = menu.items.filter(i => i.category === 'data-motion');
const missing = items.filter(i => !DM[i.id]).map(i => i.id);
if (missing.length) { console.error('engine.js 에 없는 데이터 모션:', missing.join(', ')); process.exit(1); }

const frag = it => {
  const acc = PALETTE[it.group].acc;
  return `<!-- @${it.id} h=220 full -->
<style>
  .bg{display:block;width:calc(100% - 24px);height:170px;margin:12px;border-radius:12px;background:#14161B}
</style>
<canvas class="bg" role="img" aria-label="${it.name.ko} 데모: 숫자와 차트가 움직이는 장면"></canvas>
<p class="cap">${it.name.ko} · ${it.oneliner}</p>
<script>(function(){
${helpers}
var F=${DM[it.id].toString()};
var cv=document.querySelector('canvas.bg'),c=cv.getContext('2d'),K={acc:'${acc}',deep:'${mix(acc, '#14161B', .55)}',paper:'#F4F1EA',ink:'#14161B'};
var still=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches,t0=performance.now();
function sizeCanvas(){var r=cv.getBoundingClientRect(),d=window.devicePixelRatio||1;cv.width=Math.round(r.width*d);cv.height=Math.round(r.height*d);c.setTransform(d,0,0,d,0,0);}
function frame(now){
  var r=cv.getBoundingClientRect();
  c.save();c.beginPath();c.rect(0,0,r.width,r.height);c.clip();F(c,r.width,r.height,still?5:Math.max(0,(now-t0)/1000),K);c.restore();
  if(!still)requestAnimationFrame(frame);
}
sizeCanvas();addEventListener('resize',sizeCanvas);requestAnimationFrame(frame);
})();</script>`;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
const out = `<!-- 생성물: tools/data/gen.mjs 가 engine.js 에서 만든다. 여기를 직접 고치지 않는다 -->
${items.map(frag).join('\n\n')}
`;
writeFileSync(join(MM, 'demos', 'm15-data-motion.html'), out);
console.log(`demos/m15-data-motion.html: ${items.length}개 · ${(out.length / 1024).toFixed(0)}KB`);
}
