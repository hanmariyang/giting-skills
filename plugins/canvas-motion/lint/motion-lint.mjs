#!/usr/bin/env node
/* motion-lint — canvas-motion 규율 자가 점검기 (의존성 0).
 * 사용: node motion-lint.mjs <file.html> [<file2.html> ...]
 * R1 reduced-motion 처리(필수) · R2 애니 라이브러리 금지(필수) · R3 rAF 존재(필수)
 * R4 DPR 대응(권고) · R5 고정 timestep(권고) · R6 아이소면 깊이 정렬(조건부 권고) · R7 시드 고정(권고)
 */
import fs from 'node:fs';

const ANIM_LIBS = [
  [/\bgsap\b|greensock|ScrollTrigger/i, 'GSAP'],
  [/lottie(-web)?|bodymovin/i, 'Lottie'],
  [/framer-motion|["']framer["']/i, 'Framer Motion'],
  [/\banime(\.min)?\.js|animejs/i, 'anime.js'],
  [/velocity(\.min)?\.js/i, 'Velocity'],
  [/@?theatre|theatre\.js/i, 'Theatre.js'],
  [/matter\.js|matter-js/i, 'Matter.js'],
  [/pixi(\.min)?\.js|pixijs/i, 'PixiJS'],
  [/p5(\.min)?\.js/i, 'p5.js']
];

function lint(file) {
  const src = fs.readFileSync(file, 'utf8');
  const has = (re) => re.test(src);
  const findings = [];
  const R = (id, sev, msg) => findings.push({ id, sev, msg });

  // R1 reduced-motion (필수) — CM.loop 은 내부에서 처리하므로 통과로 본다.
  if (!has(/prefers-reduced-motion/i) && !has(/CM\.loop/)) R('R1', 'critical', 'reduced-motion 처리 없음 — 직접 rAF 를 쓰면 prefers-reduced-motion 에서 정지 프레임을 그려라 (CM.loop 를 쓰면 자동 처리).');

  // R2 애니 라이브러리 (필수)
  for (const [re, name] of ANIM_LIBS) if (has(re)) R('R2', 'critical', `애니 라이브러리 감지: ${name} — canvas-motion 은 순수 Canvas 2D + rAF (라이브러리 0).`);

  // R3 rAF 존재 (모션이면 필수)
  const usesCanvas = has(/getContext\(\s*['"]2d['"]\s*\)|<canvas/i);
  if (usesCanvas && !has(/requestAnimationFrame|CM\.loop/)) R('R3', 'critical', 'canvas 는 있는데 requestAnimationFrame(또는 CM.loop) 이 없음 — 모션 루프가 없다.');

  // R4 DPR (권고)
  if (usesCanvas && !has(/devicePixelRatio|setupCanvas/)) R('R4', 'advisory', 'DPR 대응 없음 — 레티나에서 흐릿. CM.setupCanvas 또는 devicePixelRatio 스케일 권장.');

  // R5 고정 timestep (권고)
  if (has(/requestAnimationFrame/) && !has(/CM\.loop/) && !has(/while\s*\([^)]*(acc|accumulator)[^)]*(>=|>)/i)) R('R5', 'advisory', '고정 timestep(누산기) 흔적 없음 — 시뮬은 프레임레이트에 독립적이어야 폭주 안 함. CM.loop 권장.');

  // R6 아이소면 깊이 정렬 (조건부)
  const iso = has(/CM\.iso|isoBox|\(x-y\)\s*\*|아이소/i);
  if (iso && !has(/drawList|\.sort\(/)) R('R6', 'advisory', '아이소 투영 흔적이 있는데 깊이 정렬(drawList/sort) 없음 — 가림이 깨질 수 있음(depth=x+y).');

  // R7 시드 (권고, 시뮬)
  const sim = has(/steer|boid|spatialHash|astar|makeNoise|flowField/i);
  if (sim && !has(/CM\.rng|rng\(|mulberry|seed/i)) R('R7', 'advisory', '창발 시뮬 흔적이 있는데 시드 고정 없음 — rng(seed) 로 결정적이게(재현·검증).');

  return findings;
}

const files = process.argv.slice(2);
if (!files.length) { console.error('사용: node motion-lint.mjs <file.html> ...'); process.exit(1); }
let crit = 0;
for (const f of files) {
  const fx = lint(f);
  const c = fx.filter(x => x.sev === 'critical').length, a = fx.length - c;
  console.log(`\n■ ${f}  —  필수위반 ${c} · 권고 ${a}`);
  for (const x of fx) console.log(`  [${x.id} ${x.sev === 'critical' ? '필수' : '권고'}] ${x.msg}`);
  if (!fx.length) console.log('  ✅ 규율 통과');
  crit += c;
}
process.exit(crit ? 1 : 0);
