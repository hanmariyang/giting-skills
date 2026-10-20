#!/usr/bin/env node
/* inline-engine — 페이지의 엔진 <script src> 를 엔진 파일 그대로로 바꿔 한 파일로 만든다 (의존성 0).
 * 사용: node inline-engine.mjs <page.html>
 * 페이지에는 <script src="canvas-motion.js"></script> (와 필요하면 canvas-motion-plus.js) 를 적어 두고 이걸 돌린다.
 * 엔진을 손으로 옮겨 적지 않는다 — 옮겨 적은 엔진은 reduced-motion 처리처럼 보이는 곳이 틀어진다.
 */
import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ENG = join(dirname(fileURLToPath(import.meta.url)), '..', 'engine');
const file = process.argv[2];
if (!file) { console.error('사용: node inline-engine.mjs <page.html>'); process.exit(1); }
let s = fs.readFileSync(file, 'utf8'), n = 0;
for (const name of ['canvas-motion-plus.js', 'canvas-motion.js']) {
  const re = new RegExp(`<script[^>]*src=["'][^"']*${name.replace(/[.-]/g, '\\$&')}["'][^>]*>\\s*</script>`, 'g');
  s = s.replace(re, () => { n++; return `<script>/* ${name} · inline-engine 이 그대로 넣음 — 고치지 않는다 */\n${fs.readFileSync(join(ENG, name), 'utf8')}\n</script>`; });
}
if (!n) { console.error('엔진 <script src="canvas-motion.js"> 가 없음 — 페이지에 먼저 적어 두고 다시 돌린다.'); process.exit(1); }
fs.writeFileSync(file, s);
console.log(`${file}: 엔진 ${n}개 넣음`);
