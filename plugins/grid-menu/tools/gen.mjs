// menu.json + tools/engine.js → demos/posters.html (항목마다 4:5 포스터 견본 하나, 캔버스로 8초 반복)
// 실행: node plugins/grid-menu/tools/gen.mjs   그다음 루트에서 node build.mjs
// 그림은 engine.js 의 GP[id](c,w,h,t,{grid}) 하나에서 나온다. 홍보 영상(GRID RACK)도 같은 함수를 쓴다.
// {{engine}} 자리는 build.mjs 가 쓰임새마다 바꾼다: components = 엔진 통째로 · 갤러리 = /skills/grid-menu/engine.js · llms = jsDelivr 주소.
// 포스터 속 글(골목 사진전·예시 갤러리·날짜)은 지어낸 예시다.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const GP_DIR = join(HERE, '..');
const menu = JSON.parse(readFileSync(join(GP_DIR, 'menu.json'), 'utf8'));

// 엔진에 그림이 있는지 노드에서 확인한다(캔버스 없이 키만 본다)
const g = {};
new Function('globalThis', readFileSync(join(HERE, 'engine.js'), 'utf8'))(g);
const have = Object.keys(g.GP || {});
const miss = menu.items.filter(i => !have.includes(i.id)).map(i => i.id), extra = have.filter(id => !menu.items.some(i => i.id === id));
if (miss.length || extra.length) { console.error('포스터 그림과 menu.json 이 어긋남:', miss, extra); process.exit(1); }

const CSS = `<style>
  .gm{width:min(360px,calc(100% - 24px));margin:12px auto 10px;font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#16161A}
  .gm canvas{display:block;width:100%;height:auto;aspect-ratio:4/5;background:#fff;box-shadow:0 1px 0 #E2E2E6,0 14px 30px rgba(22,22,26,.12)}
  .gm .bar{display:flex;align-items:center;gap:8px;margin-top:10px}
  .gm button{font:700 12px/1 inherit;font-family:inherit;border:1.5px solid #16161A;background:#fff;color:#16161A;border-radius:999px;padding:6px 12px;cursor:pointer}
  .gm button[aria-pressed="true"]{background:#E2457A;border-color:#E2457A;color:#fff}
  .gm button:focus-visible{outline:2px solid #E2457A;outline-offset:2px}
  .gm .note{font-size:11px;color:#8A8A92}
</style>`;

// 러너: 엔진 헬퍼 이름(put·txt·fit 등)을 쓰지 않는다. 엔진은 GP 하나만 밖으로 낸다.
const RUN = id => `<script>(function(){
  var cv=document.currentScript.parentNode.querySelector('canvas'),btn=cv.parentNode.querySelector('button'),note=cv.parentNode.querySelector('.note');
  var still=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mode=still?true:'auto',t0=null,dpr=Math.min(2,window.devicePixelRatio||1);
  cv.width=360*dpr;cv.height=450*dpr;var c=cv.getContext('2d');
  function paint(t){c.setTransform(dpr,0,0,dpr,0,0);GP[${JSON.stringify(id)}](c,360,450,t,{grid:mode});}
  function label(){btn.setAttribute('aria-pressed',mode===false?'false':'true');btn.textContent=mode==='auto'?'그리드 선 · 자동':mode?'그리드 선 · 켬':'그리드 선 · 끔';note.textContent=still?'움직임 줄이기: 다 놓인 판':'8초 반복';}
  btn.addEventListener('click',function(){mode=still?!mode:(mode==='auto'?true:mode===true?false:'auto');label();if(still)paint(4);});
  label();
  if(still){paint(4);return;}
  function loop(now){if(t0===null)t0=now;paint(Math.max(0,(now-t0)/1000));requestAnimationFrame(loop);}
  requestAnimationFrame(loop);
})();</script>`;

const frag = it => `<!-- @${it.id} h=490 full -->
${CSS}
{{engine}}
<div class="gm"><canvas role="img" aria-label="${it.name.ko} 포스터 견본. 그리드 선이 그려진 뒤 요소가 칸에 앉는다"></canvas><div class="bar"><button type="button" aria-pressed="true">그리드 선 · 자동</button><span class="note"></span></div>${RUN(it.id)}</div>`;

const out = `<!-- 생성물: tools/gen.mjs 가 menu.json 과 tools/engine.js 로 만든다. 여기를 직접 고치지 않는다 -->
${menu.items.map(frag).join('\n\n')}
`;
writeFileSync(join(GP_DIR, 'demos', 'posters.html'), out);
console.log(`demos/posters.html: ${menu.items.length}장 · ${(out.length / 1024).toFixed(0)}KB`);
