// engine.js + menu.json → demos/charts.html (갤러리 데모 프래그먼트, <!-- @id h=NNN full --> 마커)
// 실행: node plugins/chart-menu/tools/gen.mjs   그다음 루트에서 node build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const PL = join(HERE, '..');
const src = readFileSync(join(HERE, 'engine.js'), 'utf8');
const helpers = src.split('/*@helpers*/')[1].split('/*@end*/')[0].trim();
const { CH } = createRequire(import.meta.url)(join(HERE, 'engine.js'));
const menu = JSON.parse(readFileSync(join(PL, 'menu.json'), 'utf8'));
// 색 역할(dataviz 기준 팔레트, 밝은 바탕) — 검증: validate_palette.js "#2a78d6,#eb6834,#1baf7a" --mode light PASS
export const K = {
  surface: '#fcfcfb', ink: '#0b0b0b', ink2: '#52514e', muted: '#898781', grid: '#e1e0d9', base: '#c3c2b7',
  s1: '#2a78d6', s2: '#eb6834', s3: '#1baf7a', gray: '#c3c2b7',
  ramp: ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#2a78d6', '#1c5cab', '#104281', '#0d366b'],
  neg: '#e34948', pos: '#2a78d6', mid: '#f0efec', good: '#0ca30c', goodText: '#006300', warn: '#fab219',
};
const missing = menu.items.filter(i => !CH[i.id]).map(i => i.id);
if (missing.length) { console.error('engine.js 에 없는 항목:', missing.join(', ')); process.exit(1); }
const orphan = Object.keys(CH).filter(id => !menu.items.find(i => i.id === id));
if (orphan.length) console.warn('menu.json 에 없는 그림:', orphan.join(', '));

const frag = it => `<!-- @${it.id} h=236 full -->
<style>
  .ch{display:block;width:calc(100% - 24px);height:186px;margin:12px;border-radius:12px;background:#fcfcfb;border:1px solid #e1e0d9}
</style>
<canvas class="ch" role="img" aria-label="${it.name.ko} 예시: ${it.q}"></canvas>
<p class="cap">${it.shape} · 예시 값</p>
<script>(function(){
${helpers}
var DRAW=${CH[it.id].toString()};
var cv=document.querySelector('canvas.ch'),c=cv.getContext('2d'),K=${JSON.stringify(K)};
function sizeCanvas(){var r=cv.getBoundingClientRect(),d=window.devicePixelRatio||1;cv.width=Math.round(r.width*d);cv.height=Math.round(r.height*d);c.setTransform(d,0,0,d,0,0);c.save();c.beginPath();c.rect(0,0,r.width,r.height);c.clip();DRAW(c,r.width,r.height,K);c.restore();}
sizeCanvas();addEventListener('resize',sizeCanvas);
})();</script>`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const shared = src.split('/*@end*/')[1];
  const auxNames = [...shared.matchAll(/^var (\w+) = function/gm)].map(m => m[1]);
  const bad = [];
  for (const it of menu.items) { const body = CH[it.id].toString(); for (const n of auxNames) if (new RegExp('\\b' + n + '\\(').test(body)) bad.push(`${it.id} → ${n}`); }
  if (bad.length) { console.error('helpers 밖의 보조 함수를 그림이 쓴다(갤러리에서 ReferenceError):', bad.join(', ')); process.exit(1); }
  mkdirSync(join(PL, 'demos'), { recursive: true });
  const out = `<!-- 생성물: tools/gen.mjs 가 engine.js 에서 만든다. 여기를 직접 고치지 않는다 -->\n${menu.items.map(frag).join('\n\n')}\n`;
  writeFileSync(join(PL, 'demos', 'charts.html'), out);
  console.log(`demos/charts.html: ${menu.items.length}개 · ${(out.length / 1024).toFixed(0)}KB`);
}
