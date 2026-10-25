// engine.js + menu.json → demos/m21-knobs.html (손잡이가 붙은 항목의 갤러리 데모)
// 실행: node plugins/motion-menu/tools/knobs/gen.mjs   그다음 루트에서 node build.mjs
// 손잡이 이름·범위·처음 값은 menu.json 의 knobs 가 정본이다. 데모의 처음 값도 거기서 가져온다.
// 갤러리는 { mok: { 키: 값 } } 를 iframe 에 보내고, 데모는 그 값으로 처음부터 다시 돈다.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const MM = join(HERE, '..', '..');
// 엔진 둘: knobs/engine.js(⑤ 타이밍 손잡이) · numbers/engine.js(⑱ 숫자 연출). 항목은 자기 함수가 있는 엔진의 helpers 를 싣는다.
const ENGINES = [join(HERE, 'engine.js'), join(HERE, '..', 'numbers', 'engine.js')].map(f => {
  const src = readFileSync(f, 'utf8');
  return { helpers: src.split('/*@helpers*/')[1].split('/*@end*/')[0].trim(), KN: createRequire(import.meta.url)(f).KN };
});
const engineOf = id => ENGINES.find(e => e.KN[id]);
const menu = JSON.parse(readFileSync(join(MM, 'menu.json'), 'utf8'));
const items = menu.items.filter(i => i.knobs);
const allKN = ENGINES.flatMap(e => Object.keys(e.KN));
const miss = items.filter(i => !engineOf(i.id)).map(i => i.id), extra = allKN.filter(id => !items.some(i => i.id === id));
if (miss.length || extra.length) { console.error('손잡이 항목과 엔진이 어긋남:', '엔진에 없음', miss, '/ menu.json 에 knobs 없음', extra); process.exit(1); }
// 코스별 출력 파일. 여기 없는 코스의 손잡이 항목은 m21-knobs.html 로 간다
const OUT = { 'number-motion': 'm22-number-motion.html' };
const COLORS = { ink: '#141821', paper: '#F4F1EA', sub: '#8b93a1', acc: '#E07A3F', acc2: '#7a5af0', purple: '#7a5af0', card: '#E7D6BC', green: '#38BE86', pink: '#E8506E' };

const frag = it => {
  const V = Object.fromEntries(it.knobs.map(k => [k.k, k.v]));
  return `<!-- @${it.id} h=240 full -->
<style>
  .kn{display:block;width:calc(100% - 24px);height:170px;margin:12px;border-radius:12px;background:#141821}
</style>
<canvas class="kn" role="img" aria-label="${it.name.ko} 데모: 요청 문장의 값 그대로 움직인다"></canvas>
<p class="cap">${it.name.ko} · ${it.oneliner}</p>
<script>(function(){
${engineOf(it.id).helpers}
var F=${engineOf(it.id).KN[it.id].F.toString()};
var V=${JSON.stringify(V)},K=${JSON.stringify(COLORS)},STILL=${engineOf(it.id).KN[it.id].still};
var cv=document.querySelector('canvas.kn'),c=cv.getContext('2d');
var still=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches,t0=performance.now();
function sizeCanvas(){var r=cv.getBoundingClientRect(),d=window.devicePixelRatio||1;cv.width=Math.round(r.width*d);cv.height=Math.round(r.height*d);c.setTransform(d,0,0,d,0,0);}
function draw(now){var r=cv.getBoundingClientRect();c.save();c.beginPath();c.rect(0,0,r.width,r.height);c.clip();F(c,r.width,r.height,still?STILL:Math.max(0,(now-t0)/1000),V,K);c.restore();}
function frame(now){draw(now);if(!still)requestAnimationFrame(frame);}
addEventListener('message',function(e){var d=e.data&&e.data.mok;if(!d)return;for(var k in d)if(k in V&&isFinite(+d[k]))V[k]=+d[k];t0=performance.now();if(still)draw(t0);});
sizeCanvas();addEventListener('resize',function(){sizeCanvas();if(still)draw(performance.now());});requestAnimationFrame(frame);
})();</script>`;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = {};
  for (const it of items) (files[OUT[it.category] || 'm21-knobs.html'] ||= []).push(it);
  for (const [fn, list] of Object.entries(files)) {
    const out = `<!-- 생성물: tools/knobs/gen.mjs 가 엔진과 menu.json 의 knobs 로 만든다. 여기를 직접 고치지 않는다 -->
${list.map(frag).join('\n\n')}
`;
    writeFileSync(join(MM, 'demos', fn), out);
    console.log(`demos/${fn}: ${list.length}개 · ${(out.length / 1024).toFixed(0)}KB`);
  }
}
