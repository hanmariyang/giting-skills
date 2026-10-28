#!/usr/bin/env node
// 자막 싱크 검사·교정. SRT·VTT 를 공개 자막 가이드 기준으로 재고, 기계로 고칠 수 있는 것은 고친다.
//
//   node capsync.mjs <자막.srt|.vtt> [--fps 24] [--profile netflix-ko|shorts]
//                    [--cuts 컷.txt] [--speech 말.txt|whisper.json] [--avoid 화면글자.txt]
//                    [-o 고친.srt] [--json]
//
// 기준 숫자의 출처는 이 파일 아래 PROFILES 에 하나하나 적었다. 출처 없는 값은 「우리가 정한 값」이라고 적었다.
// 의존성 없음. Node 22 이상.
//
// 끝 코드: 0 = 남은 문제 없음 · 1 = 남은 문제 있음 · 2 = 실행 못 함
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { extname } from 'node:path';

// ── 기준 ──────────────────────────────────────────────
// NF-KO  = Netflix Korean Timed Text Style Guide (partnerhelp.netflixstudios.com 216001127)
// NF-GEN = Netflix Timed Text Style Guide: General Requirements (215758617)
// NF-TIM = Netflix Timed Text Style Guide: Subtitle Timing Guidelines (360051554394)
const PROFILES = {
  'netflix-ko': {
    label: '넷플릭스 한국어 (성인)',
    lineMax: 16,        // NF-KO I.2  한 줄 16자, 라틴·공백·문장부호는 0.5자
    maxLines: 2,        // NF-KO I.11 최대 두 줄, 넘칠 때만 두 줄
    cps: 12,            // NF-KO I.15 성인 초당 12자 (어린이 9)
    minDur: 5 / 6,      // NF-GEN     최소 5/6초 (24fps 에서 20프레임)
    maxDur: 7,          // NF-GEN     최대 7초
    gapF: 2,            // NF-TIM 5   자막 사이 최소 2프레임
    closeSec: 0.5,      // NF-TIM 5   3~11프레임(24fps, 반 초 미만) 틈은 2프레임으로 붙인다
    shotSec: 0.5,       // NF-TIM 2   컷 뒤 반 초 안에 말이 시작되면 컷 첫 프레임에서 시작
    tailSec: 0.5,       // NF-TIM 1   나가는 점은 말이 끝난 뒤 반 초 이상이 좋다
    inTolF: 2,          // NF-TIM 1   들어오는 점은 말 첫 프레임에서 1~2프레임 안
  },
  'shorts': {
    label: '쇼츠·릴스 (우리가 정한 값)',
    // 세로 영상 한가운데 큰 글자 한 줄. 공개 기준 문서가 없어 우리가 정했다. 타이밍은 넷플릭스와 같다.
    lineMax: 14, maxLines: 1, cps: 12, minDur: 5 / 6, maxDur: 4,
    gapF: 2, closeSec: 0.5, shotSec: 0.5, tailSec: 0.3, inTolF: 2,
  },
};

const RULES = {
  OFFSET: '전체 밀림', IN: '인 점', TAIL: '꼬리', MIN: '최소 노출', MAX: '최대 노출',
  SHOT_IN: '컷 맞춤(들어옴)', SHOT_OUT: '컷 맞춤(나감)', GAP: '겹침·빈틈 2프레임 미만', CLOSE: '붙일 틈',
  CPS: '읽기 속도', LINE: '한 줄 길이', LINES: '줄 수', BREAK: '줄 나눔', PUNCT: '줄 끝 마침표·쉼표',
  ELLIPSIS: '말줄임표', DASH: '겹친 말 표기', AVOID: '화면 글자 가림', EMPTY: '빈 자막',
};

// ── 인자 ──────────────────────────────────────────────
const argv = process.argv.slice(2);
if (!argv.length || argv[0] === '-h' || argv[0] === '--help') {
  console.log(`자막 싱크 검사·교정

  node capsync.mjs <자막.srt|.vtt> [옵션]

  --fps N          영상 프레임 수 (기본 24). 프레임으로 정한 기준을 초로 바꿀 때 쓴다
  --profile 이름   netflix-ko(기본) · shorts
  --cuts 파일      컷 시각 한 줄에 하나 (12.5 · 00:00:12.500 · 00:00:12:12)
  --speech 파일    말 구간 「시작 끝」 한 줄에 하나, 또는 Whisper JSON(단어 시각)
  --avoid 파일     화면 아래에 글자가 뜨는 구간 「시작 끝」 → 그 자막은 위로 올린다
  -o 파일          고친 자막을 쓴다. 없으면 재기만 한다
  --json           결과를 JSON 으로

  예) node capsync.mjs ai.srt
      node capsync.mjs ai.srt --fps 30 --cuts cuts.txt --speech words.json -o fixed.srt`);
  process.exit(0);
}
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const fail = (m) => { console.error(m); process.exit(2); };
const SRC = argv[0];
if (!existsSync(SRC)) fail(`파일이 없다: ${SRC}`);
const FPS = Number(opt('--fps', 24));
if (!(FPS > 0)) fail('--fps 는 양수여야 한다');
const PNAME = opt('--profile', 'netflix-ko');
const P = PROFILES[PNAME];
if (!P) fail(`모르는 프로필: ${PNAME} (netflix-ko · shorts)`);
const OUT = opt('-o', null);
const JSON_OUT = argv.includes('--json');

const F = 1 / FPS;                  // 한 프레임(초)
const GAP = P.gapF * F;
const CLOSE = P.closeSec - F / 2;   // 반 초 「미만」 (24fps 에서 11프레임까지)
const EPS = F / 4;

// ── 시각 읽기 ─────────────────────────────────────────
function parseTime(s) {
  s = String(s).trim();
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
  let m = s.match(/^(?:(\d+):)?(\d+):(\d+)[.,](\d+)$/);
  if (m) return (+(m[1] || 0)) * 3600 + (+m[2]) * 60 + (+m[3]) + Number('0.' + m[4]);
  m = s.match(/^(\d+):(\d+):(\d+):(\d+)$/);           // 타임코드 HH:MM:SS:FF
  if (m) return (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4]) / FPS;
  return NaN;
}
const pad = (n, w = 2) => String(n).padStart(w, '0');
function fmtTime(t, vtt) {
  t = Math.max(0, Math.round(t * 1000));
  const h = Math.floor(t / 3600000), m = Math.floor(t / 60000) % 60, s = Math.floor(t / 1000) % 60, ms = t % 1000;
  return `${pad(h)}:${pad(m)}:${pad(s)}${vtt ? '.' : ','}${pad(ms, 3)}`;
}
const snapF = (t) => Math.round(t * FPS) / FPS;    // 프레임 경계에 맞춘다

// ── 자막 파일 ─────────────────────────────────────────
const raw = readFileSync(SRC, 'utf8').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
const IS_VTT = /^WEBVTT/.test(raw) || extname(SRC).toLowerCase() === '.vtt';
function parseSubs(text) {
  const out = [];
  let header = '';
  let blocks = text.split(/\n{2,}/);
  if (IS_VTT) { header = blocks.shift(); }
  for (const b of blocks) {
    const lines = b.split('\n').filter((l, i, a) => !(i === a.length - 1 && l === ''));
    const ti = lines.findIndex((l) => l.includes('-->'));
    if (ti < 0) { if (IS_VTT && b.trim()) out.push({ passthrough: b }); continue; }
    const [a, rest] = lines[ti].split('-->');
    const restParts = rest.trim().split(/\s+/);
    const start = parseTime(a), end = parseTime(restParts[0]);
    if (Number.isNaN(start) || Number.isNaN(end)) fail(`시각을 못 읽었다: ${lines[ti]}`);
    out.push({ id: ti > 0 ? lines.slice(0, ti).join('\n') : null, start, end,
      settings: restParts.slice(1).join(' '), lines: lines.slice(ti + 1) });
  }
  return { header, cues: out };
}
const { header, cues: ALL } = parseSubs(raw);
const cues = ALL.filter((c) => !c.passthrough);
if (!cues.length) fail('자막을 하나도 못 읽었다 (SRT·VTT 만)');
cues.forEach((c, i) => { c.n = i + 1; c.s0 = c.start; c.e0 = c.end; });
const VTT_EXTRA = ALL.filter((c) => c.passthrough).map((c) => c.passthrough);   // NOTE·STYLE·REGION 은 그대로 둔다

function readRanges(file) {
  if (!file) return null;
  if (!existsSync(file)) fail(`파일이 없다: ${file}`);
  const s = readFileSync(file, 'utf8');
  if (/^\s*[\[{]/.test(s)) {                          // Whisper 계열 JSON: 단어 시각을 말 구간으로 묶는다
    const j = JSON.parse(s), words = [];
    const segs = Array.isArray(j) ? j : (j.segments || []);
    for (const g of segs) for (const w of (g.words || [g])) if (w.start != null && w.end != null) words.push([+w.start, +w.end]);
    words.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const w of words) { const L = merged[merged.length - 1]; if (L && w[0] - L[1] < 0.25) L[1] = Math.max(L[1], w[1]); else merged.push([...w]); }
    return merged;
  }
  return s.split('\n').map((l) => l.replace(/#.*/, '').trim()).filter(Boolean).map((l) => {
    const [a, b] = l.split(/\s*(?:-->|~|,(?=\s)|\s)\s*/).filter(Boolean);
    return [parseTime(a), b == null ? NaN : parseTime(b)];
  }).filter((r) => !Number.isNaN(r[0]));
}
const cutsRaw = readRanges(opt('--cuts', null));
// 컷은 늘 프레임 경계에서 일어난다. 소수 초로 받은 컷도 가장 가까운 프레임에 놓고 센다
const CUTS = cutsRaw ? cutsRaw.map((r) => snapF(r[0])).sort((a, b) => a - b) : null;
const SPEECH = readRanges(opt('--speech', null));
const AVOID = readRanges(opt('--avoid', null));
if (SPEECH && SPEECH.some((r) => Number.isNaN(r[1]))) fail('--speech 는 줄마다 「시작 끝」 두 시각이 있어야 한다');
if (AVOID && AVOID.some((r) => Number.isNaN(r[1]))) fail('--avoid 는 줄마다 「시작 끝」 두 시각이 있어야 한다');

// ── 글자 셈 ───────────────────────────────────────────
const UNIT = /^(원|개|명|분|초|시|일|월|년|번|살|층|권|장|대|%|배|퍼센트|시간|주|달|km|kg|m|cm|g)/;
const stripTags = (s) => s.replace(/<[^>]+>/g, '').replace(/\{\\[^}]*\}/g, '');
// NF-KO I.2: 한글·한자·가나는 1, 라틴·숫자·공백·문장부호는 0.5
const weight = (s) => [...stripTags(s)].reduce((n, ch) => n + (/[ᄀ-ᇿ぀-ヿ㄰-㆏㐀-鿿가-힯豈-﫿]/.test(ch) ? 1 : 0.5), 0);
const textOf = (c) => c.lines.map(stripTags).reduce((s, l) => !s ? l.trim() : /\d$/.test(s) && UNIT.test(l.trim()) ? s + l.trim() : s + ' ' + l.trim(), '').replace(/\s+/g, ' ').trim();
const isDash = (c) => c.lines.length === 2 && c.lines.every((l) => /^\s*-/.test(stripTags(l)));
const lead = (l) => (l.match(/^(\{\\[^}]*\})+/) || [''])[0];

// ── 재기 ──────────────────────────────────────────────
function measure(cs) {
  const issues = [];
  const add = (rule, c, msg) => issues.push({ rule, n: c ? c.n : null, at: c ? c.start : null, msg });
  // 전체 밀림
  const o0 = SPEECH ? estimateOffset(cs) : null, OFF = o0 && Math.abs(o0.off) > P.inTolF * F + EPS ? o0 : null;
  if (OFF) { const o = OFF; add('OFFSET', null, `자막 전체가 말보다 ${o.off > 0 ? '늦다' : '빠르다'} ${Math.abs(o.off).toFixed(2)}초 (맞춰 볼 수 있던 ${o.k}/${cs.length}개 기준)`); }
  cs.forEach((c, i) => {
    const d = c.end - c.start, txt = textOf(c), next = cs[i + 1];
    if (!txt) add('EMPTY', c, '글자가 없다');
    if (d < P.minDur - EPS) add('MIN', c, `${d.toFixed(2)}초 (최소 ${P.minDur.toFixed(2)})`);
    if (d > P.maxDur + EPS) add('MAX', c, `${d.toFixed(2)}초 (최대 ${P.maxDur})`);
    if (next) {
      const g = next.start - c.end;
      if (g < GAP - EPS) add('GAP', c, g < 0 ? `다음 자막과 ${(-g).toFixed(2)}초 겹친다` : `다음 자막과 ${+(g * FPS).toFixed(1)}프레임 (최소 ${P.gapF})`);
      else if (g > GAP + EPS && g < CLOSE + EPS && !(CUTS && cutBetween(c.end, next.start - GAP) != null)) add('CLOSE', c, `다음 자막까지 ${Math.round(g * FPS)}프레임 빈틈 → ${P.gapF}프레임으로 붙일 자리`);
    }
    const cps = weight(txt) / Math.max(d, F);
    if (cps > P.cps + 0.05) add('CPS', c, `초당 ${cps.toFixed(1)}자 (최대 ${P.cps}) · 「${txt}」`);
    const plain = c.lines.map(stripTags);
    plain.forEach((l) => { if (weight(l) > P.lineMax) add('LINE', c, `한 줄 ${weight(l)}자 (최대 ${P.lineMax}) · 「${l}」`); });
    if (plain.length > P.maxLines) add('LINES', c, `${plain.length}줄 (최대 ${P.maxLines})`);
    else if (plain.length > 1 && !isDash(c) && weight(plain.join(' ')) <= P.lineMax) add('BREAK', c, '한 줄에 들어가는데 두 줄로 나눴다');
    else if (plain.length === 2 && !isDash(c) && badBreak(plain[0], plain[1])) add('BREAK', c, `나눈 자리가 어색하다 · 「${plain[0]} / ${plain[1]}」`);
    if (plain.some((l) => /[.,]\s*$/.test(l) && !/\.\.\.$|…$/.test(l))) add('PUNCT', c, '줄 끝에 마침표나 쉼표');
    if (plain.some((l) => /\.\.\./.test(l))) add('ELLIPSIS', c, '점 세 개 대신 말줄임표 한 글자(…)');
    if (plain.length === 2 && plain.every((l) => /^\s*-/.test(l)) && plain.some((l) => !/^\s*- \S/.test(l))) add('DASH', c, '두 사람 말은 줄마다 「- 」(하이픈 뒤 한 칸)');
    if (AVOID && overlapsAvoid(c) && !isTop(c)) add('AVOID', c, '화면 아래 글자와 겹친다 → 위로');
    if (CUTS) {
      const pre = CUTS.filter((x) => x <= c.start + EPS && c.start - x < P.shotSec - EPS && c.start - x > EPS).pop();
      const prevC = cs[i - 1];
      if (pre != null && (!prevC || pre >= prevC.end + GAP - EPS)) add('SHOT_IN', c, `컷(${pre.toFixed(2)}) 뒤 ${Math.round((c.start - pre) * FPS)}프레임에 들어온다 → 컷 첫 프레임으로`);
      const post = CUTS.find((x) => x > c.end - EPS && x - c.end < P.shotSec - EPS);
      const room = next ? next.start : Infinity;
      if (post != null && Math.abs(post - GAP - c.end) > EPS && post - GAP <= room - GAP + EPS) add('SHOT_OUT', c, `컷(${post.toFixed(2)}) 바로 앞에서 나간다 → 컷 ${P.gapF}프레임 앞까지`);
    }
    if (SPEECH) {
      const on = nearestOnset(c.start);
      const explained = OFF && Math.abs((c.start - on) - OFF.off) <= 3 * F + EPS;
      if (on != null && !explained && !midSpeech(c.start) && Math.abs(on - c.start) > P.inTolF * F + EPS && Math.abs(on - c.start) < 0.5 && !cutSnapped(c)) add('IN', c, `말 시작(${on.toFixed(2)})과 ${Math.round((c.start - on) * FPS)}프레임 어긋남`);
      const sp = speechIn(c);
      if (sp) { const want = sp[1] + P.tailSec, lim = next ? next.start - GAP : Infinity; if (c.end < Math.min(want, lim) - F / 2 && c.end - sp[1] < P.tailSec - F / 2) add('TAIL', c, `말 끝(${sp[1].toFixed(2)}) 뒤 ${(c.end - sp[1]).toFixed(2)}초에 사라진다 (권장 ${P.tailSec}초)`); }
    }
  });
  return issues;
}
const isTop = (c) => c.lines.some((l) => /\{\\an[789]\}/.test(l)) || /line:\s*-?\d+%?/.test(c.settings) && /line:(0|[0-9]%|1[0-9]%)/.test(c.settings);
const overlapsAvoid = (c) => AVOID.some(([a, b]) => c.start < b && c.end > a);
const nearestOnset = (t) => { let best = null; for (const [a] of SPEECH) if (Math.abs(a - t) < 1 && (best == null || Math.abs(a - t) < Math.abs(best - t))) best = a; return best; };
// 꼬리는 자막이 덮는 말 가운데 마지막 구간의 끝을 본다
const speechIn = (c) => { let best = null; for (const r of SPEECH) if (Math.min(c.end, r[1]) - Math.max(c.start, r[0]) > F && (!best || r[1] > best[1])) best = r; return best; };
const cutBetween = (a, b) => CUTS ? CUTS.find((x) => x > a + EPS && x < b + GAP - EPS) : undefined;
// 이어지는 말 가운데서 시작하는 자막(긴 말을 나눈 뒤쪽)은 인 점을 말 시작에 맞출 대상이 아니다
const midSpeech = (t) => SPEECH.some(([a, b]) => t > a + 0.5 && t < b);
const cutSnapped = (c) => CUTS && CUTS.some((x) => Math.abs(x - c.start) < EPS);
function estimateOffset(cs) {
  const diffs = [];
  for (const c of cs) { const on = nearestOnset(c.start); if (on != null) diffs.push(c.start - on); }
  if (diffs.length < 3) return null;
  diffs.sort((a, b) => a - b);
  const med = diffs[Math.floor(diffs.length / 2)];
  const k = diffs.filter((d) => Math.abs(d - med) <= 3 * F + EPS).length;
  if (k / cs.length < 0.6) return null;                 // 절반 넘게 같은 만큼 밀려야 「전체가 밀렸다」고 본다
  return { off: med, k };
}

// ── 줄 나눔 ───────────────────────────────────────────
const CLAUSE_END = /(마다|에서|까지|부터|는데|니까|지만|려고|면서|[고서면데])$/;
const DEP_NOUN = /^(것|거|게|데|때|수|줄|적|뿐|만큼|대로)/;
function badBreak(a, b) {
  const wa = weight(a), wb = weight(b);
  if (/\d$/.test(a.trim()) && UNIT.test(b.trim())) return true;              // 3 / 분
  if (a.trim().split(/\s+/).length === 1 && wa <= 2 && wb > 6) return true;   // 위가 한 어절 한두 글자
  if (b.trim().split(/\s+/).length === 1 && wb <= 2 && wa > 6) return true;   // 아래가 한두 글자
  return false;
}
// 두 줄로 나눌 자리를 고른다. 둘 다 lineMax 안, 쉼표 뒤를 우선, 길이가 고르게(아래가 조금 긴 쪽).
function bestBreak(text) {
  const words = text.split(' ');
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
    const wa = weight(a), wb = weight(b);
    if (wa > P.lineMax || wb > P.lineMax) continue;
    let score = Math.abs(wa - wb) + (wa > wb ? 0.5 : 0);
    if (/[,，]$/.test(a)) score -= 3;
    if (CLAUSE_END.test(a)) score -= 1.5;               // 「~고 / ~면 / ~마다」 뒤는 숨 쉬는 자리
    if (/(라는|하는|다는|되는|있는|없는|[을를]|[ㄹ]|던)$/.test(a) && DEP_NOUN.test(b)) score += 6;  // 「다른 거라는 / 것」처럼 꾸밈말과 받는 말을 떼지 않는다
    { const ch = a.slice(-1).charCodeAt(0) - 0xAC00; if (ch >= 0 && ch < 11172 && ch % 28 === 8 && !/[을를]$/.test(a)) score += 1; }  // 「맡길 / 때마다」 같은 ㄹ 꾸밈
    if (badBreak(a, b)) score += 20;
    if (!best || score < best.score) best = { a, b, score };
  }
  return best;
}
// 한 단위에 안 들어가는 글을 여러 자막으로 쪼갠다. 문장 끝 → 쉼표 → 띄어쓰기 순으로 자른다.
function chunks(text, cap) {
  // 고르게 반으로 가르기를 되풀이한다. 한쪽만 꽉 채우면 뒤 조각이 한두 어절로 남아 너무 짧게 뜬다
  if (weight(text) <= cap) return [text];
  const words = text.split(' ');
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
    const s = Math.abs(weight(a) - weight(b)) + (/[.?!…]$/.test(a) ? -cap / 2 : /[,，]$/.test(a) ? -cap / 4 : 0) + (badBreak(a, b) ? cap : 0);
    if (!best || s < best.s) best = { a, b, s };
  }
  if (!best) return [text];                            // 띄어쓰기 없이 긴 낱말: 더 못 자른다
  return [...chunks(best.a, cap), ...chunks(best.b, cap)];
}

// ── 고치기 ────────────────────────────────────────────
// 순서가 중요하다: 전체 밀기 → 인 점·컷 → 줄 → 길이(최소·꼬리·컷 앞) → 빈틈 → 겹침
function fix(cs) {
  const log = [];
  for (const c of cs) { c.start = snapF(c.start); c.end = snapF(c.end); }   // 처음부터 프레임 위에서 셈한다
  const note = (rule, c, msg) => log.push({ rule, n: c.n, msg });
  // 1) 전체 밀기
  if (SPEECH) {
    const o = estimateOffset(cs);
    if (o && Math.abs(o.off) > P.inTolF * F + EPS) { cs.forEach((c) => { c.start -= o.off; c.end -= o.off; }); log.push({ rule: 'OFFSET', n: null, msg: `전부 ${o.off > 0 ? '앞으로' : '뒤로'} ${Math.abs(o.off).toFixed(2)}초` }); }
  }
  // 2) 글: 말줄임표·줄 끝 문장부호·겹친 말 표기
  for (const c of cs) {
    c.lines = c.lines.map((l) => {
      let L = l;
      if (/\.\.\./.test(L)) { L = L.replace(/\.{3,}/g, '…'); note('ELLIPSIS', c, '… 로'); }
      if (/[.,]\s*$/.test(L) && !/…\s*$/.test(L)) { L = L.replace(/[.,]+\s*$/, ''); note('PUNCT', c, '줄 끝 문장부호 뺌'); }
      if (/^(\{\\[^}]*\})*\s*-\s*\S/.test(L) && c.lines.length === 2 && c.lines.every((x) => /^\s*-/.test(stripTags(x)))) {
        const fixed = L.replace(/^((?:\{\\[^}]*\})*)\s*-\s*/, '$1- ');
        if (fixed !== L) { note('DASH', c, '「- 」 표기'); L = fixed; }
      }
      return L;
    });
  }
  // 3) 줄 나눔·쪼개기 (겹친 말은 손대지 않는다)
  const outCues = [];
  for (const c of cs) {
    if (isDash(c)) { outCues.push(c); continue; }
    const tag = lead(c.lines[0] || '');
    const text = textOf(c);
    const plain = c.lines.map(stripTags);
    const needs = plain.some((l) => weight(l) > P.lineMax) || plain.length > P.maxLines
      || (plain.length > 1 && weight(text) <= P.lineMax) || (plain.length === 2 && badBreak(plain[0], plain[1]));
    if (!needs) { outCues.push(c); continue; }
    if (weight(text) <= P.lineMax) { c.lines = [tag + text]; note('BREAK', c, '한 줄로'); outCues.push(c); continue; }
    if (P.maxLines >= 2) { const b = bestBreak(text); if (b) { c.lines = [tag + b.a, b.b]; note('BREAK', c, `「${b.a} / ${b.b}」`); outCues.push(c); continue; } }
    // 한 자막에 안 들어간다 → 여러 자막으로. 시간은 글자 수에 비례해 나눈다
    const cap = P.lineMax * P.maxLines;
    const parts = chunks(text, cap);
    if (parts.length < 2) { outCues.push(c); continue; }
    const tot = parts.reduce((n, p) => n + weight(p), 0), span = c.end - c.start;
    // 나눈 조각이 최소 노출보다 짧아지면 나누지 않는다. 글을 줄여야 하는 자막이라 남겨 두고 알린다
    if (parts.some((p) => span * weight(p) / tot - GAP < P.minDur - EPS)) { if (P.maxLines >= 2) { const b = bestBreak(text); if (b) c.lines = [tag + b.a, b.b]; } outCues.push(c); continue; }
    let t = c.start;
    parts.forEach((p, k) => {
      const e = k === parts.length - 1 ? c.end : snapF(t + span * weight(p) / tot);
      const nc = { ...c, start: t, end: k === parts.length - 1 ? e : e - GAP, lines: [], s0: NaN, e0: NaN };
      if (weight(p) <= P.lineMax) nc.lines = [tag + p];
      else { const b = bestBreak(p); nc.lines = b ? [tag + b.a, b.b] : [tag + p]; }
      outCues.push(nc);
      t = e;
    });
    note('LINE', c, `자막 ${parts.length}개로 나눔`);
  }
  cs = outCues;
  // 4) 시각
  cs.sort((a, b) => a.start - b.start);
  // 4-1) 들어오는 점: 말 시작에 먼저 맞추고, 컷 뒤 반 초 안이면 컷이 이긴다
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i], prev = cs[i - 1];
    if (SPEECH && !cutSnapped(c) && !midSpeech(c.start)) {
      const on = nearestOnset(c.start);
      if (on != null && Math.abs(on - c.start) > P.inTolF * F + EPS && Math.abs(on - c.start) < 0.5 && (!prev || on >= prev.end + GAP - EPS) && on < c.end - P.minDur) { note('IN', c, `${fmtTime(c.start)} → ${fmtTime(on)}`); c.start = on; }
    }
    if (CUTS) {
      const pre = CUTS.filter((x) => x <= c.start + EPS && c.start - x < P.shotSec - EPS && c.start - x > EPS).pop();
      if (pre != null && (!prev || pre >= prev.end + GAP - EPS)) { note('SHOT_IN', c, `${fmtTime(c.start)} → ${fmtTime(pre)}`); c.start = pre; }
    }
  }
  // 4-2) 나가는 점
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i], next = cs[i + 1], prev = cs[i - 1];
    const cap = (want) => { const x = cutBetween(c.end, want); return x != null && x - GAP > c.end ? Math.min(want, x - GAP) : x != null ? c.end : want; };
    const lim = next ? next.start - GAP : Infinity;
    // 꼬리: 말 끝 + tailSec 까지 (다음 자막 앞에서 멈춘다)
    if (SPEECH) {
      const sp = speechIn(c);
      if (sp) { const want = cap(Math.min(sp[1] + P.tailSec, lim, c.start + P.maxDur)); if (c.end < want - EPS && c.end - sp[1] < P.tailSec - EPS) { note('TAIL', c, `${fmtTime(c.end)} → ${fmtTime(want)}`); c.end = want; } }
    }
    // 최소 노출
    if (c.end - c.start < P.minDur - EPS) { const want = cap(Math.min(c.start + P.minDur, lim)); if (want > c.end + EPS) { note('MIN', c, `${(c.end - c.start).toFixed(2)} → ${(want - c.start).toFixed(2)}초`); c.end = want; } }
    // 읽기 속도: 빈 시간이 있으면 늘린다 (글을 줄이는 건 사람·AI 몫)
    const need = weight(textOf(c)) / P.cps;
    if (c.end - c.start < need - EPS) { const want = cap(Math.min(c.start + need, lim, c.start + P.maxDur)); if (want > c.end + EPS) { note('CPS', c, `${(c.end - c.start).toFixed(2)} → ${(want - c.start).toFixed(2)}초로 늘림`); c.end = want; } }
    // 컷 앞에서 나감: 반 초 안에 컷이 있으면 컷 2프레임 앞까지
    if (CUTS) {
      const post = CUTS.find((x) => x > c.end - EPS && x - c.end < P.shotSec - EPS);
      if (post != null) { const want = Math.min(post - GAP, lim); if (Math.abs(want - c.end) > EPS && want > c.start + P.minDur - EPS) { note('SHOT_OUT', c, `${fmtTime(c.end)} → ${fmtTime(want)}`); c.end = want; } }
    }
  }
  // 5) 빈틈 붙이기·겹침 풀기
  for (let i = 0; i < cs.length - 1; i++) {
    const c = cs[i], n = cs[i + 1], g = n.start - c.end;
    if (g > GAP + EPS && g < CLOSE + EPS && cutBetween(c.end, n.start - GAP) == null) { note('CLOSE', c, `${Math.round(g * FPS)}프레임 → ${P.gapF}`); c.end = n.start - GAP; }
    else if (g < GAP - EPS) { const want = n.start - GAP; if (want > c.start + F) { note('GAP', c, `${g < 0 ? '겹침' : Math.round(g * FPS) + '프레임'} → ${P.gapF}프레임`); c.end = want; } }
  }
  // 6) 화면 글자 피하기
  if (AVOID) for (const c of cs) if (overlapsAvoid(c) && !isTop(c)) {
    if (IS_VTT) c.settings = (c.settings.replace(/line:\S+/, '').trim() + ' line:10%').trim(); else c.lines[0] = '{\\an8}' + c.lines[0];
    note('AVOID', c, '위로 올림');
  }
  // 프레임 경계에 맞춘다. 넷플릭스 기준이 프레임 단위라 고친 파일은 모든 시각이 프레임 위에 있다
  for (const c of cs) { c.start = snapF(c.start); c.end = snapF(c.end); }
  cs.forEach((c, i) => { c.n = i + 1; });
  return { cs, log };
}

function serialize(cs) {
  if (IS_VTT) {
    const body = cs.map((c) => [c.id && !/^\d+$/.test(c.id) ? c.id : null, `${fmtTime(c.start, true)} --> ${fmtTime(c.end, true)}${c.settings ? ' ' + c.settings : ''}`, ...c.lines].filter((x) => x != null).join('\n'));
    return [header.trim(), ...VTT_EXTRA, ...body].join('\n\n') + '\n';
  }
  return cs.map((c, i) => [i + 1, `${fmtTime(c.start)} --> ${fmtTime(c.end)}`, ...c.lines].join('\n')).join('\n\n') + '\n';
}

// ── 실행 ──────────────────────────────────────────────
const count = (iss) => iss.reduce((m, x) => (m[x.rule] = (m[x.rule] || 0) + 1, m), {});
const before = measure(cues);
let after = null, fixed = null;
if (OUT) {
  const copy = cues.map((c) => ({ ...c, lines: [...c.lines] }));
  fixed = fix(copy);
  after = measure(fixed.cs);
  writeFileSync(OUT, serialize(fixed.cs));
}
const result = {
  file: SRC, profile: PNAME, fps: FPS, cues: cues.length,
  inputs: { cuts: !!CUTS, speech: !!SPEECH, avoid: !!AVOID },
  before: { total: before.length, byRule: count(before), issues: before },
  ...(OUT ? { after: { total: after.length, byRule: count(after), issues: after }, changes: fixed.log, out: OUT, cuesOut: fixed.cs.length } : {}),
};
if (JSON_OUT) { console.log(JSON.stringify(result, null, 2)); process.exit((OUT ? after : before).length ? 1 : 0); }

const line = (by) => Object.keys(RULES).filter((k) => by[k]).map((k) => `${RULES[k]} ${by[k]}`).join(' · ') || '없음';
console.log(`자막 싱크 · ${P.label} · ${FPS}fps · 자막 ${cues.length}개`);
const miss = [!CUTS && '컷(--cuts)', !SPEECH && '말 구간(--speech)'].filter(Boolean);
if (miss.length) console.log(`  안 잰 것   ${miss.join(' · ')} 이 없어 ${[!CUTS && '컷 맞춤', !SPEECH && '인 점·꼬리·전체 밀림'].filter(Boolean).join(', ')} 은 재지 않았다`);
console.log(`  고치기 전  ${before.length}건 · ${line(count(before))}`);
if (OUT) {
  console.log(`  고친 뒤    ${after.length}건 · ${line(count(after))}`);
  console.log(`  바꾼 것    ${fixed.log.length}건 → ${OUT} (자막 ${fixed.cs.length}개)`);
}
const show = (OUT ? after : before).slice(0, 30);
if (show.length) {
  console.log(OUT ? '\n남은 것 (기계로 못 고친 것)' : '\n찾은 것');
  for (const x of show) console.log(`  ${x.n ? '#' + String(x.n).padEnd(4) : '전체 '} ${RULES[x.rule].padEnd(8)} ${x.msg}`);
  if ((OUT ? after : before).length > show.length) console.log(`  … ${(OUT ? after : before).length - show.length}건 더 (--json 으로 전부)`);
}
process.exit((OUT ? after : before).length ? 1 : 0);
