#!/usr/bin/env node
/* slop_check — 지은 페이지에 AI 기본 룩이 남았는지 본다 (의존성 0, 브라우저 없음).
 * 사용: node slop_check.mjs <page.html> [--allow '#hex,#hex']
 * HTML 과 그 안의 <style>·style="" 만 읽는다. 바깥 CSS 파일은 같은 폴더에 있으면 같이 읽는다.
 * 걸린 것이 하나라도 있으면 exit 1. 「통과 = 좋은 디자인」은 아니다. 「걸림 = 기본값이 남았다」다.
 *   G1 보라·파랑 그라데이션   G2 이모지를 표시·아이콘으로 씀   G3 프레임워크 기본 팔레트 색
 *   G4 Inter·Space Grotesk 기본 글꼴   G5 크림 바탕 + 테라코타 강조
 *   G6 카드 남용(테두리·그림자 + 둥근 모서리 상자가 화면 곳곳에. HTML 에 적힌 것만 센다. 일부러 카드 격자면 --allow 'g6')
 * 가운데 정렬 남용은 정적 분석으로 믿을 만하게 못 재서 검사하지 않는다(눈으로 본다).
 */
import fs from 'node:fs';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
if (!file) { console.error('사용: node slop_check.mjs <page.html> [--allow \'#hex,#hex\']'); process.exit(2); }
const ai = args.indexOf('--allow');
const allow = new Set(ai >= 0 ? String(args[ai + 1] || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean) : []);

const html = fs.readFileSync(file, 'utf8');
let css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
css += '\n' + [...html.matchAll(/style=["']([^"']*)["']/gi)].map((m) => m[1]).join(';\n');
for (const m of html.matchAll(/<link[^>]+href=["']([^"']+\.css)["']/gi)) {
  if (/^https?:/.test(m[1])) continue;
  try { css += '\n' + fs.readFileSync(resolve(dirname(file), m[1]), 'utf8'); } catch {}
}
const text = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');

// 색 읽기
function parseColor(s) {
  s = s.trim().toLowerCase();
  let m = /^#([0-9a-f]{3,8})$/.exec(s);
  if (m) {
    let h = m[1]; if (h.length === 3 || h.length === 4) h = [...h.slice(0, 3)].map((c) => c + c).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(s);
  if (m) return [+m[1], +m[2], +m[3]];
  return null;
}
function hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const colorsIn = (s) => (s.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g) || []).map((x) => ({ raw: x, c: parseColor(x) })).filter((x) => x.c);

const hits = [];

// G1 보라·파랑 그라데이션: 진한 보라~파랑 색이 둘 이상 든 그라데이션
for (const m of css.matchAll(/(?:linear|radial|conic)-gradient\(((?:[^()]|\([^()]*\))*)\)/gi)) {
  const cs = colorsIn(m[1]).filter(({ c }) => { const [h, s, l] = hsl(c); return h >= 220 && h <= 300 && s >= 0.35 && l >= 0.25 && l <= 0.8; });
  if (cs.length >= 2) { hits.push(['G1', '보라·파랑 그라데이션', cs.map((x) => hex(x.c)).join(' → ')]); break; }
}

// G2 이모지를 제목·아이콘 자리에 씀
const EP = '\\p{Extended_Pictographic}';
const inHead = [...text.matchAll(new RegExp(`<h[1-6][^>]*>[^<]*${EP}`, 'giu'))].length;
const iconOnly = [...text.matchAll(new RegExp(`>\\s*(?:${EP}[\\uFE0F\\u200D]*){1,3}\\s*<`, 'gu'))].length;
if (inHead + iconOnly > 0) hits.push(['G2', '이모지를 표시·아이콘으로 씀', `제목 안 ${inHead}곳 · 이모지만 든 칸 ${iconOnly}곳`]);

// G3 프레임워크 기본 팔레트 (Tailwind 500·600·700 의 보라·파랑·초록·분홍 + 흔한 보라 그라데이션 쌍)
const DEFAULTS = {
  '#6366f1': 'indigo-500', '#4f46e5': 'indigo-600', '#4338ca': 'indigo-700',
  '#3b82f6': 'blue-500', '#2563eb': 'blue-600', '#1d4ed8': 'blue-700',
  '#8b5cf6': 'violet-500', '#7c3aed': 'violet-600', '#a855f7': 'purple-500', '#9333ea': 'purple-600',
  '#10b981': 'emerald-500', '#059669': 'emerald-600', '#047857': 'emerald-700',
  '#22c55e': 'green-500', '#16a34a': 'green-600', '#ec4899': 'pink-500', '#db2777': 'pink-600',
  '#667eea': '흔한 보라 그라데이션', '#764ba2': '흔한 보라 그라데이션',
};
const found = new Map();
for (const { c } of colorsIn(css)) { const h = hex(c); if (DEFAULTS[h] && !allow.has(h)) found.set(h, DEFAULTS[h]); }
if (found.size) hits.push(['G3', '프레임워크 기본 팔레트 색', [...found].map(([h, n]) => `${h}(${n})`).join(' ')]);

// G4 기본 글꼴
const fams = [...css.matchAll(/font-family\s*:\s*([^;}]+)/gi)].map((m) => m[1]);
const lazy = [...new Set(fams.flatMap((f) => (f.match(/\b(Inter|Space Grotesk)\b/gi) || [])))];
if (lazy.length) hits.push(['G4', '기본으로 고른 글꼴', lazy.join(', ')]);

// G5 크림 바탕 + 테라코타 강조
const bgs = [...css.matchAll(/background(?:-color)?\s*:\s*([^;}]+)/gi)].flatMap((m) => colorsIn(m[1]));
const cream = bgs.find(({ c }) => { const [h, s, l] = hsl(c); return h >= 20 && h <= 55 && s >= 0.2 && l >= 0.9 && l < 0.995; });
const terra = colorsIn(css).find(({ c }) => { const [h, s, l] = hsl(c); return h >= 8 && h <= 28 && s >= 0.45 && l >= 0.35 && l <= 0.7; });
if (cream && terra) hits.push(['G5', '크림 바탕 + 테라코타 강조', `${hex(cream.c)} + ${hex(terra.c)}`]);

// G6 카드 남용: 둥근 모서리에 테두리나 그림자를 두른 상자 클래스를 찾아, HTML 에 그 클래스를 단 요소를 센다.
// 버튼·입력·칩·배지·아바타처럼 원래 작은 상자인 것과 알약 모양(999px·50%)은 뺀다. 스크립트가 만드는 요소는 못 센다.
const SMALL = /btn|button|input|chip|tag|badge|pill|avatar|toggle|switch|dot|icon|fab|kbd|code/i;
const boxCls = new Set();
for (const m of css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
  const sel = m[1].trim(), d = m[2];
  const rad = /border-radius\s*:\s*([^;]+)/i.exec(d);
  if (!rad || /999|50%|100%/.test(rad[1]) || parseFloat(rad[1]) < 6) continue;
  const line = /(?:^|;)\s*border(?:-(?:top|bottom|left|right))?\s*:\s*[^;]*\d(?:\.\d+)?px[^;]*(?:solid|dashed)/i.test(d);
  const shadow = /box-shadow\s*:\s*(?!\s*none)[^;]*\d/i.test(d);
  if (!line && !shadow) continue;
  for (const part of sel.split(',')) {
    if (/:hover|:focus|:active/.test(part)) continue;
    const last = part.trim().split(/[\s>+~]+/).pop() || '';
    for (const c of last.match(/\.[\w-]+/g) || []) if (!SMALL.test(c)) boxCls.add(c.slice(1));
  }
}
let boxEls = 0;
for (const m of text.matchAll(/class=["']([^"']+)["']/gi)) if (m[1].split(/\s+/).some((c) => boxCls.has(c))) boxEls++;
if (!allow.has('g6') && (boxEls >= 8 || (boxCls.size >= 4 && boxEls >= 5))) hits.push(['G6', '카드 남용', `상자 클래스 ${boxCls.size}종(${[...boxCls].slice(0, 5).join(', ')}) · 상자 ${boxEls}개. 가장 중요한 하나만 카드로 두고 나머지는 여백·구분선으로 묶는다`]);

console.log(`■ ${file}`);
for (const [id, name] of [['G1', '보라·파랑 그라데이션'], ['G2', '이모지를 표시·아이콘으로 씀'], ['G3', '프레임워크 기본 팔레트 색'], ['G4', '기본으로 고른 글꼴'], ['G5', '크림 바탕 + 테라코타 강조'], ['G6', '카드 남용']]) {
  const h = hits.find((x) => x[0] === id);
  console.log(`  [${id} ${name}] ${h ? '걸림 — ' + h[2] : '없음'}`);
}
console.log(hits.length ? `  → ${hits.length}개 걸림. DESIGN.md 의 값으로 바꾸고 다시 돌린다.` : '  → 걸린 것 없음 (가운데 정렬은 눈으로 확인)');
process.exit(hits.length ? 1 : 0);
