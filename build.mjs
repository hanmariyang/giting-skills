#!/usr/bin/env node
// Giting Skills — ui-menu 갤러리 + llms.txt 생성기 (의존성 0)
// 사용: node build.mjs   → docs/index.html · docs/llms.txt · docs/llms-full.txt
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PLUGIN = join(ROOT, 'plugins', 'ui-menu');
const menu = JSON.parse(readFileSync(join(PLUGIN, 'menu.json'), 'utf8'));
const RAW = 'https://raw.githubusercontent.com/hanmariyang/giting-skills/main/plugins/ui-menu/components';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

// 데모 iframe 높이 (기본 240)
const H = { header: 260, hero: 380, sidebar: 300, footer: 280, container: 300, grid: 260,
  card: 340, accordion: 280, modal: 320, drawer: 320, carousel: 300, tabs: 220,
  'skeleton-ui': 240, toast: 220, dropdown: 260, tooltip: 180, switch: 140, chip: 160,
  pagination: 140, navbar: 180 };

const code = {};
for (const it of menu.items) code[it.id] = readFileSync(join(PLUGIN, 'components', `${it.id}.html`), 'utf8');

const itemHtml = it => `
<article class="item" id="${it.id}">
  <div class="info">
    <h3>${it.name.ko} <span class="en">${it.name.en}</span></h3>
    <div class="aliases">${it.aliases.map(a => `<span class="alias">"${esc(a)}"</span>`).join('')}</div>
    <p class="one">${esc(it.oneliner)}</p>
    <div class="ask">
      <span class="ask-label">AI에게 이렇게 말하세요</span>
      <p>${esc(it.ask)}</p>
      <button class="copy" data-copy="${attr(it.ask)}">문장 복사</button>
    </div>
  </div>
  <div class="demo">
    <iframe title="${it.name.ko} 라이브 데모" loading="lazy" style="height:${H[it.id] || 240}px" srcdoc="${attr(code[it.id])}"></iframe>
    <details>
      <summary>코드 보기 <button class="copy code-copy">코드 복사</button></summary>
      <pre><code>${esc(code[it.id])}</code></pre>
    </details>
  </div>
</article>`;

const section = cat => `
<section class="cat" id="${cat.id}">
  <h2>${cat.ko} <span class="count">${menu.items.filter(i => i.category === cat.id).length}</span></h2>
  ${menu.items.filter(i => i.category === cat.id).map(itemHtml).join('\n')}
</section>`;

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>UI 메뉴판 — Giting Skills</title>
<meta name="description" content="'접었다 폈다 되는 거'에는 이름이 있습니다. 말로 설명하던 UI에 이름을 붙여 주는 사전과 실물 HTML 레퍼런스 ${menu.items.length}종. AI가 쓸 수 있는 Claude Code 스킬로 배포됩니다.">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap">
<style>
  :root {
    --paper: #ffffff; --ink: #17171b; --ink2: #55555f; --ink3: #9a9aa4;
    --line: #e8e8ee; --wash: #f7f8fa; --accent: #f05032;
    --sans: -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
    --mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--paper); color: var(--ink); font-family: var(--sans); line-height: 1.6; }
  .wrap { max-width: 1060px; margin: 0 auto; padding: 0 22px; }
  a { color: inherit; }

  .top { border-bottom: 1px solid var(--line); }
  .top .wrap { display: flex; align-items: center; gap: 14px; height: 56px; }
  .logo { font-weight: 800; letter-spacing: -0.02em; text-decoration: none; }
  .logo i { font-style: normal; color: var(--accent); }
  .top nav { margin-left: auto; display: flex; gap: 16px; font-size: 13.5px; }
  .top nav a { color: var(--ink2); text-decoration: none; }
  .top nav a:hover { color: var(--ink); }

  .hero { padding: 72px 0 56px; border-bottom: 1px solid var(--line); }
  .hero .kicker { font-family: var(--mono); font-size: 12.5px; color: var(--accent); letter-spacing: .06em; }
  .hero h1 { margin: 12px 0 0; font-size: clamp(30px, 5.4vw, 50px); letter-spacing: -0.035em; line-height: 1.2; text-wrap: balance; }
  .hero h1 q { quotes: '\\201C' '\\201D'; color: var(--ink3); }
  .hero p.sub { margin: 18px 0 0; color: var(--ink2); font-size: 16.5px; max-width: 56ch; }
  .install { margin-top: 30px; display: inline-flex; flex-wrap: wrap; align-items: center; gap: 0;
    border: 1px solid var(--line); border-radius: 12px; overflow: hidden; max-width: 100%; }
  .install code { font-family: var(--mono); font-size: 13px; padding: 12px 16px; background: var(--wash);
    overflow-x: auto; white-space: nowrap; display: block; }
  .install button { border: 0; border-left: 1px solid var(--line); background: #fff; padding: 12px 16px;
    font-size: 13px; cursor: pointer; font-family: var(--sans); flex-shrink: 0; }
  .install button:hover { background: var(--wash); }
  .hero .also { margin-top: 12px; font-size: 12.5px; color: var(--ink3); }
  .hero .also code { font-family: var(--mono); }

  .cat { padding: 44px 0 8px; }
  .cat h2 { font-size: 21px; letter-spacing: -0.02em; margin: 0 0 6px; }
  .cat h2 .count { font-family: var(--mono); font-size: 13px; color: var(--ink3); font-weight: 400; }

  .item { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 26px;
    padding: 30px 0; border-top: 1px solid var(--line); }
  @media (max-width: 800px) { .item { grid-template-columns: 1fr; gap: 16px; } }
  .item h3 { margin: 0; font-size: 19px; letter-spacing: -0.01em; }
  .item h3 .en { font-family: var(--mono); font-size: 13px; color: var(--ink3); font-weight: 400; margin-left: 6px; }
  .aliases { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .alias { font-size: 12.5px; color: var(--ink2); background: var(--wash); border-radius: 999px; padding: 4px 11px; }
  .one { margin: 12px 0 0; font-size: 14.5px; color: var(--ink2); }
  .ask { margin-top: 16px; border: 1px solid var(--line); border-left: 3px solid var(--accent);
    border-radius: 10px; padding: 12px 14px; }
  .ask-label { font-family: var(--mono); font-size: 11px; color: var(--accent); letter-spacing: .05em; }
  .ask p { margin: 6px 0 10px; font-size: 14px; }
  .copy { border: 1px solid var(--line); background: #fff; border-radius: 8px;
    padding: 5px 12px; font-size: 12.5px; cursor: pointer; font-family: var(--sans); color: var(--ink2); }
  .copy:hover { border-color: var(--ink3); color: var(--ink); }
  .copy.ok { border-color: var(--accent); color: var(--accent); }

  .demo iframe { width: 100%; border: 1px solid var(--line); border-radius: 12px; background: #fff; display: block; }
  .demo details { margin-top: 10px; }
  .demo summary { cursor: pointer; font-size: 13px; color: var(--ink2); display: flex; align-items: center; gap: 10px; }
  .demo summary::marker { color: var(--ink3); }
  .demo pre { margin: 10px 0 0; background: var(--wash); border: 1px solid var(--line); border-radius: 10px;
    padding: 14px 16px; overflow-x: auto; font-size: 12px; line-height: 1.55; }
  .demo code { font-family: var(--mono); }

  .foot { border-top: 1px solid var(--line); margin-top: 48px; padding: 26px 0 44px;
    font-size: 13px; color: var(--ink3); display: flex; flex-wrap: wrap; gap: 8px 20px; }
  .foot a { color: var(--ink2); }
</style>
</head>
<body>
<header class="top">
  <div class="wrap">
    <a class="logo" href="#">UI 메뉴판 <i>·</i> Giting Skills</a>
    <nav>
      <a href="#skeleton">페이지 뼈대</a>
      <a href="#interaction">인터랙션</a>
      <a href="https://github.com/hanmariyang/giting-skills">GitHub</a>
      <a href="https://giting.kr">Giting</a>
    </nav>
  </div>
</header>

<section class="hero">
  <div class="wrap">
    <div class="kicker">GITING SKILLS · 01 UI-MENU</div>
    <h1><q>접었다 폈다 되는 거</q>에는<br>이름이 있습니다</h1>
    <p class="sub">말로 설명하던 UI에 이름을 붙여 주는 사전. 이름을 아는 순간 AI에게 시키는 시간이 줄어듭니다. 전 항목이 그림이 아니라 실제로 동작하는 HTML이고, AI가 직접 쓸 수 있게 Claude Code 스킬로 배포됩니다.</p>
    <div class="install">
      <code>/plugin marketplace add hanmariyang/giting-skills</code>
      <button class="copy" data-copy="/plugin marketplace add hanmariyang/giting-skills">복사</button>
    </div>
    <p class="also">이어서 <code>/plugin install ui-menu@giting</code> · 에이전트용 사전: <a href="llms.txt">llms.txt</a> / <a href="llms-full.txt">llms-full.txt</a> (코드 포함)</p>
  </div>
</section>

<div class="wrap">
${menu.categories.map(section).join('\n')}
</div>

<footer class="foot">
  <div class="wrap" style="display:flex;flex-wrap:wrap;gap:8px 20px">
    <span>MIT License</span>
    <a href="https://github.com/hanmariyang/giting-skills">hanmariyang/giting-skills</a>
    <a href="https://giting.kr">giting.kr — 오픈소스를 별점이 아니라 실측으로</a>
  </div>
</footer>

<script>
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.copy');
    if (!btn) return;
    e.preventDefault();
    const text = btn.dataset.copy || btn.closest('.demo')?.querySelector('pre code')?.textContent;
    if (!text) return;
    try { await navigator.clipboard.writeText(text); } catch {}
    const old = btn.textContent;
    btn.textContent = '복사됨'; btn.classList.add('ok');
    setTimeout(() => { btn.textContent = old; btn.classList.remove('ok'); }, 1200);
  });
</script>
</body>
</html>`;

const dict = full => `# UI 메뉴판 (ui-menu) — Giting Skills

> 말로 설명하던 UI에 이름을 붙여 주는 사전. 별칭(사람이 실제로 하는 말) → 정식 명칭 → 바로 쓰는 요청 문장 → 실물 HTML 레퍼런스.
> 갤러리: https://hanmariyang.github.io/giting-skills/ · repo: https://github.com/hanmariyang/giting-skills (MIT)
> Claude Code 설치: /plugin marketplace add hanmariyang/giting-skills → /plugin install ui-menu@giting

${menu.categories.map(cat => `## ${cat.ko}

${menu.items.filter(i => i.category === cat.id).map(it => `### ${it.name.ko} (${it.name.en})
- 별칭: ${it.aliases.map(a => `"${a}"`).join(' · ')}
- 정의: ${it.oneliner}
- 요청 문장: ${it.ask}
- 레퍼런스: ${RAW}/${it.id}.html${full ? `

\`\`\`html
${code[it.id].trim()}
\`\`\`` : ''}
`).join('\n')}`).join('\n')}`;

mkdirSync(join(ROOT, 'docs'), { recursive: true });
writeFileSync(join(ROOT, 'docs', 'index.html'), html);
writeFileSync(join(ROOT, 'docs', 'llms.txt'), dict(false));
writeFileSync(join(ROOT, 'docs', 'llms-full.txt'), dict(true));
console.log(`built: docs/index.html (${(html.length / 1024).toFixed(0)}KB) · llms.txt · llms-full.txt · items ${menu.items.length}`);
