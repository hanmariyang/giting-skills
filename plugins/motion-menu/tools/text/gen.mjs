// engine.js + menu.json → demos/m10-text-motion.html(⑨ 글자 연출 40) · demos/m13-text-body.html(⑩ 글자 몸짓 24)
// 실행: node plugins/motion-menu/tools/text/gen.mjs   그다음 루트에서 node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const MM = join(HERE, '..', '..');
const src = readFileSync(join(HERE, 'engine.js'), 'utf8');
const helpers = src.split('/*@helpers*/')[1].split('/*@end*/')[0].trim();
const { TX } = createRequire(import.meta.url)(join(HERE, 'engine.js'));
const menu = JSON.parse(readFileSync(join(MM, 'menu.json'), 'utf8'));
export const PALETTE = {
  PUNCH: { acc: '#E8506E', label: '한 단어로 분위기를 바꿔요' },
  FLOW: { acc: '#E8930C', label: '멈추지 않고 흘러요' },
  DEPTH: { acc: '#17A88A', label: '글자 속으로 들어가요' },
  SWAP: { acc: '#6B5AE0', label: '말을 바꿔 끼워요' },
  STYLE: { acc: '#F05032', label: '보여 주는 방식으로 끌어올려요' },
};
export const PALETTE_BODY = {
  VANISH: { acc: '#2BA8E0', label: '사라지고 모여요' },
  SWAY: { acc: '#E8930C', label: '쉬지 않고 흔들려요' },
  PLAY: { acc: '#E8506E', label: '물리와 소품으로 놀아요' },
  INSIDE: { acc: '#6B5AE0', label: '글자 안과 배치를 바꿔요' },
};
export const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * t + parseInt(b.slice(i, i + 2), 16) * (1 - t)).toString(16).padStart(2, '0')).join('');
const items = menu.items.filter(i => i.category === 'text-motion');
const body = menu.items.filter(i => i.category === 'text-body');
const missing = items.concat(body).filter(i => !TX[i.id]).map(i => i.id);
if (missing.length) { console.error('engine.js 에 없는 글자 연출:', missing.join(', ')); process.exit(1); }

const frag = it => {
  const acc = (PALETTE[it.group] || PALETTE_BODY[it.group]).acc;
  return `<!-- @${it.id} h=220 full -->
<style>
  .tx{display:block;width:calc(100% - 24px);height:170px;margin:12px;border-radius:12px;background:#14161B}
</style>
<canvas class="tx" role="img" aria-label="${it.name.ko} 데모: 반복해서 움직이는 글자 연출"></canvas>
<p class="cap">${it.name.ko} · ${it.oneliner}</p>
<script>(function(){
${helpers}
var F=${TX[it.id].toString()};
var cv=document.querySelector('canvas.tx'),c=cv.getContext('2d'),K={acc:'${acc}',deep:'${mix(acc, '#14161B', .55)}',paper:'#F4F1EA',ink:'#14161B'};
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
const out = `<!-- 생성물: tools/text/gen.mjs 가 engine.js 에서 만든다. 여기를 직접 고치지 않는다 -->
${items.map(frag).join('\n\n')}
`;
writeFileSync(join(MM, 'demos', 'm10-text-motion.html'), out);
console.log(`demos/m10-text-motion.html: ${items.length}개 · ${(out.length / 1024).toFixed(0)}KB`);
const out2 = `<!-- 생성물: tools/text/gen.mjs 가 engine.js 에서 만든다. 여기를 직접 고치지 않는다 -->
${body.map(frag).join('\n\n')}
`;
writeFileSync(join(MM, 'demos', 'm13-text-body.html'), out2);
console.log(`demos/m13-text-body.html: ${body.length}개 · ${(out2.length / 1024).toFixed(0)}KB`);
}
