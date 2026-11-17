// engine.js + menu.json → demos/m23-space-3d.html (갤러리 데모 프래그먼트)
// 실행: node plugins/motion-menu/tools/space/gen.mjs   그다음 루트에서 node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const MM = join(HERE, '..', '..');
const src = readFileSync(join(HERE, 'engine.js'), 'utf8');
const helpers = src.split('/*@helpers*/')[1].split('/*@end*/')[0].trim();
const { SP } = createRequire(import.meta.url)(join(HERE, 'engine.js'));
const menu = JSON.parse(readFileSync(join(MM, 'menu.json'), 'utf8'));
// 묶음 여섯. 색은 묶음마다 하나(같은 영상 안에서 한 색)
export const PALETTE = {
  TYPE: { acc: '#2BA8E0', label: '글자가 공간에 선다' },
  CAMERA: { acc: '#F05032', label: '카메라가 주인공' },
  SOLID: { acc: '#7C6CF0', label: '덩어리가 바뀐다' },
  PHYSICS: { acc: '#F2B33D', label: '떨어지고 부딪친다' },
  LIGHT: { acc: '#22B8CF', label: '빛으로 깊이를 낸다' },
  CITY: { acc: '#4F7BFF', label: '글자로 지은 거리' },
};
export const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * t + parseInt(b.slice(i, i + 2), 16) * (1 - t)).toString(16).padStart(2, '0')).join('');
const items = menu.items.filter(i => i.category === 'space-3d');
const missing = items.filter(i => !SP[i.id]).map(i => i.id);
if (missing.length) { console.error('engine.js 에 없는 항목:', missing.join(', ')); process.exit(1); }
const orphan = Object.keys(SP).filter(id => !items.find(i => i.id === id));
if (orphan.length) console.warn('menu.json 에 없는 장면(아직 항목 전):', orphan.join(', '));

const frag = it => {
  const acc = PALETTE[it.group].acc;
  return `<!-- @${it.id} h=220 full -->
<style>
  .bg{display:block;width:calc(100% - 24px);height:170px;margin:12px;border-radius:12px;background:#14161B}
</style>
<canvas class="bg" role="img" aria-label="${it.name.ko} 데모: 3D 공간 장면"></canvas>
<p class="cap">${it.name.ko} · ${it.oneliner}</p>
<script>(function(){
${helpers}
var F=${SP[it.id].toString()};
var cv=document.querySelector('canvas.bg'),c=cv.getContext('2d'),K={acc:'${acc}',deep:'${mix(acc, '#14161B', .55)}',paper:'#F4F1EA',ink:'#14161B'};
var still=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches,t0=performance.now();
function sizeCanvas(){var r=cv.getBoundingClientRect(),d=window.devicePixelRatio||1;cv.width=Math.round(r.width*d);cv.height=Math.round(r.height*d);c.setTransform(d,0,0,d,0,0);}
function frame(now){
  var r=cv.getBoundingClientRect();
  c.save();c.beginPath();c.rect(0,0,r.width,r.height);c.clip();F(c,r.width,r.height,still?3:Math.max(0,(now-t0)/1000),K);c.restore();
  if(!still)requestAnimationFrame(frame);
}
sizeCanvas();addEventListener('resize',sizeCanvas);requestAnimationFrame(frame);
})();</script>`;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // 묶음 장면은 engine.js 안의 보조 함수(pillars · wordBox · sceneFloor 등)를 쓴다. 데모에는 helpers + 장면 함수만 실리므로
  // 장면이 부르는 보조 함수는 전부 helpers 안에 있어야 한다. 여기서 한 번 확인한다.
  const shared = src.split('/*@end*/')[1];
  const auxNames = [...shared.matchAll(/^var (\w+) = function/gm)].map(m => m[1]);
  const bad = [];
  for (const it of items) { const body = SP[it.id].toString(); for (const n of auxNames) if (new RegExp('\\b' + n + '\\(').test(body)) bad.push(`${it.id} → ${n}`); }
  if (bad.length) { console.error('helpers 밖의 보조 함수를 장면이 쓴다(갤러리에서 ReferenceError):', bad.join(', ')); process.exit(1); }
  const out = `<!-- 생성물: tools/space/gen.mjs 가 engine.js 에서 만든다. 여기를 직접 고치지 않는다 -->
${items.map(frag).join('\n\n')}
`;
  writeFileSync(join(MM, 'demos', 'm23-space-3d.html'), out);
  console.log(`demos/m23-space-3d.html: ${items.length}개 · ${(out.length / 1024).toFixed(0)}KB`);
}
