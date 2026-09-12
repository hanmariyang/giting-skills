#!/usr/bin/env node
// Giting Skills — ui-menu 빌더 (의존성 0)
// demos/*.html 프래그먼트(<!-- @id h=NNN [full] --> 구분) + menu.json →
//   components/<id>.html (스킬용 자가완결 파일) + docs/ (갤러리·llms.txt)
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PLUGIN = join(ROOT, 'plugins', 'ui-menu');
const menu = JSON.parse(readFileSync(join(PLUGIN, 'menu.json'), 'utf8'));
const RAW = 'https://raw.githubusercontent.com/hanmariyang/giting-skills/main/plugins/ui-menu/components';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

// ── 1. 프래그먼트 파싱 ─────────────────────────────────────────
const frags = {}; // id → { h, full, body }
for (const f of readdirSync(join(PLUGIN, 'demos')).filter(f => f.endsWith('.html'))) {
  const src = readFileSync(join(PLUGIN, 'demos', f), 'utf8');
  const parts = src.split(/<!--\s*@([a-z0-9-]+)([^>]*?)-->/);
  for (let i = 1; i < parts.length; i += 3) {
    const id = parts[i], opts = parts[i + 1], body = parts[i + 2].trim();
    frags[id] = {
      h: Number((opts.match(/h=(\d+)/) || [])[1] || 180),
      full: /\bfull\b/.test(opts),
      body,
    };
  }
}
const missing = menu.items.filter(it => !frags[it.id]).map(it => it.id);
if (missing.length) { console.error('데모 없는 항목:', missing.join(', ')); process.exit(1); }

// ── 2. 컴포넌트 단독 파일 생성 ──────────────────────────────────
const BASE = `  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: #17171b; font-size: 13.5px; background: #fff; }
  .center { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 14px; }
  .cap { color: #9a9aa4; font-size: 11px; text-align: center; margin: 10px 0 0; }
  .bar { background: #ececf1; border-radius: 4px; height: 10px; }
  .mut { color: #9a9aa4; font-size: 12px; }`;

const standalone = it => `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${it.name.ko} ${it.name.en} — UI 메뉴판</title>
<style>
${BASE}
</style>
</head>
<body>
${frags[it.id].body}
<script>
// 데모용 빈 링크(href="#") 이동 차단 — 인앱 브라우저(스레드 등)에서 iframe 이 엉뚱한 곳으로 튀는 제보 대응 (2026-09-12)
document.addEventListener('click', function (e) {
  var a = e.target.closest('a[href="#"]');
  if (a) e.preventDefault();
});
</script>
</body>
</html>
`;

rmSync(join(PLUGIN, 'components'), { recursive: true, force: true });
mkdirSync(join(PLUGIN, 'components'), { recursive: true });
const code = {};
for (const it of menu.items) {
  code[it.id] = standalone(it);
  writeFileSync(join(PLUGIN, 'components', `${it.id}.html`), code[it.id]);
}

// ── 3. 갤러리 ──────────────────────────────────────────────────
const bycat = id => menu.items.filter(i => i.category === id);

const cardHtml = it => `
<article class="item" id="${it.id}">
  <header><h3>${it.name.ko}</h3><span class="en">${it.name.en}</span>
    <button class="copy tiny" data-copy="${attr(it.ask)}" title="요청 문장 복사">문장</button>
    <button class="tiny codebtn" title="코드 보기">코드</button>
  </header>
  <iframe title="${it.name.ko} 데모" loading="lazy" style="height:${frags[it.id].h}px" srcdoc="${attr(code[it.id])}"></iframe>
  <footer><span class="al">"${esc(it.aliases[0])}"</span><span class="one">${esc(it.oneliner)}</span>${it.vs ? `<span class="vs">↔ ${esc(it.vs)}</span>` : ''}</footer>
  <div class="codebox" hidden><pre><code>${esc(code[it.id])}</code></pre><button class="copy tiny">코드 복사</button></div>
</article>`;

const tableHtml = cat => `
<div class="tblwrap"><table>
<thead><tr><th>한글</th><th>영문</th><th>이렇게 말해도 통해요</th><th>AI에게 이렇게</th></tr></thead>
<tbody>
${bycat(cat.id).map(it => `<tr>
  <td><a href="#${it.id}">${it.name.ko}</a></td>
  <td class="mono">${it.name.en}</td>
  <td class="als">${it.aliases.map(a => `"${esc(a)}"`).join(' · ')}</td>
  <td class="askcell"><span>${esc(it.ask)}</span><button class="copy tiny" data-copy="${attr(it.ask)}">복사</button></td>
</tr>`).join('\n')}
</tbody></table></div>`;

const sectionHtml = cat => `
<section class="cat" id="c-${cat.id}">
  <h2><span class="no">${cat.no}</span> ${cat.ko} <span class="count">${bycat(cat.id).length}</span></h2>
  <div class="grid">${bycat(cat.id).map(cardHtml).join('\n')}</div>
  ${tableHtml(cat)}
</section>`;

const f = menu.formula;
const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>UI 메뉴판 — Giting Skills</title>
<meta name="description" content="'접었다 폈다 되는 거'에는 이름이 있습니다. 8개 코스 ${menu.items.length}개 항목 — 전부 그림이 아니라 실제로 동작하는 HTML. AI가 쓸 수 있는 Claude Code 스킬로 배포됩니다.">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap">
<style>
  :root {
    --paper: #ffffff; --ink: #17171b; --ink2: #55555f; --ink3: #9a9aa4;
    --line: #e8e8ee; --wash: #f7f8fa; --accent: #f05032;
    --sans: -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
    --mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; scroll-padding-top: 96px; }
  body { margin: 0; background: var(--paper); color: var(--ink); font-family: var(--sans); line-height: 1.55; }
  .wrap { max-width: 1120px; margin: 0 auto; padding: 0 20px; }

  .top { border-bottom: 1px solid var(--line); background: var(--paper); }
  .top .wrap { display: flex; align-items: center; gap: 12px; height: 52px; }
  .logo { font-weight: 800; letter-spacing: -.02em; text-decoration: none; color: var(--ink); font-size: 15px; }
  .logo i { font-style: normal; color: var(--accent); }
  .top nav { margin-left: auto; display: flex; gap: 14px; font-size: 13px; }
  .top nav a { color: var(--ink2); text-decoration: none; }
  .top nav a:hover { color: var(--ink); }

  .hero { padding: 40px 0 30px; }
  .hero .kicker { font-family: var(--mono); font-size: 12px; color: var(--accent); letter-spacing: .06em; }
  .hero h1 { margin: 10px 0 0; font-size: clamp(26px, 4.6vw, 40px); letter-spacing: -.035em; line-height: 1.22; text-wrap: balance; }
  .hero h1 q { quotes: '\\201C' '\\201D'; color: var(--ink3); }
  .hero .sub { margin: 12px 0 0; color: var(--ink2); font-size: 15px; max-width: 62ch; }
  .hero .sub b { color: var(--ink); }

  .formula { margin-top: 22px; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
  .formula .fh { padding: 11px 16px; background: var(--wash); font-family: var(--mono); font-size: 12px; color: var(--ink2); display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .formula .fh b { color: var(--ink); font-size: 13px; }
  .fx { display: grid; grid-template-columns: 1fr 1fr; }
  @media (max-width: 720px) { .fx { grid-template-columns: 1fr; } }
  .fx > div { padding: 12px 16px; font-size: 13.5px; }
  .fx .bad { color: var(--ink3); border-right: 1px solid var(--line); }
  @media (max-width: 720px) { .fx .bad { border-right: 0; border-bottom: 1px solid var(--line); } }
  .fx .mark { font-size: 11px; font-family: var(--mono); display: block; margin-bottom: 3px; }
  .fx .bad .mark { color: #c0392b; }
  .fx .good .mark { color: #17b26a; }
  .fnote { padding: 10px 16px; border-top: 1px solid var(--line); font-size: 12.5px; color: var(--ink2); }

  .install { margin-top: 18px; display: flex; align-items: stretch; border: 1px solid var(--line); border-radius: 11px; overflow: hidden; max-width: 560px; }
  .install code { flex: 1; min-width: 0; font-family: var(--mono); font-size: 12.5px; padding: 10px 14px; background: var(--wash); overflow-x: auto; white-space: nowrap; display: block; -webkit-overflow-scrolling: touch; }
  .install button { flex: none; border: 0; border-left: 1px solid var(--line); background: #fff; padding: 0 14px; font-size: 12.5px; cursor: pointer; font-family: var(--sans); }
  .install button:hover { background: var(--wash); }
  .ghbtn { display: inline-flex; align-items: center; margin: 12px 8px 0 0; padding: 10px 16px; border: 1px solid var(--line); border-radius: 11px; font-size: 13px; color: var(--ink); text-decoration: none; vertical-align: top; }
  .ghbtn:hover { border-color: var(--ink3); background: var(--wash); }
  .also { margin-top: 10px; font-size: 12.5px; color: var(--ink3); }
  .also code { font-family: var(--mono); }
  .also a { color: var(--ink2); }

  .chipnav { position: sticky; top: 0; z-index: 5; background: color-mix(in srgb, var(--paper) 92%, transparent); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); }
  .chipnav .wrap { display: flex; gap: 6px; padding-top: 9px; padding-bottom: 9px; overflow-x: auto; scrollbar-width: none; }
  .chipnav a { flex-shrink: 0; font-size: 12.5px; color: var(--ink2); text-decoration: none; border: 1px solid var(--line); border-radius: 999px; padding: 5px 12px; background: var(--paper); }
  .chipnav a:hover { border-color: var(--ink3); color: var(--ink); }
  .chipnav a b { font-family: var(--mono); font-weight: 400; margin-right: 3px; }

  .cat { padding: 34px 0 6px; }
  .cat h2 { font-size: 20px; letter-spacing: -.02em; margin: 0 0 14px; display: flex; align-items: baseline; gap: 8px; }
  .cat h2 .no { color: var(--accent); }
  .cat h2 .count { font-family: var(--mono); font-size: 12.5px; color: var(--ink3); font-weight: 400; }

  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 860px) { .grid { grid-template-columns: 1fr; } }
  .item { border: 1px solid var(--line); border-radius: 13px; background: var(--paper); overflow: hidden; display: flex; flex-direction: column; }
  .item header { display: flex; align-items: center; gap: 7px; padding: 9px 12px; border-bottom: 1px solid var(--line); }
  .item h3 { margin: 0; font-size: 14.5px; letter-spacing: -.01em; }
  .item .en { font-family: var(--mono); font-size: 11px; color: var(--ink3); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tiny { flex-shrink: 0; border: 1px solid var(--line); background: #fff; border-radius: 7px; padding: 3px 9px; font-size: 11px; cursor: pointer; color: var(--ink2); font-family: var(--sans); }
  .tiny:hover { border-color: var(--ink3); color: var(--ink); }
  .tiny.ok { border-color: var(--accent); color: var(--accent); }
  .item iframe { width: 100%; border: 0; display: block; background: #fff; }
  .item footer { padding: 8px 12px 10px; border-top: 1px solid var(--wash); display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: baseline; margin-top: auto; }
  .item .al { font-size: 12px; color: var(--accent); }
  .item .one { font-size: 12px; color: var(--ink2); }
  .codebox { border-top: 1px solid var(--line); background: var(--wash); padding: 10px 12px; }
  .codebox pre { margin: 0 0 8px; max-height: 260px; overflow: auto; font-size: 11px; line-height: 1.5; }
  .codebox code { font-family: var(--mono); }

  .tblwrap { overflow-x: auto; margin-top: 16px; border: 1px solid var(--line); border-radius: 12px; }
  table { border-collapse: collapse; width: 100%; font-size: 12.5px; min-width: 680px; }
  th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--line); vertical-align: top; }
  tbody tr:last-child td { border-bottom: 0; }
  th { background: var(--wash); color: var(--ink2); font-size: 11px; font-weight: 600; }
  td a { color: var(--ink); font-weight: 600; text-decoration: none; }
  td a:hover { color: var(--accent); }
  td.mono { font-family: var(--mono); font-size: 11.5px; color: var(--ink2); white-space: nowrap; }
  td.als { color: var(--ink3); font-size: 12px; }
  td.askcell { min-width: 220px; }
  td.askcell span { color: var(--ink2); }
  td.askcell button { margin-left: 6px; }

  .foot { border-top: 1px solid var(--line); margin-top: 44px; padding: 22px 0 40px; font-size: 12.5px; color: var(--ink3); }
  .foot .wrap { display: flex; flex-wrap: wrap; gap: 8px 18px; }
  .foot a { color: var(--ink2); }
</style>
</head>
<body>
<header class="top">
  <div class="wrap">
    <a class="logo" href="#">UI 메뉴판 <i>·</i> Giting Skills</a>
    <nav>
      <a href="https://github.com/hanmariyang/giting-skills">GitHub</a>
      <a href="https://giting.kr">Giting</a>
    </nav>
  </div>
</header>

<section class="hero">
  <div class="wrap">
    <div class="kicker">GITING SKILLS · 01 UI-MENU · ${menu.items.length}개 항목</div>
    <h1><q>접었다 폈다 되는 거</q>에는 이름이 있습니다</h1>
    <p class="sub">말로 설명하던 UI에 이름을 붙여 주는 사전. 8개 코스 <b>${menu.items.length}개 항목</b>이 전부 그림이 아니라 <b>실제로 동작하는 HTML</b>이고, 항목마다 AI에게 그대로 쓰는 요청 문장이 붙어 있습니다. AI가 직접 읽도록 Claude Code 스킬로도 배포됩니다.</p>

    <div class="formula">
      <div class="fh"><b>AI한테 시키는 공식</b><span>${esc(f.pattern)}</span></div>
      <div class="fx">
        <div class="bad"><span class="mark">✕ 이렇게 말고</span>「${esc(f.bad)}」</div>
        <div class="good"><span class="mark">○ 이렇게</span>「${esc(f.good)}」</div>
      </div>
      <div class="fnote">${esc(f.note)} 아래 사전에서 이름을 찾고, 문장을 복사해 쓰세요.</div>
    </div>

    <div class="install">
      <code>/plugin marketplace add hanmariyang/giting-skills</code>
      <button class="copy" data-copy="/plugin marketplace add hanmariyang/giting-skills">복사</button>
    </div>
    <a class="ghbtn" href="https://github.com/hanmariyang/giting-skills" target="_blank" rel="noopener">GitHub에서 오픈소스 보기 &#8599;</a>
    <p class="also">이어서 <code>/plugin install ui-menu@giting</code> · 에이전트용 사전: <a href="llms.txt">llms.txt</a> / <a href="llms-full.txt">llms-full.txt</a> (코드 포함)</p>
  </div>
</section>

<nav class="chipnav" aria-label="코스">
  <div class="wrap">
    ${menu.categories.map(c => `<a href="#c-${c.id}"><b>${c.no}</b>${c.ko}</a>`).join('\n    ')}
  </div>
</nav>

<div class="wrap">
${menu.categories.map(sectionHtml).join('\n')}
</div>

<footer class="foot">
  <div class="wrap">
    <span>MIT License</span>
    <a href="https://github.com/hanmariyang/giting-skills">hanmariyang/giting-skills</a>
    <a href="https://giting.kr">giting.kr — 오픈소스를 별점이 아니라 실측으로</a>
  </div>
</footer>

<script>
  // 방문 비콘 — first-party 분석(aiplab-analytics), 쿠키 없음. 실패는 조용히 무시.
  try {
    var _u = 'https://aiplab.kr/hit?s=giting-skills&p=' + encodeURIComponent(location.pathname)
           + '&r=' + encodeURIComponent(document.referrer || '');
    if (!(navigator.sendBeacon && navigator.sendBeacon(_u))) { new Image().src = _u; }
  } catch (e) {}
  document.addEventListener('click', async (e) => {
    const cb = e.target.closest('.codebtn');
    if (cb) { const box = cb.closest('.item').querySelector('.codebox'); box.hidden = !box.hidden; return; }
    const btn = e.target.closest('.copy');
    if (!btn) return;
    const text = btn.dataset.copy || btn.closest('.codebox')?.querySelector('code')?.textContent;
    if (!text) return;
    try { await navigator.clipboard.writeText(text); } catch {}
    const old = btn.textContent;
    btn.textContent = '복사됨'; btn.classList.add('ok');
    setTimeout(() => { btn.textContent = old; btn.classList.remove('ok'); }, 1100);
  });
</script>
</body>
</html>`;

// ── 4. llms.txt ────────────────────────────────────────────────
const dict = full => `# UI 메뉴판 (ui-menu) — Giting Skills

> 말로 설명하던 UI에 이름을 붙여 주는 사전. 별칭(사람이 실제로 하는 말) → 정식 명칭 → 바로 쓰는 요청 문장 → 실물 HTML. 8개 코스 ${menu.items.length}개 항목.
> AI한테 시키는 공식: ${f.pattern}
>   ✕ "${f.bad}" → ○ "${f.good}"
> 갤러리: https://giting.kr/skills/ · repo: https://github.com/hanmariyang/giting-skills (MIT)
> Claude Code 설치: /plugin marketplace add hanmariyang/giting-skills → /plugin install ui-menu@giting

${menu.categories.map(cat => `## ${cat.no} ${cat.ko}

${bycat(cat.id).map(it => `### ${it.name.ko} (${it.name.en})
- 별칭: ${it.aliases.map(a => `"${a}"`).join(' · ')}
- 정의: ${it.oneliner}${it.vs ? `
- 구분: ${it.vs}` : ''}
- 요청 문장: ${it.ask}
- 레퍼런스: ${RAW}/${it.id}.html${full ? `

\`\`\`html
${code[it.id].trim()}
\`\`\`` : ''}
`).join('\n')}`).join('\n')}`;

// ── 5. 출력 ────────────────────────────────────────────────────
// 정본 갤러리 = giting.kr/skills (2026-09-12 owner 확정 — 우리 도메인에서 서빙, GitHub 은 소스 버튼).
// GITING_SITE_DIR 이 있으면(워크스페이스: ../giting/site/static/skills) 그쪽에 갤러리·llms 를 쓰고,
// docs/(github.io) 는 리다이렉트 + llms 미러(구 링크 소비자용)만 유지한다. promo 이미지는 양쪽 다.
const SITE_DIR = process.env.GITING_SITE_DIR;
const redirect = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=https://giting.kr/skills/">
<link rel="canonical" href="https://giting.kr/skills/">
<title>UI 메뉴판 — giting.kr/skills 로 이동</title>
<script>location.replace('https://giting.kr/skills/' + location.hash);</script>
</head><body style="font-family:sans-serif;padding:40px">갤러리가 <a href="https://giting.kr/skills/">giting.kr/skills</a> 로 이사했습니다.</body></html>
`;

// ── 갤러리 코어 (giting.kr 스킬 상세의 "실물 본문"으로 이식되는 조각) ──
// giting 사이트 페이지 안에 그대로 삽입되므로: ① 셸(헤더·히어로·푸터) 없음 ② CSS 전부 .uigal 스코프
//   (⚠️ giting theme.css 의 .grid·.chips 등과 맨몸 클래스 충돌 — 전례 있음, 반드시 스코프 유지)
// ③ 색·폰트는 giting theme 변수(--ink-2/--ink-3/--accent-deep 등)를 사용한다.
const CORE_CSS = `
.uigal { --gwash: var(--wash); }
.uigal .formula { margin-top: 16px; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
.uigal .fh { padding: 11px 16px; background: var(--gwash); font-family: var(--mono); font-size: 12.5px; color: var(--ink-2); display: flex; gap: 10px; flex-wrap: wrap; }
.uigal .fh b { color: var(--ink); font-family: var(--sans); }
.uigal .fx { display: grid; grid-template-columns: 1fr 1fr; }
@media (max-width: 720px) { .uigal .fx { grid-template-columns: 1fr; } }
.uigal .fx > div { padding: 12px 16px; font-size: 14px; }
.uigal .fx .bad { color: var(--ink-3); border-right: 1px solid var(--line); }
@media (max-width: 720px) { .uigal .fx .bad { border-right: 0; border-bottom: 1px solid var(--line); } }
.uigal .mark { font-size: 11px; font-family: var(--mono); display: block; margin-bottom: 3px; }
.uigal .bad .mark { color: #C0392B; } .uigal .good .mark { color: #17B26A; }
.uigal .gnav { display: flex; gap: 8px; overflow-x: auto; padding: 16px 0 4px; scrollbar-width: none; }
.uigal .gnav a { flex: none; font-size: 13px; color: var(--ink-2); border: 1px solid var(--line); border-radius: 999px; padding: 6px 13px; text-decoration: none; background: var(--paper); }
.uigal .gnav a:hover { border-color: var(--ink-3); color: var(--ink); }
.uigal .gnav a b { font-family: var(--mono); font-weight: 400; margin-right: 3px; }
.uigal .cat { padding-top: 26px; scroll-margin-top: 90px; }
.uigal .cat h2 { font-size: 19px; font-weight: 800; letter-spacing: -.01em; margin: 0 0 12px; display: flex; align-items: baseline; gap: 8px; }
.uigal .cat h2 .no { color: var(--accent-deep); }
.uigal .cat h2 .count { font-family: var(--mono); font-size: 12.5px; color: var(--ink-3); font-weight: 400; }
.uigal .ggrid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 860px) { .uigal .ggrid { grid-template-columns: 1fr; } }
.uigal .item { border: 1px solid var(--line); border-radius: 13px; background: var(--paper); overflow: hidden; display: flex; flex-direction: column; }
.uigal .item header { display: flex; align-items: center; gap: 7px; padding: 9px 12px; border-bottom: 1px solid var(--line); }
.uigal .item h3 { margin: 0; font-size: 14.5px; font-weight: 700; letter-spacing: -.01em; }
.uigal .item .en { font-family: var(--mono); font-size: 11px; color: var(--ink-3); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.uigal .tiny { flex: none; border: 1px solid var(--line); background: var(--paper); border-radius: 7px; padding: 3px 9px; font-size: 11px; cursor: pointer; color: var(--ink-2); font-family: var(--sans); }
.uigal .tiny:hover { border-color: var(--ink-3); color: var(--ink); }
.uigal .tiny.ok { border-color: var(--accent); color: var(--accent-deep); }
.uigal .item iframe { width: 100%; border: 0; display: block; background: #FFF; }
.uigal .item footer { padding: 8px 12px 10px; border-top: 1px solid var(--gwash); display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: baseline; margin-top: auto; }
.uigal .item .al { font-size: 12px; color: var(--accent-deep); }
.uigal .item .one { font-size: 12px; color: var(--ink-2); }
.uigal .item .vs { flex-basis: 100%; font-size: 11.5px; color: var(--ink-3); border-top: 1px dashed var(--line); padding-top: 5px; margin-top: 2px; }
.uigal .codebox { border-top: 1px solid var(--line); background: var(--gwash); padding: 10px 12px; }
.uigal .codebox pre { margin: 0 0 8px; max-height: 260px; overflow: auto; font-size: 11px; line-height: 1.5; }
.uigal .codebox code { font-family: var(--mono); }
.uigal .tblwrap { overflow-x: auto; margin-top: 16px; border: 1px solid var(--line); border-radius: 12px; }
.uigal table { border-collapse: collapse; width: 100%; font-size: 12.5px; min-width: 680px; }
.uigal th, .uigal td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--line); vertical-align: top; }
.uigal tbody tr:last-child td { border-bottom: 0; }
.uigal th { background: var(--gwash); color: var(--ink-2); font-size: 11px; font-weight: 600; }
.uigal td a { color: var(--ink); font-weight: 600; text-decoration: none; }
.uigal td a:hover { color: var(--accent-deep); }
.uigal td.mono { font-family: var(--mono); font-size: 11.5px; color: var(--ink-2); white-space: nowrap; }
.uigal td.als { color: var(--ink-3); font-size: 12px; }
.uigal td.askcell { min-width: 220px; }
.uigal td.askcell span { color: var(--ink-2); }
.uigal td.askcell button { margin-left: 6px; }`;

const CORE_JS = `
(function () {
  var root = document.querySelector('.uigal');
  if (!root) return;
  root.addEventListener('click', function (e) {
    var cb = e.target.closest('.codebtn');
    if (cb) { var box = cb.closest('.item').querySelector('.codebox'); box.hidden = !box.hidden; return; }
    var btn = e.target.closest('.copy');
    if (!btn) return;
    var text = btn.dataset.copy || (btn.closest('.codebox') && btn.closest('.codebox').querySelector('code').textContent);
    if (!text) return;
    try { navigator.clipboard.writeText(text); } catch (err) {}
    var old = btn.textContent;
    btn.textContent = '복사됨'; btn.classList.add('ok');
    setTimeout(function () { btn.textContent = old; btn.classList.remove('ok'); }, 1100);
  });
})();`;

const core = `<div class="uigal">
<style>${CORE_CSS}</style>
<div class="formula">
  <div class="fh"><b>AI한테 시키는 공식</b><span>${esc(f.pattern)}</span></div>
  <div class="fx">
    <div class="bad"><span class="mark">✕ 이렇게 말고</span>「${esc(f.bad)}」</div>
    <div class="good"><span class="mark">○ 이렇게</span>「${esc(f.good)}」</div>
  </div>
</div>
<nav class="gnav" aria-label="코스">
  ${menu.categories.map(c => `<a href="#c-${c.id}"><b>${c.no}</b>${c.ko} ${bycat(c.id).length}</a>`).join('\n  ')}
</nav>
${menu.categories.map(cat => `
<section class="cat" id="c-${cat.id}">
  <h2><span class="no">${cat.no}</span> ${cat.ko} <span class="count">${bycat(cat.id).length}</span></h2>
  <div class="ggrid">${bycat(cat.id).map(cardHtml).join('\n')}</div>
  ${tableHtml(cat)}
</section>`).join('\n')}
<script>${CORE_JS}</script>
</div>
`;

mkdirSync(join(ROOT, 'docs'), { recursive: true });
writeFileSync(join(ROOT, 'docs', 'index.html'), redirect);
writeFileSync(join(ROOT, 'docs', 'llms.txt'), dict(false));
writeFileSync(join(ROOT, 'docs', 'llms-full.txt'), dict(true));
let siteMsg = '';
if (SITE_DIR) {
  mkdirSync(SITE_DIR, { recursive: true });
  writeFileSync(join(SITE_DIR, 'gallery-core.html'), core); // giting 빌드가 스킬 상세에 삽입
  rmSync(join(SITE_DIR, 'index.html'), { force: true });    // 단독 갤러리는 상세 페이지로 흡수 (2026-09-12)
  writeFileSync(join(SITE_DIR, 'llms.txt'), dict(false));
  writeFileSync(join(SITE_DIR, 'llms-full.txt'), dict(true));
  for (const f of ['promo.jpg', 'promo-card.jpg']) {
    try { writeFileSync(join(SITE_DIR, f), readFileSync(join(ROOT, 'docs', f))); } catch { /* 없으면 생략 */ }
  }
  siteMsg = ` · site→${SITE_DIR}`;
} else {
  siteMsg = ' · (GITING_SITE_DIR 미설정 — giting.kr 갤러리 미갱신)';
}
console.log(`built: components ${menu.items.length} · gallery ${(html.length / 1024).toFixed(0)}KB · docs=redirect+llms${siteMsg}`);

// ═══════════════════════════════════════════════════════════════
// ── CSS 증상 사전 (css-menu) — 02 ──────────────────────────────
// 항목당 demos 프래그먼트 2개(@<id>-bad / @<id>-good)를 짝지어
// before/after 자가완결 컴포넌트 1파일로 굽는다. 갤러리는 .cssgal 스코프.
// 비개발자(기획자·디자이너) 우선: 증상·범인·확인법 전부 사람 말, 속성명은 괄호 보조.
const CP = join(ROOT, 'plugins', 'css-menu');
const cmenu = JSON.parse(readFileSync(join(CP, 'menu.json'), 'utf8'));
const RAW_C = 'https://raw.githubusercontent.com/hanmariyang/giting-skills/main/plugins/css-menu/components';

const cfrags = {};
for (const f of readdirSync(join(CP, 'demos')).filter(f => f.endsWith('.html'))) {
  const src = readFileSync(join(CP, 'demos', f), 'utf8');
  const parts = src.split(/<!--\s*@([a-z0-9-]+)([^>]*?)-->/);
  for (let i = 1; i < parts.length; i += 3) {
    const id = parts[i], opts = parts[i + 1], body = parts[i + 2].trim();
    cfrags[id] = { h: Number((opts.match(/h=(\d+)/) || [])[1] || 150), body };
  }
}
const cmissing = cmenu.items.flatMap(it => [`${it.id}-bad`, `${it.id}-good`].filter(k => !cfrags[k]));
if (cmissing.length) { console.error('css-menu 데모 없는 프래그먼트:', cmissing.join(', ')); process.exit(1); }

const C_BASE = `  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: #17171b; font-size: 13px; background: #fff; word-break: keep-all; }
  .duo { display: grid; grid-template-columns: 1fr 1fr; }
  .pane { min-width: 0; display: flex; flex-direction: column; }
  .pane + .pane { border-left: 1px solid #e8e8ee; }
  .tag { flex: none; font-size: 11px; font-weight: 800; padding: 7px 12px; }
  .bad .tag { background: #fbf1ef; color: #c4372b; }
  .good .tag { background: #eff6f1; color: #1f7a4d; }
  .stage { flex: 1; background: #f6f7f9; padding: 12px; position: relative; overflow: hidden; }
  .card { background: #fff; border: 1px solid #e4e4ea; border-radius: 10px; padding: 10px 13px; box-shadow: 0 1px 4px rgba(23,23,27,.05); }
  .bar { background: #ececf1; border-radius: 4px; height: 10px; }
  .mut { color: #9a9aa4; font-size: 12px; }
  .btn { display: inline-block; border: 0; border-radius: 9px; background: #17171b; color: #fff; font-size: 12.5px; padding: 9px 16px; cursor: pointer; font-family: inherit; }
  .chk { font-size: 11.5px; color: #55555f; padding: 8px 12px; border-top: 1px solid #f0f0f4; background: #fff; }
  .chk b { color: #17171b; }`;

const cKindLabel = it => it.kind === 'branch' ? '분기형' : '즉방형';
const cBadTag = it => it.sim ? '✗ 증상 (재현 시뮬레이션)' : '✗ 깨진 그대로';
const cGoodTag = it => it.sim ? '✓ 고친 상태 (시뮬레이션)' : '✓ 고친 그대로';

const cStandalone = it => `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>"${it.name.ko}" — CSS 증상 사전</title>
<!--
  증상: "${it.name.ko}" (${it.name.dx}) · 유형: ${cKindLabel(it)}
  범인: ${it.culprits.join(' / ')}
  ${it.kind === 'branch'
    ? `갈림길: ${it.branches.map(b => `[${b.q}] → ${b.a}`).join(' · ')}`
    : `처방: ${it.rx}`}
  AI에게: ${it.ask}
  확인: ${it.check}
-->
<style>
${C_BASE}
</style>
</head>
<body>
<div class="duo">
  <section class="pane bad"><div class="tag">${cBadTag(it)}</div><div class="stage" style="height:${cfrags[it.id + '-bad'].h}px">
${cfrags[it.id + '-bad'].body}
  </div></section>
  <section class="pane good"><div class="tag">${cGoodTag(it)}</div><div class="stage" style="height:${cfrags[it.id + '-good'].h}px">
${cfrags[it.id + '-good'].body}
  </div></section>
</div>
<div class="chk"><b>고쳐졌는지 확인:</b> ${it.check}</div>
<script>
document.addEventListener('click', function (e) {
  var a = e.target.closest('a[href="#"]');
  if (a) e.preventDefault();
});
</script>
</body>
</html>
`;

rmSync(join(CP, 'components'), { recursive: true, force: true });
mkdirSync(join(CP, 'components'), { recursive: true });
const ccode = {};
for (const it of cmenu.items) {
  ccode[it.id] = cStandalone(it);
  writeFileSync(join(CP, 'components', `${it.id}.html`), ccode[it.id]);
}

const cby = id => cmenu.items.filter(i => i.category === id);
const cIframeH = it => Math.max(cfrags[it.id + '-bad'].h, cfrags[it.id + '-good'].h) + 30 + 34;

const cCardHtml = it => `
<article class="item ${it.kind}" id="${it.id}">
  <header><span class="kind ${it.kind}">${cKindLabel(it)}</span><h3>"${it.name.ko}"</h3><span class="en">${it.name.dx}</span>
    <button class="copy tiny" data-copy="${attr(it.ask)}" title="요청 문장 복사">문장</button>
    <button class="tiny codebtn" title="코드 보기">코드</button>
  </header>
  <iframe title="${it.name.ko} — 깨진/고친 실물" loading="lazy" style="height:${cIframeH(it)}px" srcdoc="${attr(ccode[it.id])}"></iframe>
  <footer>
    ${it.kind === 'branch'
      ? `<span class="one"><b>갈림길:</b> ${it.branches.map(b => esc(b.q)).join(' / ')}</span>`
      : `<span class="one"><b>범인 1순위:</b> ${esc(it.culprits[0])}</span>`}
  </footer>
  <div class="codebox" hidden><pre><code>${esc(ccode[it.id])}</code></pre><button class="copy tiny">코드 복사</button></div>
</article>`;

const cTableHtml = cat => `
<div class="tblwrap"><table>
<thead><tr><th>증상</th><th>유형</th><th>이렇게 말해도 통해요</th><th>AI에게 이렇게</th></tr></thead>
<tbody>
${cby(cat.id).map(it => `<tr>
  <td><a href="#${it.id}">"${it.name.ko}"</a></td>
  <td class="mono">${cKindLabel(it)}</td>
  <td class="als">${it.aliases.map(a => `"${esc(a)}"`).join(' · ')}</td>
  <td class="askcell"><span>${esc(it.ask)}</span><button class="copy tiny" data-copy="${attr(it.ask)}">복사</button></td>
</tr>`).join('\n')}
</tbody></table></div>`;

const cf = cmenu.formula;
const CSSGAL_CSS = CORE_CSS.replace(/\.uigal/g, '.cssgal') + `
.cssgal .ggrid { grid-template-columns: 1fr; }
.cssgal .item h3 { font-size: 15px; }
.cssgal .kind { flex: none; font-size: 10.5px; font-weight: 800; border-radius: 6px; padding: 2px 7px; }
.cssgal .kind.direct { background: #eff6f1; color: #1f7a4d; }
.cssgal .kind.branch { background: #f3effa; color: #5b4aa8; }
.cssgal .item footer { display: grid; gap: 3px; }
.cssgal .item .one { font-size: 12px; color: var(--ink-2); }
.cssgal .item .one b { color: var(--ink); font-weight: 700; }
.cssgal .item .ck { font-size: 11.5px; color: var(--ink-3); }`;

const cssCore = `<div class="cssgal">
<style>${CSSGAL_CSS}</style>
<div class="formula">
  <div class="fh"><b>AI한테 시키는 공식</b><span>${esc(cf.pattern)}</span></div>
  <div class="fx">
    <div class="bad"><span class="mark">✕ 이렇게 말고</span>「${esc(cf.bad)}」</div>
    <div class="good"><span class="mark">○ 이렇게</span>「${esc(cf.good)}」</div>
  </div>
</div>
<nav class="gnav" aria-label="코스">
  ${cmenu.categories.map(c => `<a href="#c-${c.id}"><b>${c.no}</b>${c.ko} ${cby(c.id).length}</a>`).join('\n  ')}
</nav>
${cmenu.categories.map(cat => `
<section class="cat" id="c-${cat.id}">
  <h2><span class="no">${cat.no}</span> ${cat.ko} <span class="count">${cby(cat.id).length}</span></h2>
  <div class="ggrid">${cby(cat.id).map(cCardHtml).join('\n')}</div>
  ${cTableHtml(cat)}
</section>`).join('\n')}
<script>${CORE_JS.replace(/\.uigal/g, '.cssgal')}</script>
</div>
`;

const cdict = full => `# CSS 증상 사전 (css-menu) — Giting Skills

> 깨진 화면을 CSS 용어가 아니라 증상으로 찾는 사전. 증상(사람 말) → 범인 후보 → 처방 또는 갈림길 진단 → AI에게 시키는 문장 → 깨진/고친 실물. 8개 코스 ${cmenu.items.length}개 항목.
> 항목 유형 2가지 — [즉방형]: 상황 불문 같은 처방, 문장을 그대로 쓴다. [분기형]: 상황 의존 — 바로 고치라고 하지 말고 진단부터 시킨다.
> AI한테 시키는 공식: ${cf.pattern}
>   ✕ "${cf.bad}" → ○ "${cf.good}"
> 갤러리: https://giting.kr/skills/css-menu · repo: https://github.com/hanmariyang/giting-skills (MIT)
> Claude Code 설치: /plugin marketplace add hanmariyang/giting-skills → /plugin install css-menu@giting

${cmenu.categories.map(cat => `## ${cat.no} ${cat.ko}

${cby(cat.id).map(it => `### "${it.name.ko}" (${it.name.dx}) [${cKindLabel(it)}]
- 별칭: ${it.aliases.map(a => `"${a}"`).join(' · ')}
- 범인: ${it.culprits.join(' / ')}
${it.kind === 'branch'
  ? `- 갈림길: ${it.branches.map(b => `[${b.q}] → ${b.a}`).join(' · ')}`
  : `- 처방: ${it.rx}`}
- 요청 문장: ${it.ask}
- 확인: ${it.check}
- 레퍼런스: ${RAW_C}/${it.id}.html${full ? `

\`\`\`html
${ccode[it.id].trim()}
\`\`\`` : ''}
`).join('\n')}`).join('\n')}`;

if (SITE_DIR) {
  const CS = join(SITE_DIR, 'css-menu');
  mkdirSync(CS, { recursive: true });
  writeFileSync(join(CS, 'gallery-core.html'), cssCore);
  writeFileSync(join(CS, 'llms.txt'), cdict(false));
  writeFileSync(join(CS, 'llms-full.txt'), cdict(true));
}
mkdirSync(join(ROOT, 'docs', 'css-menu'), { recursive: true });
writeFileSync(join(ROOT, 'docs', 'css-menu', 'index.html'), redirect.replace(/giting\.kr\/skills\//g, 'giting.kr/skills/css-menu'));
writeFileSync(join(ROOT, 'docs', 'css-menu', 'llms.txt'), cdict(false));
writeFileSync(join(ROOT, 'docs', 'css-menu', 'llms-full.txt'), cdict(true));
console.log(`built css-menu: components ${cmenu.items.length} · core ${(cssCore.length / 1024).toFixed(0)}KB`);
