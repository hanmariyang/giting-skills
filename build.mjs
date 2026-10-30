#!/usr/bin/env node
// Giting Skills — ui-menu 빌더 (의존성 0)
// demos/*.html 프래그먼트(<!-- @id h=NNN [full] --> 구분) + menu.json →
//   components/<id>.html (스킬용 자가완결 파일) + docs/ (갤러리·llms.txt)
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { execFileSync } from 'node:child_process';

const ROOT = dirname(fileURLToPath(import.meta.url));
// 공통 조각(규칙·도구 표·스킬 목록)을 모든 SKILL.md 에 먼저 맞춘다. 정본은 shared/
execFileSync(process.execPath, [join(ROOT, 'sync-shared.mjs')], { stdio: 'inherit' });
const PLUGIN = join(ROOT, 'plugins', 'ui-menu');
const menu = JSON.parse(readFileSync(join(PLUGIN, 'menu.json'), 'utf8'));
const RAW = 'https://raw.githubusercontent.com/hanmariyang/giting-skills/main/plugins/ui-menu/components';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

// ── 판 리듬 인트로 (2026-10-23) ─────────────────────────────────
// landing-menu ⑦ 상세페이지의 rhythm 을 갤러리 여덟에 그대로 쓴다. 판 꼴 다섯: center(첫 판만) · split · wide · stack · band.
// 규칙은 빌드가 지킨다: 같은 꼴 연달아 금지 · 가운데는 첫 판만 · 바탕(pale/white/dark) 연달아 금지. 어기면 빌드가 멈춘다.
// 원래 갤러리에 있던 요소(공식·안내·로더·설치 등)는 판으로 옮기고 지우지 않는다(의뢰자 10/23).
const IP_VARS_THEME = '--ip-acc:var(--accent-deep);--ip-ink:var(--ink);--ip-ink2:var(--ink-2);--ip-ink3:var(--ink-3);--ip-paper:var(--paper);--ip-line:var(--line);--ip-wash:var(--wash)';
const ipCss = (sc, vars) => `${sc}{${vars};--ip-pn:color-mix(in srgb,var(--ip-acc) 6%,var(--ip-paper));--ip-hl:color-mix(in srgb,#FFC840 55%,transparent)}
${sc} .ip{border-radius:22px;padding:40px 28px 34px;margin:0 0 16px;color:var(--ip-ink)}
${sc} .ip.bg-pale{background:var(--ip-pn)}${sc} .ip.bg-white{background:var(--ip-paper);border:1px solid var(--ip-line)}${sc} .ip.bg-dark{background:#141416;color:#F2F2F4}
${sc} .ip-chip{display:inline-block;font-size:13px;font-weight:700;color:var(--ip-acc);background:var(--ip-paper);border-radius:999px;padding:6px 15px;margin:0 0 14px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
${sc} .bg-pale .ip-chip{background:var(--ip-paper)}${sc} .bg-white .ip-chip{background:var(--ip-pn)}${sc} .bg-dark .ip-chip{background:rgba(255,255,255,.1);color:#fff;box-shadow:none}
${sc} .ip h2{font-size:clamp(24px,4.8vw,36px);line-height:1.24;letter-spacing:-.035em;font-weight:800;margin:0 0 12px;word-break:keep-all}
${sc} .ip h2 em{font-style:normal;background:linear-gradient(transparent 58%,var(--ip-hl) 58%)}${sc} .ip h2 i{font-style:normal;color:var(--ip-acc)}
${sc} .bg-dark h2 em{background:linear-gradient(transparent 58%,rgba(255,200,64,.45) 58%)}${sc} .bg-dark h2 i{color:#FFC840}
${sc} .ip-sub{font-size:15px;line-height:1.65;color:var(--ip-ink2);margin:0 0 22px;max-width:620px;word-break:keep-all}${sc} .ip-sub b{color:var(--ip-ink)}
${sc} .bg-dark .ip-sub{color:#B9BAC0}${sc} .bg-dark .ip-sub b{color:#fff}
${sc} .ip.lay-center{text-align:center}${sc} .lay-center .ip-sub{margin-left:auto;margin-right:auto}
${sc} .ip.lay-split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:28px;align-items:center}
@media(max-width:760px){${sc} .ip.lay-split{grid-template-columns:1fr}}
${sc} .ip-three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;max-width:900px;margin:0 auto}
@media(max-width:720px){${sc} .ip-three{grid-template-columns:1fr;max-width:420px}}
${sc} .ip figure{margin:0}${sc} .ip figure iframe{display:block;width:100%;border:0;border-radius:16px;background:#fff;box-shadow:0 8px 24px rgba(23,23,27,.10)}
${sc} .ip figcaption{font-size:14px;font-weight:700;margin-top:10px}${sc} .ip figcaption b{color:var(--ip-acc);margin-right:4px}${sc} .ip figcaption span{display:block;font-size:12.5px;font-weight:500;color:var(--ip-ink3);margin-top:2px}
${sc} .ip-bub{display:flex;align-items:center;gap:10px;max-width:660px;margin:12px 0 0;text-align:left;background:var(--ip-paper);border-radius:18px;padding:12px;box-shadow:0 8px 24px rgba(23,23,27,.08)}
${sc} .lay-center .ip-bub{margin-left:auto;margin-right:auto}
${sc} .ip-bub p{flex:1;min-width:0;margin:0;background:var(--ip-acc);color:#fff;border-radius:12px;padding:13px 16px;font-size:15px;font-weight:700;line-height:1.5;word-break:keep-all;overflow-wrap:anywhere;white-space:pre-wrap}
${sc} .ip-bub.plain p{background:var(--ip-wash);color:var(--ip-ink3);font-weight:500}
${sc} .ip-bub.code p{font-family:ui-monospace,'JetBrains Mono',monospace;font-size:13px;font-weight:600}
${sc} .bg-dark .ip-bub{background:#22232a;box-shadow:none}${sc} .bg-dark .ip-bub p{background:#FFC840;color:#141416}
${sc} .ip-bub .mk{flex:none;width:22px;text-align:center;font-weight:800;color:#17B26A}${sc} .ip-bub.plain .mk{color:#C0392B}
${sc} .ip-bub .copy{flex:none;border:1px solid var(--ip-line);background:var(--ip-paper);border-radius:9px;padding:8px 12px;font-size:12.5px;font-weight:600;cursor:pointer;color:var(--ip-ink2)}
${sc} .bg-dark .ip-bub .copy{background:#2c2d35;border-color:#3a3b44;color:#ddd}
${sc} .ip-blocks{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 6px}
${sc} .ip-blocks span{border-radius:12px;padding:12px 14px;font-size:14.5px;font-weight:800;background:var(--ip-paper);box-shadow:0 2px 8px rgba(23,23,27,.06)}
${sc} .ip-blocks span:nth-child(2){background:var(--ip-acc);color:#fff}${sc} .ip-blocks span:nth-child(3){background:var(--ip-hl)}${sc} .ip-blocks span:nth-child(4){background:var(--ip-ink);color:var(--ip-paper)}
${sc} .ip-rows{display:grid;gap:8px}
${sc} .ip-rows a.r{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 14px;align-items:center;background:var(--ip-paper);border:1px solid var(--ip-line);border-radius:14px;padding:12px 16px;text-decoration:none;color:var(--ip-ink)}
${sc} .ip-rows a.r:hover{border-color:var(--ip-acc)}
${sc} .ip-rows .w{font-size:14.5px;font-weight:700;color:var(--ip-ink2);word-break:keep-all}
${sc} .ip-rows .n{display:flex;gap:6px;align-items:center;justify-content:flex-end;flex-wrap:wrap}
${sc} .ip-rows .n b{font-size:13px;font-weight:800;color:var(--ip-acc);background:var(--ip-pn);border-radius:999px;padding:5px 12px}
${sc} .ip-rows .n code{font-family:ui-monospace,monospace;font-size:11px;color:#0F766E}
${sc} .ip-rows .v{grid-column:1/-1;font-size:12.5px;color:var(--ip-ink3);word-break:keep-all}
@media(max-width:560px){${sc} .ip-rows a.r{grid-template-columns:1fr}${sc} .ip-rows .n{justify-content:flex-start}}
${sc} .ip-tags{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0}${sc} .ip-tags span{font-family:ui-monospace,monospace;font-size:12.5px;font-weight:600;color:#0F766E;background:var(--ip-paper);border:1px solid var(--ip-line);border-radius:8px;padding:4px 9px}
${sc} .ip-list{margin:0;padding:0;list-style:none;display:grid;gap:8px}${sc} .ip-list li{background:var(--ip-paper);border:1px solid var(--ip-line);border-radius:12px;padding:10px 13px;font-size:13.5px;line-height:1.55;word-break:keep-all}${sc} .ip-list li b{color:var(--ip-acc);margin-right:6px}
${sc} .ip-code{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media(max-width:640px){${sc} .ip-code{grid-template-columns:1fr}}
${sc} .ip-code div{background:#16171b;color:#e6e6ea;border-radius:12px;padding:12px 14px;min-width:0}${sc} .ip-code .dt{font-size:11.5px;font-weight:700;margin-bottom:6px}${sc} .ip-code .bad .dt{color:#ff8a7a}${sc} .ip-code .good .dt{color:#7CFF8A}
${sc} .ip-code pre{margin:0;font-family:ui-monospace,monospace;font-size:11.5px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere;max-height:260px;overflow:auto}
${sc} .ip-term{background:#16171b;color:#ff8a7a;font-family:ui-monospace,monospace;font-size:12.5px;border-radius:12px;padding:12px 14px;text-align:left;overflow-wrap:anywhere;line-height:1.5}${sc} .ip-term b{color:#9aa0aa;font-weight:500;margin-right:6px}
${sc} .ip-card{background:var(--ip-paper);border:1px solid var(--ip-line);border-radius:16px;padding:16px;text-align:left;box-shadow:0 8px 24px rgba(23,23,27,.06)}
${sc} .ip-card h4{margin:0 0 4px;font-size:16px}${sc} .ip-card .al{font-size:12.5px;color:var(--ip-acc);font-weight:600}${sc} .ip-card p{font-size:12.5px;color:var(--ip-ink2);margin:6px 0 0;line-height:1.55}${sc} .ip-card code{display:block;font-family:ui-monospace,monospace;font-size:11px;color:#0F766E;margin-top:8px;white-space:normal}
${sc} .ip-big{font-size:clamp(26px,5vw,40px);font-weight:800;letter-spacing:-.03em;line-height:1.1}${sc} .ip-big small{display:block;font-size:12.5px;font-weight:600;color:var(--ip-ink3);margin-top:6px;letter-spacing:0}
${sc} .ip-foot{font-size:13px;color:var(--ip-ink3);margin:16px 0 0;line-height:1.7}${sc} .ip-foot a{color:inherit}${sc} .bg-dark .ip-foot{color:#8d8e96}
${sc} .ip-gh{display:inline-flex;margin:14px 0 0;padding:10px 16px;border-radius:11px;background:#2c2d35;color:#fff;text-decoration:none;font-size:13.5px;font-weight:600}`;
const ipBub = (text, kind = '', mark = '') => `<div class="ip-bub ${kind}">${mark ? `<span class="mk">${mark}</span>` : ''}<p>${esc(text)}</p>${kind === 'plain' ? '' : `<button class="copy" data-copy="${attr(text)}" title="문장 복사">복사</button>`}</div>`;
const ipFormula = f => `<div class="ip-blocks">${f.pattern.split(/\s*(?:\+|→)\s*/).map(p => `<span>${esc(p)}</span>`).join('')}</div>${ipBub(f.bad, 'plain', '✕')}${ipBub(f.good, '', '○')}`;
const ipInstall = slug => `${ipBub('/plugin marketplace add hanmariyang/giting-skills', 'code')}${ipBub(`/plugin install ${slug}@giting`, 'code')}
  <a class="ip-gh" href="https://github.com/hanmariyang/giting-skills" target="_blank" rel="noopener">GitHub에서 오픈소스 보기 &#8599;</a>`;
const ipPanels = (name, sc, vars, panels) => {
  const P = panels.filter(Boolean);
  P.forEach((p, i) => {
    const prev = P[i - 1];
    if (p.lay === 'center' && i > 0) { console.error(`${name} 인트로: 가운데 판은 첫 판만 (${i + 1}번째)`); process.exit(1); }
    if (prev && prev.lay === p.lay) { console.error(`${name} 인트로: 같은 판 꼴 연달아 (${p.lay}, ${i}·${i + 1}번째)`); process.exit(1); }
    if (prev && prev.bg === p.bg) { console.error(`${name} 인트로: 같은 바탕 연달아 (${p.bg}, ${i}·${i + 1}번째)`); process.exit(1); }
  });
  const head = p => `<span class="ip-chip">${esc(p.chip)}</span><h2>${p.h}</h2>${p.sub ? `<p class="ip-sub">${p.sub}</p>` : ''}`;
  return `<style>${ipCss(sc, vars)}</style>
${P.map(p => p.lay === 'split'
    ? `<section class="ip lay-split bg-${p.bg}"><div>${head(p)}${p.body || ''}</div><div>${p.aside || ''}</div></section>`
    : `<section class="ip lay-${p.lay} bg-${p.bg}">${head(p)}${p.body || ''}</section>`).join('\n')}`;
};

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
<title>${it.name.ko} ${it.name.en} · UI 메뉴판</title>
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
// 레시피 데모도 자가완결 파일로 (조립된 화면 실물)
const rcode = {};
for (const r of (menu.recipes || [])) {
  if (!frags[r.id]) { console.error('레시피 데모 없음:', r.id); process.exit(1); }
  rcode[r.id] = standalone({ id: r.id, name: { ko: r.screen, en: r.combo.join('+') } });
  writeFileSync(join(PLUGIN, 'components', `${r.id}.html`), rcode[r.id]);
}

// ── 2-1. 자동 시연 (갤러리 iframe 전용 — 복사 코드·components/ 에는 안 들어간다) ──
const demoSteps = JSON.parse(readFileSync(join(PLUGIN, 'demo-steps.json'), 'utf8'));
const stepIds = Object.keys(demoSteps).filter(k => !k.startsWith('_'));
const strayStep = stepIds.filter(id => !frags[id]);
if (strayStep.length) { console.error('데모 없는 시연 단계:', strayStep.join(', ')); process.exit(1); }

// iframe 안에서 도는 시연기. 부모가 {uim:'play'|'stop'} 을 보낸다.
// :hover·:active·:focus 는 스크립트로 못 켜므로 같은 규칙을 .uim-* 클래스로 복제해 켠다.
// 진짜 사람 입력(isTrusted)이 오면 즉시 멈추고 부모에게 알린다 — 그 카드는 다시 자동으로 돌지 않는다.
const RUNNER = `(function () {
  var S = window.UIM || [], run = 0, cur, alive = false;
  var MAP = [[/:hover/g, '.uim-hover'], [/:active/g, '.uim-active'], [/:focus-visible/g, '.uim-focus'], [/:focus(?![-\\w])/g, '.uim-focus']];
  function clone(list, sheet) {
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (r.cssRules && r.media) { clone(r.cssRules, sheet); continue; }
      if (!r.selectorText || !/:(hover|active|focus)/.test(r.selectorText)) continue;
      var sel = r.selectorText; MAP.forEach(function (m) { sel = sel.replace(m[0], m[1]); });
      try { sheet.insertRule(sel + '{' + r.style.cssText + '}', sheet.cssRules.length); } catch (e) {}
    }
  }
  try { var st = document.createElement('style'); document.head.appendChild(st);
    [].forEach.call(document.styleSheets, function (s) { if (s.ownerNode !== st) try { clone(s.cssRules, st.sheet); } catch (e) {} }); } catch (e) {}
  function cursor() {
    if (cur) return cur;
    cur = document.createElement('div');
    cur.setAttribute('aria-hidden', 'true');
    cur.style.cssText = 'position:fixed;left:0;top:0;width:18px;height:18px;z-index:2147483647;pointer-events:none;transition:transform .45s cubic-bezier(.3,.7,.2,1),opacity .2s;opacity:0;transform:translate(60vw,80vh)';
    cur.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18"><path d="M2 1.5l12 7.2-5.3 1.2-2.6 5.1z" fill="#17171b" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    document.body.appendChild(cur); return cur;
  }
  function q(sel) { return document.querySelector(sel); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function moveTo(el) {
    var c = cursor(), b = el.getBoundingClientRect();
    c.style.opacity = '1';
    c.style.transform = 'translate(' + (b.left + Math.min(b.width / 2, 40)) + 'px,' + (b.top + b.height / 2) + 'px)';
    return wait(480);
  }
  function chain(el, cls, on) { for (var n = el; n && n.classList; n = n.parentElement) n.classList.toggle(cls, on); }
  function fire(el, type) { el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window })); }
  function setVal(el, v) {
    var proto = el.tagName === 'SELECT' ? HTMLSelectElement : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement : HTMLInputElement;
    Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  var OPS = {
    wait: function (ms) { return wait(ms); },
    tap: function (sel) { var el = q(sel); if (!el) return; return moveTo(el).then(function () {
      chain(el, 'uim-hover', true); chain(el, 'uim-active', true); fire(el, 'mousedown');
      return wait(140); }).then(function () { chain(el, 'uim-active', false); fire(el, 'mouseup'); el.click(); return wait(220); })
      .then(function () { chain(el, 'uim-hover', false); }); },
    hover: function (sel, ms) { var el = q(sel); if (!el) return; return moveTo(el).then(function () {
      chain(el, 'uim-hover', true); fire(el, 'mouseover'); fire(el, 'mouseenter'); return wait(ms || 900); })
      .then(function () { chain(el, 'uim-hover', false); fire(el, 'mouseout'); fire(el, 'mouseleave'); }); },
    press: function (sel, ms) { var el = q(sel); if (!el) return; return moveTo(el).then(function () {
      chain(el, 'uim-hover', true); chain(el, 'uim-active', true); return wait(ms || 500); })
      .then(function () { chain(el, 'uim-active', false); chain(el, 'uim-hover', false); }); },
    focus: function (sel) { var el = q(sel); if (!el) return; return moveTo(el).then(function () {
      try { el.focus({ focusVisible: true, preventScroll: true }); } catch (e) { el.focus(); } el.classList.add('uim-focus'); return wait(200); }); },
    blur: function () { var a = document.activeElement; if (a && a.blur) a.blur();
      [].forEach.call(document.querySelectorAll('.uim-focus'), function (n) { n.classList.remove('uim-focus'); }); },
    type: function (sel, text) { var el = q(sel); if (!el) return; return OPS.focus(sel).then(function () {
      var i = 0; return (function next() { if (i >= text.length || !alive) return;
        setVal(el, el.value + text[i++]); return wait(85).then(next); })(); }); },
    clear: function (sel) { var el = q(sel); if (el) setVal(el, ''); },
    key: function (sel, key) { var el = q(sel); if (!el) return;
      el.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true, cancelable: true })); return wait(150); },
    set: function (sel, v) { var el = q(sel); if (!el) return; return moveTo(el).then(function () {
      if (el.type !== 'range') { setVal(el, el.tagName === 'SELECT' ? [].filter.call(el.options, function (o) { return o.text === String(v) || o.value === String(v); }).map(function (o) { return o.value; })[0] || v : v); return wait(200); }
      var from = +el.value, to = +v, n = 14, k = 0;
      return (function step() { if (k++ >= n || !alive) return; setVal(el, Math.round(from + (to - from) * k / n)); return wait(35).then(step); })(); }); },
    scroll: function (sel, px) { var el = q(sel); if (!el) return; return moveTo(el).then(function () {
      el.scrollBy({ top: px, behavior: 'smooth' }); return wait(600); }); },
    drag: function (a, b) { var s = q(a), t = q(b); if (!s || !t) return; var dt = new DataTransfer();
      return moveTo(s).then(function () { s.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt })); return moveTo(t); })
      .then(function () { t.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt })); return wait(300); })
      .then(function () { t.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
        s.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt })); }); }
  };
  function play() {
    if (alive) return; alive = true; var my = ++run, i = 0;
    (function next() {
      if (!alive || my !== run) return;
      if (i >= S.length) { if (cur) cur.style.opacity = '0'; parent.postMessage({ uim: 'done' }, '*'); alive = false; return; }
      var s = S[i++]; Promise.resolve(OPS[s[0]] && OPS[s[0]].apply(null, s.slice(1))).then(next, next);
    })();
  }
  function stop() { alive = false; run++; if (cur) cur.style.opacity = '0'; }
  addEventListener('message', function (e) { if (e.source !== parent || !e.data) return;
    if (e.data.uim === 'play') play(); else if (e.data.uim === 'stop') stop(); });
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (t) {
    addEventListener(t, function (e) { if (!e.isTrusted) return; if (alive) { stop(); } parent.postMessage({ uim: 'user' }, '*'); }, true);
  });
  parent.postMessage({ uim: 'ready' }, '*');
})();`;
const demoDoc = (id, doc) => demoSteps[id]
  ? doc.replace(/<\/body>\s*<\/html>\s*$/, `<script>window.UIM=${JSON.stringify(demoSteps[id]).replace(/</g, '\\u003c')};${RUNNER}</script>\n</body>\n</html>\n`)
  : doc;

// 「프롬프트」 버튼이 복사하는 지침 (코드는 클릭 때 카드의 코드 상자에서 붙인다 — 페이지에 코드를 두 번 싣지 않는다)
const PROMPT_TAIL = [
  '지침',
  '1. 먼저 이 프로젝트의 프레임워크, 스타일 방식, 테마(다크 모드) 방식을 확인하고 그 방식으로 옮기세요. 견본 HTML 을 그대로 붙이지 마세요.',
  '2. 색·간격·둥글기는 프로젝트에 이미 있는 값(토큰·변수)을 쓰세요. 견본의 색은 자리 표시일 뿐입니다.',
  '3. 키보드로 끝까지 조작되게 하고, 포커스가 보이게 하고, 동작 줄이기 설정을 지키세요.',
  '4. 이미 비슷한 요소가 있으면 새로 만들지 말고 그것을 고치세요.',
  '5. 끝나면 세 칸으로 나눠 알려 주세요: 바꾼 파일 / 확인한 것(라이트·다크, 모바일 폭, 키보드) / 확인하지 못한 것.',
].join('\n');

// ── 3. 갤러리 ──────────────────────────────────────────────────
const bycat = id => menu.items.filter(i => i.category === id);

const cardHtml = it => `
<article class="item" id="${it.id}">
  <header><h3>${it.name.ko}</h3><span class="en">${it.name.en}</span>
    <button class="copy tiny" data-copy="${attr(it.ask)}" title="요청 문장 복사">문장</button>
    <button class="tiny promptbtn" data-ask="${attr(it.ask)}" data-name="${attr(`${it.name.ko} (${it.name.en})`)}" data-alias="${attr(it.aliases.join(' · '))}" title="요청 문장 + 견본 코드 + 적용 지침 복사">프롬프트</button>
    <button class="tiny codebtn" title="코드 보기">코드</button>
    <button class="tiny linkbtn" data-id="${it.id}" title="이 항목 주소 복사" aria-label="${it.name.ko} 주소 복사">#</button>
  </header>
  <iframe title="${it.name.ko} 데모" loading="lazy"${demoSteps[it.id] ? ' data-demo' : ''} style="height:${frags[it.id].h}px" srcdoc="${attr(demoDoc(it.id, code[it.id]))}"></iframe>
  <footer><span class="al">"${esc(it.aliases[0])}"</span><span class="one">${esc(it.oneliner)}</span>${it.vs ? `<span class="vs">↔ ${esc(it.vs)}</span>` : ''}${it.sc ? `<span class="vs sc">shadcn: ${esc(it.sc)}</span>` : ''}${it.touch ? `<span class="vs touch">폰에서는: ${esc(it.touch)}</span>` : ''}</footer>
  <div class="codebox" hidden><pre><code>${esc(code[it.id])}</code></pre><button class="copy tiny">코드 복사</button></div>
</article>`;

const tableHtml = cat => `
<div class="tblwrap"><table>
<thead><tr><th>한글</th><th>영문</th><th>shadcn에선</th><th>이렇게 말해도 통해요</th><th>AI에게 이렇게</th></tr></thead>
<tbody>
${bycat(cat.id).map(it => `<tr>
  <td><a href="#${it.id}">${it.name.ko}</a></td>
  <td class="mono">${it.name.en}</td>
  <td class="mono sc">${it.sc ? esc(it.sc) : '·'}</td>
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
<title>UI 메뉴판 · Giting Skills</title>
<meta name="description" content="'접었다 폈다 되는 거'에는 이름이 있습니다. ${menu.categories.length}개 코스 ${menu.items.length}개 항목: 전부 그림이 아니라 실제로 동작하는 HTML. AI가 쓸 수 있는 Claude Code 스킬로 배포됩니다.">
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
  td.mono.sc { white-space: normal; min-width: 150px; color: #0F766E; }
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
    <p class="sub">말로 설명하던 UI에 이름을 붙여 주는 사전. ${menu.categories.length}개 코스 <b>${menu.items.length}개 항목</b>이 전부 그림이 아니라 <b>실제로 동작하는 HTML</b>이고, 항목마다 AI에게 그대로 쓰는 요청 문장이 붙어 있습니다. AI가 직접 읽도록 Claude Code 스킬로도 배포됩니다.</p>

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
    <a href="https://giting.kr">giting.kr: 오픈소스를 별점이 아니라 실측으로</a>
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
const dict = full => `# UI 메뉴판 (ui-menu) · Giting Skills

> 말로 설명하던 UI에 이름을 붙여 주는 사전. 별칭(사람이 실제로 하는 말) → 정식 명칭 → 바로 쓰는 요청 문장 → 실물 HTML. ${menu.categories.length}개 코스 ${menu.items.length}개 항목.
> AI한테 시키는 공식: ${f.pattern}
>   ✕ "${f.bad}" → ○ "${f.good}"
> 갤러리: https://giting.kr/skills/ · repo: https://github.com/hanmariyang/giting-skills (MIT)
> Claude Code 설치: /plugin marketplace add hanmariyang/giting-skills → /plugin install ui-menu@giting

${menu.categories.map(cat => `## ${cat.no} ${cat.ko}

${bycat(cat.id).map(it => `### ${it.name.ko} (${it.name.en})
- 별칭: ${it.aliases.map(a => `"${a}"`).join(' · ')}
- 정의: ${it.oneliner}${it.vs ? `
- 구분: ${it.vs}` : ''}${it.touch ? `
- 폰에서는: ${it.touch}` : ''}${it.sc ? `
- shadcn: ${it.sc}` : ''}
- 요청 문장: ${it.ask}
- 레퍼런스: ${RAW}/${it.id}.html${full ? `

\`\`\`html
${code[it.id].trim()}
\`\`\`` : ''}
`).join('\n')}`).join('\n')}
${menu.recipes ? `
## 화면 조합 레시피 (shadcn: 조립하지 재발명하지 마라)

${menu.recipes.map(r => `### ${r.screen} · ${r.ko}
- 조합: ${r.combo.join(' + ')}
- shadcn: ${r.sc}
- 요청 문장: ${r.ask}`).join('\n\n')}` : ''}`;

// ── 5. 출력 ────────────────────────────────────────────────────
// 정본 갤러리 = giting.kr/skills (2026-09-12 owner 확정 — 우리 도메인에서 서빙, GitHub 은 소스 버튼).
// GITING_SITE_DIR 이 있으면(워크스페이스: ../giting/site/static/skills) 그쪽에 갤러리·llms 를 쓰고,
// docs/(github.io) 는 리다이렉트 + llms 미러(구 링크 소비자용)만 유지한다. promo 이미지는 양쪽 다.
const SITE_DIR = process.env.GITING_SITE_DIR;
const redirect = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=https://giting.kr/skills/">
<link rel="canonical" href="https://giting.kr/skills/">
<title>UI 메뉴판 · giting.kr/skills 로 이동</title>
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
.uigal .item .vs.sc { color: #0F766E; border-top: 0; padding-top: 0; font-family: var(--mono); font-size: 11px; }
.uigal .item .vs.touch { color: #8A5A12; border-top: 0; padding-top: 0; }
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
.uigal td.mono.sc { white-space: normal; min-width: 150px; color: #0F766E; }
.uigal td.als { color: var(--ink-3); font-size: 12px; }
.uigal td.askcell { min-width: 220px; }
.uigal td.askcell span { color: var(--ink-2); }
.uigal td.askcell button { margin-left: 6px; }
.uigal .rcp { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 720px) { .uigal .rcp { grid-template-columns: 1fr; } }
.uigal .rcpi { border: 1px solid var(--line); border-radius: 13px; background: var(--paper); padding: 13px 15px; }
.uigal .rcpi header { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; }
.uigal .rcpi h3 { margin: 0; font-size: 15px; font-weight: 700; }
.uigal .rcpk { flex: 1; min-width: 0; font-size: 12px; color: var(--ink-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.uigal .rcpc { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 9px; }
.uigal .rcptag { font-family: var(--mono); font-size: 11.5px; color: #0F766E; background: color-mix(in srgb, #0F766E 8%, transparent); border: 1px solid color-mix(in srgb, #0F766E 22%, transparent); border-radius: 6px; padding: 2px 8px; }
.uigal .rcpi iframe { width: 100%; border: 0; border-radius: 9px; display: block; background: #fff; margin: 4px 0 10px; border: 1px solid var(--line); }
.uigal .rcpsc { margin: 0; font-size: 12.5px; color: var(--ink-2); line-height: 1.55; }`;

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

// ui-menu 갤러리에만 붙는 것 (CORE_* 는 다른 사전들이 접두어만 바꿔 같이 쓴다)
const UI_CSS = `
.uigal .item { scroll-margin-top: 90px; }
.uigal .item:target { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent); }
.uigal .gtools { display: flex; align-items: center; gap: 8px; margin: 10px 0 0; font-size: 12.5px; color: var(--ink-3); }
.uigal .autobtn { border: 1px solid var(--line); background: var(--paper); color: var(--ink-2); border-radius: 999px; padding: 4px 11px; font: inherit; font-size: 12px; cursor: pointer; }
.uigal .autobtn[aria-pressed="false"] { color: var(--ink-3); }
.uigal .autobtn:focus-visible, .uigal .tiny:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }`;

const UI_JS = `
(function () {
  var root = document.querySelector('.uigal');
  if (!root) return;
  function flash(btn, t) { var old = btn.textContent; btn.textContent = t; btn.classList.add('ok');
    setTimeout(function () { btn.textContent = old; btn.classList.remove('ok'); }, 1100); }
  function put(text) { try { return navigator.clipboard.writeText(text); } catch (e) { return Promise.reject(e); } }
  var TAIL = ${JSON.stringify(PROMPT_TAIL)};
  root.addEventListener('click', function (e) {
    var pb = e.target.closest('.promptbtn');
    if (pb) {
      var card = pb.closest('.item'), code = card.querySelector('.codebox code').textContent;
      var text = pb.dataset.ask + '\\n\\n' +
        '이 UI 의 이름은 ' + pb.dataset.name + ' 입니다. 흔히 "' + pb.dataset.alias.split(' · ').join('", "') + '" 라고도 부릅니다.\\n' +
        '아래는 동작을 보여 주는 견본입니다(의존성 없는 HTML 한 장).\\n\\n\\u0060\\u0060\\u0060html\\n' + code.trim() + '\\n\\u0060\\u0060\\u0060\\n\\n' + TAIL + '\\n\\n' +
        '[넣을 곳] 페이지나 컴포넌트 이름을 적으세요\\n[바꿀 것] 기존 요소를 바꾸는 거라면 적으세요 (없으면 지우기)';
      put(text).then(function () { flash(pb, '복사됨'); }, function () { flash(pb, '복사 안 됨'); });
      return;
    }
    var lb = e.target.closest('.linkbtn');
    if (lb) {
      var url = location.origin + location.pathname + '#' + lb.dataset.id;
      try { history.replaceState(null, '', '#' + lb.dataset.id); } catch (err) {}
      put(url).then(function () { flash(lb, '✓'); }, function () {});
    }
  });

  // 자동 시연 — 화면에 보이는 카드만, 사람 손이 닿으면 그 카드는 멈춘다, 동작 줄이기면 아예 안 돈다
  var frames = [].slice.call(root.querySelectorAll('iframe[data-demo]'));
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var on = !reduce; try { if (localStorage.getItem('uim-auto') === 'off') on = false; } catch (e) {}
  var st = new Map(); // iframe → { vis, user, ready, loops, busy }
  frames.forEach(function (f) { st.set(f, { vis: false, user: false, ready: false, loops: 0, busy: false }); });
  // 큰 페이지에서는 iframe 이 이 스크립트보다 먼저 떠서 'ready' 를 놓친다(2026-10-14 운영에서 자동 시연이 안 돌던 원인). 이미 뜬 것은 여기서 준비로 친다.
  frames.forEach(function (f) {
    function mark() { try { if (f.contentWindow && f.contentWindow.UIM && f.contentDocument.readyState === 'complete') { var s = st.get(f); if (!s.busy) { s.ready = true; kick(f); } } } catch (e) {} }
    f.addEventListener('load', mark); mark();
  });
  function byWin(w) { for (var i = 0; i < frames.length; i++) if (frames[i].contentWindow === w) return frames[i]; }
  function send(f, m) { try { f.contentWindow.postMessage({ uim: m }, '*'); } catch (e) {} }
  function kick(f) { var s = st.get(f); if (on && s.vis && s.ready && !s.user && !s.busy && s.loops < 3) { s.busy = true; send(f, 'play'); } }
  addEventListener('message', function (e) {
    var f = e.data && e.data.uim && byWin(e.source); if (!f) return; var s = st.get(f);
    if (e.data.uim === 'ready') { s.ready = true; s.busy = false; kick(f); }
    else if (e.data.uim === 'user') { s.user = true; s.busy = false; }
    else if (e.data.uim === 'done') { s.loops++; s.busy = false;
      if (s.loops < 3 && on && s.vis && !s.user) setTimeout(function () { if (s.vis && on && !s.user) { s.ready = false; f.srcdoc = f.srcdoc; } }, 1400); }
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) {
      var s = st.get(en.target); s.vis = en.isIntersecting;
      if (s.vis) kick(en.target); else { send(en.target, 'stop'); s.busy = false; }
    }); }, { threshold: 0.6 });
    frames.forEach(function (f) { io.observe(f); });
  }
  var btn = root.querySelector('.autobtn');
  if (btn) {
    if (reduce) { btn.hidden = true; }
    btn.setAttribute('aria-pressed', on ? 'true' : 'false'); btn.textContent = on ? '자동 시연 끄기' : '자동 시연 켜기';
    btn.addEventListener('click', function () {
      on = !on; try { localStorage.setItem('uim-auto', on ? 'on' : 'off'); } catch (e) {}
      btn.setAttribute('aria-pressed', on ? 'true' : 'false'); btn.textContent = on ? '자동 시연 끄기' : '자동 시연 켜기';
      frames.forEach(function (f) { var s = st.get(f); if (on) { s.loops = 0; kick(f); } else { send(f, 'stop'); s.busy = false; } });
    });
  }
})();`;

// 상세페이지 결 인트로(2026-10-23, 모션 메뉴판과 같은 문법). 원래 있던 것은 하나도 빼지 않는다(의뢰자):
// 소개 문장(옛 단독 갤러리 히어로) · 공식(pattern·bad·good·note) · 별칭→이름·구분(vs)·shadcn · 화면 조합 레시피 · 설치·GitHub·llms 를 판으로 올리고,
// 아래 코스 내비 · 자동 시연 · 카드(문장·프롬프트·코드·#) · 코스별 표 · 레시피 섹션은 그대로 둔다.
const UI_HERO = ['accordion', 'tabs', 'modal'];
const uiItem = id => { const it = menu.items.find(i => i.id === id); if (!it) { console.error('ui-menu 인트로가 없는 항목을 가리킴:', id); process.exit(1); } return it; };
const uiCatNo = it => (menu.categories.find(c => c.id === it.category) || {}).no || '';
const uiBub = (text, cls = '', mark = '') => `<div class="ui-bub ${cls}">${mark ? `<span class="mk2">${mark}</span>` : ''}<p>${esc(text)}</p>${cls === 'plain' ? '' : `<button class="copy tiny" data-copy="${attr(text)}" title="문장 복사">복사</button>`}</div>`;
const uiPairs = menu.categories.map(c => bycat(c.id).find(i => i.vs)).filter(Boolean);
const uiR0 = (menu.recipes || [])[0];
const uiFig = id => { const it = uiItem(id); return `<figure><iframe title="${esc(it.name.ko)} 데모" loading="lazy"${demoSteps[id] ? ' data-demo' : ''} style="height:${frags[id].h}px" srcdoc="${attr(demoDoc(id, code[id]))}"></iframe><figcaption><b>${uiCatNo(it)}</b>${esc(it.name.ko)}<span>"${esc(it.aliases[0])}"</span></figcaption></figure>`; };
const uiIntro = ipPanels('ui-menu', '.uigal', IP_VARS_THEME, [
  { lay: 'center', bg: 'pale', chip: `UI 메뉴판 · ${menu.items.length}가지`, h: '「접었다 폈다 되는 거」에는<br><em>이름</em>이 <i>있어요</i>',
    sub: `말로 설명하던 UI에 이름을 붙여 주는 사전이에요. ${menu.categories.length}개 코스 <b>${menu.items.length}개 항목</b>이 전부 그림이 아니라 <b>실제로 동작하는 HTML</b>이고, 항목마다 AI에게 그대로 쓰는 요청 문장이 붙어 있어요.`,
    body: `<div class="ip-three">${UI_HERO.map(uiFig).join('')}</div>${ipBub(uiItem(UI_HERO[0]).ask)}<p class="ip-foot">카드의 「문장」은 요청 문장을, 「프롬프트」는 문장 · 견본 코드 · 적용 지침을 한 번에, 「코드」는 HTML 을, 「#」은 그 항목 주소를 복사해요.</p>` },
  { lay: 'stack', bg: 'white', chip: 'AI한테 시키는 공식', h: '이 순서로만 말하면<br><em>한 번에</em> 통해요', sub: `${esc(f.note)} 아래 사전에서 이름을 찾고, 문장을 복사해 쓰세요.`, body: ipFormula(f) },
  { lay: 'wide', bg: 'pale', chip: '이름 찾기', h: '이런 말엔<br><em>이런 이름</em>을 써요', sub: '왼쪽이 사람들이 실제로 하는 말, 오른쪽이 AI가 알아듣는 이름이에요. 헷갈리는 짝은 <b>구분 기준</b>까지 붙어 있어요.',
    body: `<div class="ip-rows">${uiPairs.map(it => `<a class="r" href="#${it.id}"><span class="w">"${esc(it.aliases[0])}"</span><span class="n"><b>${esc(it.name.ko)}</b><code>${esc(it.sc || it.name.en)}</code></span><span class="v">↔ ${esc(it.vs)}</span></a>`).join('')}</div>` },
  uiR0 && { lay: 'split', bg: 'white', chip: '화면 조합 레시피', h: '화면 하나는<br><em>이름 몇 개</em>의 조합이에요', sub: `낱개 컴포넌트를 아는 다음 단계예요. <b>조립하지 재발명하지 않는다</b>(shadcn 공식 원칙). 흔한 화면 ${menu.recipes.length}가지가 어떤 조합인지 보여 줘요.`,
    body: `<div class="ip-tags">${uiR0.combo.map(c => `<span>${esc(c)}</span>`).join('')}</div>${ipBub(uiR0.ask)}<p class="ip-foot"><a href="#c-recipes">레시피 ${menu.recipes.length}가지 전부 보기 ↓</a></p>`,
    aside: `<figure><iframe title="${esc(uiR0.screen)} 조합 데모" loading="lazy"${demoSteps[uiR0.id] ? ' data-demo' : ''} style="height:${frags[uiR0.id].h}px" srcdoc="${attr(demoDoc(uiR0.id, rcode[uiR0.id]))}"></iframe><figcaption>${esc(uiR0.screen)}<span>${esc(uiR0.ko)}</span></figcaption></figure>` },
  { lay: 'band', bg: 'dark', chip: 'Claude Code 스킬', h: 'AI가 이 사전을<br><em>직접</em> 읽어요', sub: '스킬로 깔아 두면 「접었다 폈다 되는 거」라고만 말해도 AI가 이름을 찾아 만들어요.',
    body: `${ipInstall('ui-menu')}<p class="ip-foot">에이전트용 사전: <a href="/skills/llms.txt">llms.txt</a> / <a href="/skills/llms-full.txt">llms-full.txt</a> (코드 포함)</p>` },
]);

const core = `<div class="uigal">
<style>${CORE_CSS}${UI_CSS}</style>
${uiIntro}
<nav class="gnav" aria-label="코스">
  ${menu.categories.map(c => `<a href="#c-${c.id}"><b>${c.no}</b>${c.ko} ${bycat(c.id).length}</a>`).join('\n  ')}
</nav>
<div class="gtools"><button type="button" class="autobtn" aria-pressed="true">자동 시연 끄기</button><span>화면에 보이는 데모가 스스로 움직여요. 직접 눌러도 됩니다. 「프롬프트」는 요청 문장·견본 코드·적용 지침을 한 번에 복사하고, 「#」은 그 항목 주소를 복사해요.</span></div>
${menu.categories.map(cat => `
<section class="cat" id="c-${cat.id}">
  <h2><span class="no">${cat.no}</span> ${cat.ko} <span class="count">${bycat(cat.id).length}</span></h2>
  <div class="ggrid">${bycat(cat.id).map(cardHtml).join('\n')}</div>
  ${tableHtml(cat)}
</section>`).join('\n')}
${menu.recipes ? `
<section class="cat" id="c-recipes">
  <h2><span class="no">＋</span> 화면 조합 레시피 <span class="count">${menu.recipes.length} · shadcn</span></h2>
  <p style="font-size:13px;color:var(--ink-2);margin:-6px 0 14px">낱개 컴포넌트를 아는 다음 단계, 흔한 화면이 어떤 조합으로 만들어지는지. "조립하지 재발명하지 마라"(shadcn 공식 원칙).</p>
  <div class="rcp">${menu.recipes.map(r => `<article class="rcpi" id="${r.id}">
    <header><h3>${esc(r.screen)}</h3><span class="rcpk">${esc(r.ko)}</span>
      <button class="copy tiny" data-copy="${attr(r.ask)}" title="요청 문장 복사">문장</button></header>
    <iframe title="${esc(r.screen)} 조합 데모" loading="lazy"${demoSteps[r.id] ? ' data-demo' : ''} style="height:${frags[r.id].h}px" srcdoc="${attr(demoDoc(r.id, rcode[r.id]))}"></iframe>
    <div class="rcpc">${r.combo.map(c => `<span class="rcptag">${esc(c)}</span>`).join('')}</div>
    <p class="rcpsc">${esc(r.sc)}</p>
  </article>`).join('\n')}</div>
</section>` : ''}
<script>${CORE_JS}${UI_JS}</script>
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
  siteMsg = ' · (GITING_SITE_DIR 미설정, giting.kr 갤러리 미갱신)';
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
  .pane { min-width: 0; }
  .pane + .pane { border-left: 1px solid #e8e8ee; }
  .tag { font-size: 11px; font-weight: 800; padding: 7px 12px; }
  .bad .tag { background: #fbf1ef; color: #c4372b; }
  .good .tag { background: #eff6f1; color: #1f7a4d; }
  .stage { background: #f6f7f9; padding: 12px; position: relative; overflow: hidden; }
  @media (max-width: 430px) {
    .duo { grid-template-columns: 1fr; }
    .pane + .pane { border-left: 0; border-top: 1px solid #e8e8ee; }
  }
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
<title>"${it.name.ko}" · CSS 증상 사전</title>
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
  <iframe title="${it.name.ko} · 깨진/고친 실물" loading="lazy" style="height:${cIframeH(it)}px" srcdoc="${attr(ccode[it.id])}"></iframe>
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

// 판 리듬 인트로 — CSS 증상 사전
const cHero = cmenu.categories.slice(0, 3).map(c => cby(c.id).find(i => i.kind === 'direct')).filter(Boolean);
const cBranch = cmenu.items.find(i => i.kind === 'branch');
const cFig = it => `<figure><iframe title="${esc(it.name.ko)} · 깨진/고친 실물" loading="lazy" style="height:${cIframeH(it)}px" srcdoc="${attr(ccode[it.id])}"></iframe><figcaption>"${esc(it.name.ko)}"<span>범인 1순위 · ${esc(it.culprits[0])}</span></figcaption></figure>`;
const cssIntro = ipPanels('css-menu', '.cssgal', IP_VARS_THEME, [
  { lay: 'center', bg: 'pale', chip: `CSS 증상 사전 · ${cmenu.items.length}가지`, h: '「화면이 깨졌어요」 대신<br><em>증상</em>으로 말하면 <i>고쳐져요</i>', sub: '보이는 증상 그대로 찾으면 <b>범인 후보와 고치는 문장</b>이 나와요. 카드마다 깨진 화면과 고친 화면이 실제로 나란히 있어요.',
    body: `<div class="ip-three">${cHero.map(cFig).join('')}</div>${cHero[0] ? ipBub(cHero[0].ask) : ''}` },
  cBranch && { lay: 'split', bg: 'white', chip: '분기형', h: '이럴 땐 고치기 전에<br><em>진단</em>부터 시켜요', sub: `「${esc(cBranch.name.ko)}」처럼 원인이 여럿인 증상은 바로 고치면 엉뚱한 데를 고쳐요. 갈림길부터 묻는 문장이 붙어 있어요.`,
    body: `<ul class="ip-list">${cBranch.branches.map(b => `<li><b>${esc(b.q)}</b>${esc(b.a)}</li>`).join('')}</ul>${ipBub(cBranch.ask)}`,
    aside: `<figure><iframe title="${esc(cBranch.name.ko)} · 실물" loading="lazy" style="height:${cIframeH(cBranch)}px" srcdoc="${attr(ccode[cBranch.id])}"></iframe><figcaption>"${esc(cBranch.name.ko)}"</figcaption></figure>` },
  { lay: 'stack', bg: 'pale', chip: 'AI한테 시키는 공식', h: '증상을 그대로 말하면<br><em>엉뚱한 데</em>를 안 고쳐요', sub: esc(cf.note), body: ipFormula(cf) },
  { lay: 'wide', bg: 'white', chip: '증상 찾기', h: '이런 말엔<br><em>이런 증상</em>을 찾아요', sub: '왼쪽이 흔히 하는 말, 오른쪽이 사전의 증상 이름이에요. 누르면 그 카드로 가요.',
    body: `<div class="ip-rows">${cmenu.categories.map(c => cby(c.id)[0]).filter(Boolean).map(it => `<a class="r" href="#${it.id}"><span class="w">"${esc(it.aliases[0])}"</span><span class="n"><b>${esc(it.name.ko)}</b><code>${cKindLabel(it)}</code></span></a>`).join('')}</div>` },
  { lay: 'band', bg: 'dark', chip: 'Claude Code 스킬', h: 'AI가 이 사전으로<br><em>범인</em>부터 찾아요', sub: '스킬로 깔아 두면 「팝업 뒤가 스크롤돼요」라고만 말해도 증상을 찾아 고쳐요.', body: ipInstall('css-menu') },
]);
const cssCore = `<div class="cssgal">
<style>${CSSGAL_CSS}</style>
${cssIntro}
<nav class="gnav" aria-label="코스">
  ${cmenu.categories.map(c => `<a href="#c-${c.id}"><b>${c.no}</b>${c.ko} ${cby(c.id).length}</a>`).join('\n  ')}
</nav>
${cmenu.categories.map(cat => `
<section class="cat" id="c-${cat.id}">
  <h2><span class="no">${cat.no}</span> ${cat.ko} <span class="count">${cby(cat.id).length}</span></h2>
  <div class="ggrid">${cby(cat.id).map(cCardHtml).join('\n')}</div>
  ${cTableHtml(cat)}
</section>`).join('\n')}
<script>${CORE_JS.replace(/\.uigal/g, '.cssgal')}
(function () {
  var root = document.querySelector('.cssgal');
  if (!root) return;
  function fit(f) {
    try {
      var d = f.contentDocument;
      if (!d || !d.body) return;
      var h = d.documentElement.scrollHeight;
      if (h > 40) f.style.height = h + 'px';
    } catch (e) {}
  }
  var frames = root.querySelectorAll('iframe');
  frames.forEach(function (f) {
    f.addEventListener('load', function () { fit(f); setTimeout(function () { fit(f); }, 300); });
    fit(f);
  });
  var tm;
  window.addEventListener('resize', function () {
    clearTimeout(tm);
    tm = setTimeout(function () { frames.forEach(fit); }, 200);
  });
})();
</script>
</div>
`;

const cdict = full => `# CSS 증상 사전 (css-menu) · Giting Skills

> 깨진 화면을 CSS 용어가 아니라 증상으로 찾는 사전. 증상(사람 말) → 범인 후보 → 처방 또는 갈림길 진단 → AI에게 시키는 문장 → 깨진/고친 실물. 8개 코스 ${cmenu.items.length}개 항목.
> 항목 유형 2가지: [즉방형]: 상황 불문 같은 처방, 문장을 그대로 쓴다. [분기형]: 상황 의존: 바로 고치라고 하지 말고 진단부터 시킨다.
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

// ═══════════════════════════════════════════════════════════════
// ── 안 만들어도 되는 것 사전 (codelazy) — 03 ──────────────────
// 매체가 화면이 아니라 코드. before/after 를 나란히 보여준다(iframe 없음).
const LP = join(ROOT, 'plugins', 'codelazy');
const lmenu = JSON.parse(readFileSync(join(LP, 'menu.json'), 'utf8'));
const lby = id => lmenu.items.filter(i => i.category === id);
const lKind = it => it.kind === 'branch' ? '분기형' : '즉방형';

const lCardHtml = it => `
<article class="item ${it.kind}" id="${it.id}">
  <header><span class="kind ${it.kind}">${lKind(it)}</span><h3>"${esc(it.name)}"</h3>
    ${it.measured ? `<span class="meas">${esc(it.measured)}</span>` : ''}
    <button class="copy tiny" data-copy="${attr(it.ask)}" title="요청 문장 복사">문장</button></header>
  <div class="diff">
    <div class="side bad"><div class="dt">✗ 부풀린 코드</div><pre><code>${esc(it.before)}</code></pre></div>
    <div class="side good"><div class="dt">✓ 표준으로</div><pre><code>${esc(it.after)}</code></pre></div>
  </div>
  <footer>
    ${it.kind === 'branch'
      ? `<span class="one"><b>갈림길:</b> ${it.branches.map(b => esc(b.q)).join(' / ')}</span>`
      : `<span class="one"><b>처방:</b> ${esc(it.rx)}</span>`}
    <span class="ck">${esc(it.check)}</span>
  </footer>
</article>`;

const lTableHtml = cat => `
<div class="tblwrap"><table>
<thead><tr><th>증상</th><th>유형</th><th>이렇게 말해도</th><th>AI에게 이렇게</th></tr></thead>
<tbody>
${lby(cat.id).map(it => `<tr>
  <td><a href="#${it.id}">"${esc(it.name)}"</a></td>
  <td class="mono">${lKind(it)}</td>
  <td class="als">${it.aliases.map(a => `"${esc(a)}"`).join(' · ')}</td>
  <td class="askcell"><span>${esc(it.ask)}</span><button class="copy tiny" data-copy="${attr(it.ask)}">복사</button></td>
</tr>`).join('\n')}
</tbody></table></div>`;

const lf = lmenu.formula;
const LGAL_CSS = CORE_CSS.replace(/\.uigal/g, '.lzgal') + `
.lzgal .ggrid { grid-template-columns: 1fr; }
.lzgal .item h3 { font-size: 15px; }
.lzgal .kind { flex: none; font-size: 10.5px; font-weight: 800; border-radius: 6px; padding: 2px 7px; }
.lzgal .kind.direct { background: #eff6f1; color: #1f7a4d; }
.lzgal .kind.branch { background: #f3effa; color: #5b4aa8; }
.lzgal .meas { flex: none; font-family: var(--mono); font-size: 11px; color: var(--accent-deep); background: color-mix(in srgb, var(--accent) 8%, transparent); border-radius: 6px; padding: 2px 8px; }
.lzgal .diff { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--line); }
@media (max-width: 640px) { .lzgal .diff { grid-template-columns: 1fr; } }
.lzgal .side { background: var(--paper); min-width: 0; }
.lzgal .dt { font-size: 11px; font-weight: 800; padding: 7px 12px; }
.lzgal .bad .dt { background: #fbf1ef; color: #c4372b; }
.lzgal .good .dt { background: #eff6f1; color: #1f7a4d; }
.lzgal .side pre { margin: 0; padding: 11px 13px; overflow-x: auto; }
.lzgal .side code { font-family: var(--mono); font-size: 11.5px; line-height: 1.55; color: var(--ink); white-space: pre; }
.lzgal .item footer { display: grid; gap: 3px; }
.lzgal .item .one { font-size: 12.5px; color: var(--ink-2); }
.lzgal .item .one b { color: var(--ink); font-weight: 700; }
.lzgal .item .ck { font-size: 11.5px; color: var(--ink-3); }`;

// 판 리듬 인트로 — 안 만들어도 되는 것 사전
const lzM = lmenu.items.filter(i => i.measured);
const lzCode = it => `<div class="ip-code"><div class="bad"><div class="dt">✗ 부풀린 코드</div><pre>${esc(it.before)}</pre></div><div class="good"><div class="dt">✓ 표준으로</div><pre>${esc(it.after)}</pre></div></div>`;
const lzA = lzM[0] || lmenu.items[0], lzB = lzM[1] || lmenu.items[1];
const lzIntro = ipPanels('codelazy', '.lzgal', IP_VARS_THEME, [
  { lay: 'center', bg: 'pale', chip: `안 만들어도 되는 것 · ${lmenu.items.length}가지`, h: 'AI는 시키면 다 만들어요<br><em>안 만들어도 되는 것</em>까지', sub: esc(lf.note),
    body: `<div class="ip-big">${esc(lzA.name)}<small>${esc(lzA.measured || lzA.rx)}</small></div><div style="max-width:760px;margin:18px auto 0">${lzCode(lzA)}</div>${ipBub(lzA.ask)}` },
  { lay: 'stack', bg: 'white', chip: 'AI한테 시키는 공식', h: '만들라고 하기 전에<br><em>한 번</em> 묻게 해요', body: ipFormula(lf) },
  { lay: 'wide', bg: 'pale', chip: '증상 찾기', h: '이런 말이 나오면<br><em>표준</em>부터 봐요', sub: '왼쪽이 AI에게 흔히 하는 말, 오른쪽이 이미 있는 해법이에요.',
    body: `<div class="ip-rows">${lmenu.categories.map(c => lby(c.id)[0]).filter(Boolean).map(it => `<a class="r" href="#${it.id}"><span class="w">"${esc(it.aliases[0])}"</span><span class="n"><b>${esc(it.name)}</b></span><span class="v">→ ${esc(it.rx || it.culprit || "")}</span></a>`).join('')}</div>` },
  lzB && { lay: 'split', bg: 'white', chip: lzB.measured ? '실측' : '한 줄', h: `${esc(lzB.name)}`, sub: `<b>${esc(lzB.rx)}</b> ${esc(lzB.check)}`,
    body: ipBub(lzB.ask), aside: lzCode(lzB) },
  { lay: 'band', bg: 'dark', chip: 'Claude Code 스킬', h: '만들기 전에<br><em>AI가 먼저</em> 멈춰요', sub: '스킬로 깔아 두면 부풀기 쉬운 지점에서 「이거 표준으로 돼요」를 먼저 말해요.', body: ipInstall('codelazy') },
]);
const lzCore = `<div class="lzgal">
<style>${LGAL_CSS}</style>
${lzIntro}
<nav class="gnav" aria-label="코스">
  ${lmenu.categories.map(c => `<a href="#c-${c.id}"><b>${c.no}</b>${c.ko} ${lby(c.id).length}</a>`).join('\n  ')}
</nav>
${lmenu.categories.map(cat => `
<section class="cat" id="c-${cat.id}">
  <h2><span class="no">${cat.no}</span> ${cat.ko} <span class="count">${lby(cat.id).length}</span></h2>
  <div class="ggrid">${lby(cat.id).map(lCardHtml).join('\n')}</div>
  ${lTableHtml(cat)}
</section>`).join('\n')}
<script>${CORE_JS.replace(/\.uigal/g, '.lzgal')}</script>
</div>
`;

const ldict = () => `# 안 만들어도 되는 것 사전 (codelazy) · Giting Skills

> AI 가 부풀리기 쉬운 지점을 증상으로 짚고 표준으로 되돌리는 사전. 증상 → 범인 → 처방(즉방형) 또는 갈림길 진단(분기형) → 요청 문장 → before/after 코드. 5개 코스 ${lmenu.items.length}개 항목.
> 유형: [즉방형] 표준에 정답 있음, 바로 되돌림 · [분기형] 추상화가 때로 정당함, 진단 먼저.
> 공식: ${lf.pattern}
>   ✕ "${lf.bad}" → ○ "${lf.good}"
> 갤러리: https://giting.kr/skills/codelazy · repo: https://github.com/hanmariyang/giting-skills (MIT)
> Claude Code: /plugin install codelazy@giting

${lmenu.categories.map(cat => `## ${cat.no} ${cat.ko}

${lby(cat.id).map(it => `### "${it.name}" [${lKind(it)}]${it.measured ? ` (${it.measured})` : ''}
- 별칭: ${it.aliases.map(a => `"${a}"`).join(' · ')}
- 범인: ${it.culprit}
${it.kind === 'branch'
  ? `- 갈림길: ${it.branches.map(b => `[${b.q}] → ${b.a}`).join(' · ')}`
  : `- 처방: ${it.rx}`}
- 요청 문장: ${it.ask}
- 확인: ${it.check}
- 부풀린 코드:
\`\`\`python
${it.before}
\`\`\`
- 표준으로:
\`\`\`python
${it.after}
\`\`\`
`).join('\n')}`).join('\n')}`;

if (SITE_DIR) {
  const LS = join(SITE_DIR, 'codelazy');
  mkdirSync(LS, { recursive: true });
  writeFileSync(join(LS, 'gallery-core.html'), lzCore);
  writeFileSync(join(LS, 'llms.txt'), ldict());
  writeFileSync(join(LS, 'llms-full.txt'), ldict());
}
mkdirSync(join(ROOT, 'docs', 'codelazy'), { recursive: true });
writeFileSync(join(ROOT, 'docs', 'codelazy', 'index.html'), redirect.replace(/giting\.kr\/skills\//g, 'giting.kr/skills/codelazy'));
writeFileSync(join(ROOT, 'docs', 'codelazy', 'llms.txt'), ldict());
console.log(`built codelazy: items ${lmenu.items.length} · core ${(lzCore.length / 1024).toFixed(0)}KB`);

// ═══════════════════════════════════════════════════════════════
// ── 타입스크립트 에러 사전 (type-menu) — 04 ──────────────────
// codelazy 와 같은 코드 매체 + 에러 원문(err) 배지. before=에러코드, after=고친코드.
const TP = join(ROOT, 'plugins', 'type-menu');
const tmenu = JSON.parse(readFileSync(join(TP, 'menu.json'), 'utf8'));
const tby = id => tmenu.items.filter(i => i.category === id);
const tKind = it => it.kind === 'branch' ? '분기형' : '즉방형';

const tCardHtml = it => `
<article class="item ${it.kind}" id="${it.id}">
  <header><span class="kind ${it.kind}">${tKind(it)}</span><h3>"${esc(it.name)}"</h3>
    <span class="tcode">${esc(it.code)}</span>
    <button class="copy tiny" data-copy="${attr(it.ask)}" title="요청 문장 복사">문장</button></header>
  <div class="terr">$ tsc &nbsp;<span>${esc(it.err)}</span></div>
  <div class="diff">
    <div class="side bad"><div class="dt">✗ 에러 나는 코드</div><pre><code>${esc(it.before)}</code></pre></div>
    <div class="side good"><div class="dt">✓ 제대로 고침 (any·! 로 덮지 않음)</div><pre><code>${esc(it.after)}</code></pre></div>
  </div>
  <footer>
    ${it.kind === 'branch'
      ? `<span class="one"><b>갈림길:</b> ${it.branches.map(b => esc(b.q)).join(' / ')}</span>`
      : `<span class="one"><b>처방:</b> ${esc(it.rx)}</span>`}
    <span class="ck">${esc(it.check)}</span>
  </footer>
</article>`;

const tTableHtml = cat => `
<div class="tblwrap"><table>
<thead><tr><th>증상</th><th>코드</th><th>유형</th><th>이렇게 말해도</th><th>AI에게 이렇게</th></tr></thead>
<tbody>
${tby(cat.id).map(it => `<tr>
  <td><a href="#${it.id}">"${esc(it.name)}"</a></td>
  <td class="mono">${esc(it.code)}</td>
  <td class="mono">${tKind(it)}</td>
  <td class="als">${it.aliases.map(a => `"${esc(a)}"`).join(' · ')}</td>
  <td class="askcell"><span>${esc(it.ask)}</span><button class="copy tiny" data-copy="${attr(it.ask)}">복사</button></td>
</tr>`).join('\n')}
</tbody></table></div>`;

const tf = tmenu.formula;
const TGAL_CSS = CORE_CSS.replace(/\.uigal/g, '.tpgal') + `
.tpgal .ggrid { grid-template-columns: 1fr; }
.tpgal .item h3 { font-size: 15px; }
.tpgal .kind { flex: none; font-size: 10.5px; font-weight: 800; border-radius: 6px; padding: 2px 7px; }
.tpgal .kind.direct { background: #eff6f1; color: #1f7a4d; }
.tpgal .kind.branch { background: #f3effa; color: #5b4aa8; }
.tpgal .tcode { flex: none; font-family: var(--mono); font-size: 11px; color: var(--accent-deep); background: color-mix(in srgb, var(--accent) 8%, transparent); border-radius: 6px; padding: 2px 8px; }
.tpgal .terr { font-family: var(--mono); font-size: 11.5px; color: #c4372b; background: #2a1a18; padding: 9px 13px; overflow-x: auto; white-space: nowrap; }
.tpgal .terr span { color: #f0a090; }
.tpgal .diff { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--line); }
@media (max-width: 640px) { .tpgal .diff { grid-template-columns: 1fr; } }
.tpgal .side { background: var(--paper); min-width: 0; }
.tpgal .dt { font-size: 11px; font-weight: 800; padding: 7px 12px; }
.tpgal .bad .dt { background: #fbf1ef; color: #c4372b; }
.tpgal .good .dt { background: #eff6f1; color: #1f7a4d; }
.tpgal .side pre { margin: 0; padding: 11px 13px; overflow-x: auto; }
.tpgal .side code { font-family: var(--mono); font-size: 11.5px; line-height: 1.55; color: var(--ink); white-space: pre; }
.tpgal .item footer { display: grid; gap: 3px; }
.tpgal .item .one { font-size: 12.5px; color: var(--ink-2); }
.tpgal .item .one b { color: var(--ink); font-weight: 700; }
.tpgal .item .ck { font-size: 11.5px; color: var(--ink-3); }`;

// 판 리듬 인트로 — 타입스크립트 에러 사전
const tpHero = tmenu.categories.slice(0, 3).map(c => tby(c.id)[0]).filter(Boolean);
const tpA = tmenu.items[0];
const tpIntro = ipPanels('type-menu', '.tpgal', IP_VARS_THEME, [
  { lay: 'center', bg: 'pale', chip: `타입스크립트 에러 사전 · ${tmenu.items.length}가지`, h: '빨간 줄 영어 메시지를<br><em>사람 말</em>로 옮겨요', sub: esc(tf.note),
    body: `<div class="ip-three">${tpHero.map(it => `<figure><div class="ip-term"><b>${esc(it.code)}</b>${esc(it.err.replace(/^error TS\d+:\s*/, ''))}</div><figcaption>"${esc(it.name)}"<span>${esc(it.rx || it.culprit || "")}</span></figcaption></figure>`).join('')}</div>${tpHero[0] ? ipBub(tpHero[0].ask) : ''}` },
  { lay: 'split', bg: 'white', chip: '덮지 않고 고치기', h: '<em>any</em>로 막지 말고<br>좁혀서 고쳐요', sub: `<b>${esc(tpA.rx)}</b> ${esc(tpA.check)}`, body: ipBub(tpA.ask),
    aside: `<div class="ip-term" style="margin-bottom:10px"><b>$ tsc</b>${esc(tpA.err)}</div><div class="ip-code"><div class="bad"><div class="dt">✗ 에러 나는 코드</div><pre>${esc(tpA.before)}</pre></div><div class="good"><div class="dt">✓ 제대로 고침</div><pre>${esc(tpA.after)}</pre></div></div>` },
  { lay: 'stack', bg: 'pale', chip: 'AI한테 시키는 공식', h: '원문 그대로 붙이면<br><em>코드번호</em>로 찾아요', body: ipFormula(tf) },
  { lay: 'wide', bg: 'white', chip: '코드번호 찾기', h: '이 번호가 뜨면<br><em>이 뜻</em>이에요', sub: '왼쪽이 터미널에 뜨는 번호, 오른쪽이 사람 말이에요.',
    body: `<div class="ip-rows">${tmenu.categories.map(c => tby(c.id)[0]).filter(Boolean).map(it => `<a class="r" href="#${it.id}"><span class="w">${esc(it.code)}</span><span class="n"><b>${esc(it.name)}</b></span></a>`).join('')}</div>` },
  { lay: 'band', bg: 'dark', chip: 'Claude Code 스킬', h: '에러를 붙이면<br><em>AI가 사전</em>을 펴요', sub: '스킬로 깔아 두면 빨간 줄 원문만 붙여도 any 없이 고치는 문장으로 바꿔요.', body: ipInstall('type-menu') },
]);
const tpCore = `<div class="tpgal">
<style>${TGAL_CSS}</style>
${tpIntro}
<nav class="gnav" aria-label="코스">
  ${tmenu.categories.map(c => `<a href="#c-${c.id}"><b>${c.no}</b>${c.ko} ${tby(c.id).length}</a>`).join('\n  ')}
</nav>
${tmenu.categories.map(cat => `
<section class="cat" id="c-${cat.id}">
  <h2><span class="no">${cat.no}</span> ${cat.ko} <span class="count">${tby(cat.id).length}</span></h2>
  <div class="ggrid">${tby(cat.id).map(tCardHtml).join('\n')}</div>
  ${tTableHtml(cat)}
</section>`).join('\n')}
<script>${CORE_JS.replace(/\.uigal/g, '.tpgal')}</script>
</div>
`;

const tdict = () => `# 타입스크립트 에러 사전 (type-menu) · Giting Skills

> 영어에 코드번호로 뜨는 TS 에러를 사람 말로 옮기고 제대로 고치는 사전. 증상 → 코드번호 → 원인 → 처방(즉방형) 또는 갈림길 진단(분기형) → 요청 문장 → 실제 tsc 원문 + before/after. 6개 코스 ${tmenu.items.length}개 항목.
> 대원칙: any·! 로 덮지 않는다. 좁히기(가드·옵셔널·기본값·타입 정정)로 제대로 고친다.
> 유형: [즉방형] 방향 정해짐 · [분기형] 상황 의존, 진단 먼저.
> 공식: ${tf.pattern}
> 갤러리: https://giting.kr/skills/type-menu · repo: https://github.com/hanmariyang/giting-skills (MIT)
> Claude Code: /plugin install type-menu@giting

${tmenu.categories.map(cat => `## ${cat.no} ${cat.ko}

${tby(cat.id).map(it => `### "${it.name}" (${it.code}) [${tKind(it)}]
- 별칭: ${it.aliases.map(a => `"${a}"`).join(' · ')}
- 에러 원문: ${it.err}
- 원인: ${it.culprit}
${it.kind === 'branch'
  ? `- 갈림길: ${it.branches.map(b => `[${b.q}] → ${b.a}`).join(' · ')}`
  : `- 처방: ${it.rx}`}
- 요청 문장: ${it.ask}
- 확인: ${it.check}
- 에러 코드:
\`\`\`ts
${it.before}
\`\`\`
- 고친 코드:
\`\`\`ts
${it.after}
\`\`\`
`).join('\n')}`).join('\n')}`;

if (SITE_DIR) {
  const TS = join(SITE_DIR, 'type-menu');
  mkdirSync(TS, { recursive: true });
  writeFileSync(join(TS, 'gallery-core.html'), tpCore);
  writeFileSync(join(TS, 'llms.txt'), tdict());
  writeFileSync(join(TS, 'llms-full.txt'), tdict());
}
mkdirSync(join(ROOT, 'docs', 'type-menu'), { recursive: true });
writeFileSync(join(ROOT, 'docs', 'type-menu', 'index.html'), redirect.replace(/giting\.kr\/skills\//g, 'giting.kr/skills/type-menu'));
writeFileSync(join(ROOT, 'docs', 'type-menu', 'llms.txt'), tdict());
console.log(`built type-menu: items ${tmenu.items.length} · core ${(tpCore.length / 1024).toFixed(0)}KB`);

// ── 웹폰트 사전 (font-menu) — 05 ──────────────────────────────
// 카드마다 폰트를 실물로 렌더한다(갤러리 상단에 @import 주입). 라이선스·출처·복사용 로드 스니펫.
const FP = join(ROOT, 'plugins', 'font-menu');
const fmenu = JSON.parse(readFileSync(join(FP, 'menu.json'), 'utf8'));
const fby = id => fmenu.items.filter(i => i.category === id);
const srcClass = s => s === 'Google Fonts' ? 'google' : s === 'Fontshare' ? 'fontshare' : 'jsdelivr';
const fById = Object.fromEntries(fmenu.items.map(i => [i.id, i]));
const fPairs = fmenu.pairs || [];
const fPairGroups = fmenu.pairGroups || [];
// 짝은 사전에 있는 글꼴만 가리킨다. 없는 id 나 그 글꼴에 없는 두께를 쓰면 빌드를 멈춘다.
for (const p of fPairs) {
  if (!fPairGroups.some(g => g.id === p.group)) throw new Error(`font-menu pair ${p.id}: 없는 묶음 ${p.group}`);
  for (const side of ['title', 'sub']) {
    const f = fById[p[side].font];
    if (!f) throw new Error(`font-menu pair ${p.id}: ${side} 글꼴 ${p[side].font} 이 items 에 없다`);
    if (f.weightNums && !f.weightNums.includes(p[side].weight)) throw new Error(`font-menu pair ${p.id}: ${f.family} 에 ${p[side].weight} 두께가 없다 (${f.weightNums.join(', ')})`);
  }
  if (/—/.test(JSON.stringify(p))) throw new Error(`font-menu pair ${p.id}: 엠대시`);
}
const fWts = it => it.weightNums
  ? it.weightNums.map(w => `<span style="font-weight:${w}">${w}</span>`).join('')
  : '<span style="font-weight:400">Regular</span><span style="font-weight:500">Medium</span><span style="font-weight:700">Bold</span>';

const fCardHtml = it => `
<article class="fitem" id="${it.id}">
  <div class="spec" style="font-family:${attr(it.css)}">
    <div class="fbig">${esc(it.family)}${it.familyKo ? ` <span class="fko">${esc(it.familyKo)}</span>` : ''}</div>
    <div class="fpan">${esc(it.pan)}</div>
    ${it.panKo ? `<div class="fpan ko">${esc(it.panKo)}</div>` : ''}
    <div class="fwts">${fWts(it)}</div>
  </div>
  <div class="fmeta">
    <span class="frole">${esc(it.role)}</span>
    <span class="lic ${it.license.tone}">${esc(it.license.name)}</span>
    <span class="fsrc ${srcClass(it.source)}">${esc(it.source)}</span>
  </div>
  <div class="floadrow"><code>${esc(it.load)}</code><button class="copy tiny" data-copy="${attr(it.load)}" title="로드 스니펫 복사">복사</button></div>
  <div class="fnotes">
    <p><b>언제</b>${esc(it.use)}</p>
    <p><b>안 쓸 때</b>${esc(it.whenNot)}</p>
    <p><b>짝</b>${esc(it.pairsWith)}</p>
    <p class="flic">${esc(it.license.blurb)} · 두께 ${esc(it.weights)}${it.checked ? ` · 라이선스 확인 ${esc(it.checked)}${it.licenseUrl ? ` (<a href="${attr(it.licenseUrl)}" rel="noopener" target="_blank">원문</a>)` : ''}` : ''}</p>
  </div>
</article>`;

const fTableHtml = cat => `
<div class="tblwrap"><table>
<thead><tr><th>폰트</th><th>출처</th><th>라이선스</th><th>역할</th><th>로드 스니펫</th></tr></thead>
<tbody>
${fby(cat.id).map(it => `<tr>
  <td><a href="#${it.id}" style="font-family:${attr(it.css)}">${esc(it.family)}</a></td>
  <td class="mono"><span class="fsrc ${srcClass(it.source)}">${esc(it.source)}</span></td>
  <td class="mono">${esc(it.license.name)}</td>
  <td class="als">${esc(it.role)}</td>
  <td class="askcell"><span>${esc(it.vibe)}</span><button class="copy tiny" data-copy="${attr(it.load)}">스니펫</button></td>
</tr>`).join('\n')}
</tbody></table></div>`;

const ff = fmenu.formula;
// @import 는 스타일 맨 앞에만 올 수 있다. @font-face 로 주는 글꼴(Paperlogy)은 그 뒤에 둔다.
const fImpAll = [...new Set(fmenu.items.map(i => i.import))];
const fImports = [...fImpAll.filter(x => x.startsWith('@import')), ...fImpAll.filter(x => !x.startsWith('@import'))].join('\n');
const fPairCard = p => {
  const t = fById[p.title.font], u = fById[p.sub.font];
  const loads = [...new Set([t.load, u.load])].join('\n');
  return `
<article class="fpair" id="${p.id}">
  <div class="fpspec">
    <div class="fphead" style="font-family:${attr(t.css)};font-weight:${p.title.weight}">${esc(p.head)}</div>
    <div class="fpsub" style="font-family:${attr(u.css)};font-weight:${p.sub.weight}">${esc(p.subText)}</div>
  </div>
  <div class="fpnames"><a href="#${t.id}">${esc(t.family)} ${p.title.weight}</a><span>+</span><a href="#${u.id}">${esc(u.family)} ${p.sub.weight}</a></div>
  <p class="fprule">${esc(p.rule)}</p>
  <div class="askline"><code>${esc(p.ask)}</code><button class="copy tiny" data-copy="${attr(p.ask)}" title="요청 문장 복사">복사</button></div>
  <div class="floadrow"><code>${esc(loads)}</code><button class="copy tiny" data-copy="${attr(loads)}" title="두 글꼴 로드 스니펫 복사">로드 복사</button></div>
</article>`;
};
const fPairsHtml = fPairs.length ? `
<section class="cat" id="c-pairs">
  <h2><span class="no">${String(fmenu.categories.length + 1).padStart(2, '0')}</span> 짝 <span class="count">${fPairs.length}</span></h2>
  <div class="fprulebox"><b>짝의 규칙</b>${esc(fmenu.pairRule)}</div>
  ${fPairGroups.map(g => `<h3 class="fpg">${esc(g.ko)}</h3>
  <div class="ggrid">${fPairs.filter(p => p.group === g.id).map(fPairCard).join('\n')}</div>`).join('\n  ')}
</section>` : '';
const FGAL_CSS = fImports + '\n' + CORE_CSS.replace(/\.uigal/g, '.fmgal') + `
.fmgal .ggrid { grid-template-columns: 1fr 1fr; }
@media (max-width: 860px) { .fmgal .ggrid { grid-template-columns: 1fr; } }
.fmgal .floaders { margin-top: 16px; border: 1px solid var(--line); border-radius: 14px; padding: 13px 16px; background: var(--gwash); }
.fmgal .floaders > b { display: block; font-size: 13px; margin-bottom: 8px; }
.fmgal .floaders .lrow { font-size: 12.5px; color: var(--ink-2); line-height: 1.6; margin-top: 5px; }
.fmgal .spec { padding: 18px 16px 15px; border-bottom: 1px solid var(--line); }
.fmgal .fbig { font-size: 34px; line-height: 1.05; letter-spacing: -.02em; color: var(--ink); }
.fmgal .fpan { font-size: 17px; color: var(--ink-2); margin-top: 9px; line-height: 1.35; }
.fmgal .fpan.ko { margin-top: 3px; }
.fmgal .fwts { margin-top: 11px; display: flex; gap: 16px; flex-wrap: wrap; font-size: 15px; color: var(--ink-3); }
.fmgal .fmeta { display: flex; flex-wrap: wrap; gap: 6px 8px; padding: 10px 14px; border-bottom: 1px solid var(--gwash); align-items: center; }
.fmgal .frole { font-size: 12px; color: var(--ink-2); font-weight: 600; }
.fmgal .lic { font-size: 10.5px; font-weight: 800; border-radius: 6px; padding: 2px 8px; }
.fmgal .lic.ok { background: #eff6f1; color: #1f7a4d; }
.fmgal .lic.cdn { background: #fbf3e8; color: #a8620f; }
.fmgal .fsrc { font-size: 11px; font-family: var(--mono); color: var(--ink-2); display: inline-flex; align-items: center; gap: 5px; }
.fmgal .fmeta .fsrc { margin-left: auto; }
.fmgal .fsrc::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--ink-3); flex: none; }
.fmgal .fsrc.google::before { background: #4285F4; }
.fmgal .fsrc.fontshare::before { background: #E8344E; }
.fmgal .fsrc.jsdelivr::before { background: #E84D3D; }
.fmgal .floadrow { display: flex; gap: 8px; align-items: flex-start; padding: 10px 14px; background: var(--gwash); border-bottom: 1px solid var(--line); }
.fmgal .floadrow code { font-family: var(--mono); font-size: 10.5px; line-height: 1.5; color: var(--ink-2); flex: 1; min-width: 0; white-space: normal; word-break: break-all; }
.fmgal .fnotes { padding: 11px 14px 13px; display: grid; gap: 5px; margin-top: auto; }
.fmgal .fnotes p { margin: 0; font-size: 12.5px; color: var(--ink-2); line-height: 1.5; }
.fmgal .fnotes b { color: var(--ink); font-weight: 700; margin-right: 6px; }
.fmgal .fnotes .flic { font-size: 11px; color: var(--ink-3); border-top: 1px dashed var(--line); padding-top: 6px; margin-top: 2px; }
.fmgal td a { letter-spacing: -.01em; }
.fmgal .fko { font-size: 20px; color: var(--ink-3); letter-spacing: 0; margin-left: 4px; white-space: nowrap; display: inline-block; }
.fmgal .fpnames a { color: var(--ink); text-decoration: none; }
.fmgal .fpnames a:hover { text-decoration: underline; }
.fmgal .fwts span { font-synthesis: none; }
.fmgal .fprulebox { border: 1px solid var(--line); border-radius: 14px; padding: 12px 16px; background: var(--gwash); font-size: 14px; color: var(--ink); line-height: 1.5; margin-bottom: 6px; word-break: keep-all; }
.fmgal .fprulebox b { display: block; font-size: 12px; color: var(--ink-3); margin-bottom: 2px; }
.fmgal .fpg { font-size: 14px; margin: 18px 0 8px; color: var(--ink-2); }
.fmgal .fpair { border: 1px solid var(--line); border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; background: var(--paper, #fff); min-width: 0; }
.fmgal .fpspec { padding: 20px 16px 16px; border-bottom: 1px solid var(--line); }
.fmgal .fphead { font-size: 32px; line-height: 1.2; color: var(--ink); word-break: keep-all; overflow-wrap: anywhere; font-synthesis: none; }
.fmgal .fpsub { font-size: 15px; line-height: 1.55; color: var(--ink-2); margin-top: 8px; word-break: keep-all; overflow-wrap: anywhere; font-synthesis: none; }
.fmgal .fpnames { display: flex; flex-wrap: wrap; gap: 4px 8px; padding: 10px 14px 0; font-size: 12.5px; font-weight: 700; align-items: baseline; }
.fmgal .fpnames span { color: var(--ink-3); font-weight: 400; }
.fmgal .fprule { margin: 6px 14px 10px; font-size: 12.5px; color: var(--ink-2); line-height: 1.5; word-break: keep-all; }
.fmgal .fpair .askline { display: flex; gap: 8px; align-items: flex-start; padding: 0 14px 10px; }
.fmgal .fpair .askline code { font-size: 12px; line-height: 1.5; flex: 1; min-width: 0; white-space: normal; word-break: keep-all; overflow-wrap: anywhere; }
.fmgal .fpair .floadrow { margin-top: auto; border-top: 1px solid var(--line); border-bottom: 0; }`;

// 판 리듬 인트로 — 웹폰트 사전 (로더 상자는 판 2 로 옮겼다)
const fmHero = ['pair-black-han-pretendard', 'pair-pen-gowun', 'pair-jua-pretendard'].map(id => fPairs.find(p => p.id === id)).filter(Boolean);
const fmSpec = p => { const t = fById[p.title.font], u = fById[p.sub.font]; return `<figure><div class="ip-card" style="min-height:150px"><div style="font-family:${attr(t.css)};font-weight:${p.title.weight};font-size:28px;line-height:1.2">${esc(p.head)}</div><div style="font-family:${attr(u.css)};font-weight:${p.sub.weight};font-size:14px;margin-top:10px;color:var(--ip-ink2)">${esc(p.subText)}</div></div><figcaption>${esc(t.family)} + ${esc(u.family)}<span>${esc(p.rule)}</span></figcaption></figure>`; };
const fmPairX = fPairs.find(p => p.group === 'ko-en') || fPairs[0];
const fmIntro = ipPanels('font-menu', '.fmgal', IP_VARS_THEME, [
  { lay: 'center', bg: 'pale', chip: `웹폰트 사전 · ${fmenu.items.length}가지 · 짝 ${fPairs.length}`, h: '「폰트 예쁘게」 대신<br><em>짝</em>으로 시켜요', sub: esc(ff.note),
    body: `<div class="ip-three">${fmHero.map(fmSpec).join('')}</div>${fmHero[0] ? ipBub(fmHero[0].ask) : ''}` },
  { lay: 'wide', bg: 'white', chip: '로더', h: '로더가 폰트마다 달라요<br>이름만 안다고 <em>안 떠요</em>', sub: '같은 「무료 폰트」라도 불러오는 곳과 쓸 수 있는 범위가 달라요.',
    body: `<div class="ip-rows">${Object.entries(fmenu.loaders).map(([k, v]) => `<a class="r" href="#c-${fmenu.categories[0].id}"><span class="w"><b style="color:var(--ip-ink)">${esc(k)}</b></span><span class="v">${esc(v)}</span></a>`).join('')}</div>` },
  fmPairX && { lay: 'split', bg: 'pale', chip: '짝의 규칙', h: '한 화면에 한글 글꼴은<br><em>두 개까지</em>', sub: `${esc(fmenu.pairRule)}. 짝마다 요청 문장과 두 글꼴 로드 스니펫이 붙어 있어요.`,
    body: `<p class="ip-foot"><a href="#c-pairs">짝 ${fPairs.length}가지 전부 보기 ↓</a></p>`, aside: fPairCard(fmPairX).replace(` id="${fmPairX.id}"`, '') },
  { lay: 'stack', bg: 'white', chip: 'AI한테 시키는 공식', h: '인상을 말하고<br><em>로딩 스니펫째</em> 시켜요', body: ipFormula(ff) },
  { lay: 'band', bg: 'dark', chip: 'Claude Code 스킬', h: 'AI가 라이선스까지<br><em>보고</em> 골라요', sub: '스킬로 깔아 두면 「제목은 굵게, 본문은 편하게」만 말해도 짝과 로더·라이선스를 같이 맞춰요.', body: ipInstall('font-menu') },
]);
const fpCore = `<div class="fmgal">
<style>${FGAL_CSS}</style>
${fmIntro}
<nav class="gnav" aria-label="맥락">
  ${fmenu.categories.map(c => `<a href="#c-${c.id}"><b>${c.no}</b>${c.ko} ${fby(c.id).length}</a>`).join('\n  ')}
  ${fPairs.length ? `<a href="#c-pairs"><b>${String(fmenu.categories.length + 1).padStart(2, '0')}</b>짝 ${fPairs.length}</a>` : ''}
</nav>
${fmenu.categories.map(cat => `
<section class="cat" id="c-${cat.id}">
  <h2><span class="no">${cat.no}</span> ${cat.ko} <span class="count">${fby(cat.id).length}</span></h2>
  <div class="ggrid">${fby(cat.id).map(fCardHtml).join('\n')}</div>
  ${fTableHtml(cat)}
</section>`).join('\n')}
${fPairsHtml}
<script>${CORE_JS.replace(/\.uigal/g, '.fmgal')}</script>
</div>
`;

const fdict = () => `# 웹폰트 사전 (font-menu) · Giting Skills

> 어떤 인상을 원하는지로 폰트를 고르고, 그 폰트를 어디서 어떻게 불러오는지 로딩 스니펫째 주는 사전. ${fmenu.categories.length}개 맥락 ${fmenu.items.length}종, 짝 ${fPairs.length}개.
> 대원칙: 로더가 폰트마다 다르다. ${Object.entries(fmenu.loaders).map(([k, v]) => `[${k}] ${v}`).join(' ')}
> 가장 흔한 사고: Google에 없는 폰트(Satoshi·Clash Display·General Sans)를 Google <link>에 박아 조용히 시스템 폰트로 폴백. 반드시 각 폰트의 출처 로더로.
> 공식: ${ff.pattern}
> 갤러리(폰트 실물 렌더): https://giting.kr/skills/font-menu · repo: https://github.com/hanmariyang/giting-skills (MIT)
> Claude Code: /plugin install font-menu@giting

${fmenu.categories.map(cat => `## ${cat.no} ${cat.ko}

${fby(cat.id).map(it => `### ${it.family}${it.familyKo ? ` (${it.familyKo})` : ''} · ${it.role} [${it.source}]
- 인상: ${it.vibe}
- 라이선스: ${it.license.name} (${it.license.blurb})${it.checked ? `, ${it.checked} 확인${it.licenseUrl ? `: ${it.licenseUrl}` : ''}` : ''}
- 두께: ${it.weights}
- 언제: ${it.use}
- 안 쓸 때: ${it.whenNot}
- 짝: ${it.pairsWith}
- font-family: ${it.css}
- 로드:
\`\`\`html
${it.load}
\`\`\`
`).join('\n')}`).join('\n')}${fPairs.length ? `
## 짝 ${fPairs.length}

규칙: ${fmenu.pairRule}.
짝을 고른 뒤 두 글꼴을 각자의 로드 스니펫으로 불러온다(출처가 다르면 스니펫도 둘).

${fPairGroups.map(g => `### ${g.ko}

${fPairs.filter(p => p.group === g.id).map(p => `- ${fById[p.title.font].family} ${p.title.weight} + ${fById[p.sub.font].family} ${p.sub.weight} (제목 + 보조): ${p.rule}
  - 예: 「${p.head}」 / 「${p.subText}」
  - 요청 문장: ${p.ask}`).join('\n')}`).join('\n\n')}
` : ''}`;

if (SITE_DIR) {
  const FS = join(SITE_DIR, 'font-menu');
  mkdirSync(FS, { recursive: true });
  writeFileSync(join(FS, 'gallery-core.html'), fpCore);
  writeFileSync(join(FS, 'llms.txt'), fdict());
  writeFileSync(join(FS, 'llms-full.txt'), fdict());
}
mkdirSync(join(ROOT, 'docs', 'font-menu'), { recursive: true });
writeFileSync(join(ROOT, 'docs', 'font-menu', 'index.html'), redirect.replace(/giting\.kr\/skills\//g, 'giting.kr/skills/font-menu'));
writeFileSync(join(ROOT, 'docs', 'font-menu', 'llms.txt'), fdict());
console.log(`built font-menu: items ${fmenu.items.length} · core ${(fpCore.length / 1024).toFixed(0)}KB`);

// ── 앱 UI 사전 (app-menu) — 06 ──────────────────────────────────
// ui-menu 의 모바일판. 데모 HTML 없이 카드(별칭·정의·요청문·네이티브명)+테이블. 웹은 ui-menu.
const AP = join(ROOT, 'plugins', 'app-menu');
const amenu = JSON.parse(readFileSync(join(AP, 'menu.json'), 'utf8'));
const aby = id => amenu.items.filter(i => i.category === id);

const aCardHtml = it => `
<article class="item" id="${it.id}">
  <header><h3>${esc(it.name.ko)}</h3><span class="en">${esc(it.name.en)}</span></header>
  <footer>
    <span class="al">"${esc(it.aliases[0])}"${it.aliases[1] ? ` · "${esc(it.aliases[1])}"` : ''}</span>
    <span class="one">${esc(it.oneliner)}</span>
    <div class="askline"><code>${esc(it.ask)}</code><button class="copy tiny" data-copy="${attr(it.ask)}" title="요청 문장 복사">복사</button></div>
    ${it.native ? `<span class="nat">${esc(it.native)}</span>` : ''}
    ${it.vs ? `<span class="vs">↔ ${esc(it.vs)}</span>` : ''}
  </footer>
</article>`;

const aTableHtml = cat => `
<div class="tblwrap"><table>
<thead><tr><th>한글</th><th>영문</th><th>네이티브</th><th>이렇게 말해도</th><th>AI에게 이렇게</th></tr></thead>
<tbody>
${aby(cat.id).map(it => `<tr>
  <td><a href="#${it.id}">${esc(it.name.ko)}</a></td>
  <td class="mono">${esc(it.name.en)}</td>
  <td class="mono nat2">${it.native ? esc(it.native) : '·'}</td>
  <td class="als">"${esc(it.aliases[0])}"</td>
  <td class="askcell"><span>${esc(it.ask)}</span><button class="copy tiny" data-copy="${attr(it.ask)}">복사</button></td>
</tr>`).join('\n')}
</tbody></table></div>`;

const af = amenu.formula;
const AGAL_CSS = CORE_CSS.replace(/\.uigal/g, '.apgal') + `
.apgal .ggrid { grid-template-columns: 1fr 1fr; }
@media (max-width: 860px) { .apgal .ggrid { grid-template-columns: 1fr; } }
.apgal .note { margin-top: 16px; border: 1px solid var(--line); border-radius: 14px; padding: 12px 16px; background: var(--gwash); font-size: 12.5px; color: var(--ink-2); line-height: 1.6; }
.apgal .note b { color: var(--ink); }
.apgal .item footer { display: block; }
.apgal .item .al { display: block; font-family: var(--mono); font-size: 12px; color: var(--ink-2); }
.apgal .item .one { display: block; margin-top: 6px; font-size: 13.5px; color: var(--ink-2); line-height: 1.5; }
.apgal .item .askline { margin-top: 9px; display: flex; gap: 8px; align-items: flex-start; background: var(--gwash); border-radius: 9px; padding: 8px 10px; }
.apgal .item .askline code { flex: 1; min-width: 0; font-family: var(--mono); font-size: 11.5px; line-height: 1.5; color: var(--ink); white-space: normal; word-break: break-word; }
.apgal .item .nat { display: block; margin-top: 8px; font-family: var(--mono); font-size: 11px; color: var(--ink-3); border-top: 1px dashed var(--line); padding-top: 6px; }
.apgal .item .vs { display: block; margin-top: 6px; font-size: 11.5px; color: var(--ink-3); }
.apgal td.nat2 { white-space: normal; min-width: 150px; color: #0F766E; }`;

// 판 리듬 인트로 — 앱 UI 사전 (모바일 전용 안내는 판 1 설명으로 옮겼다)
const apHero = ['skeleton', 'nav', 'overlay'].map(c => aby(c)[0]).filter(Boolean);
const apX = amenu.items.find(i => i.vs && i.native);
const apCard = it => `<div class="ip-card"><h4>${esc(it.name.ko)} <span style="font-family:ui-monospace,monospace;font-size:11px;color:var(--ip-ink3)">${esc(it.name.en)}</span></h4><span class="al">"${esc(it.aliases[0])}"</span><p>${esc(it.oneliner)}</p>${it.native ? `<code>${esc(it.native)}</code>` : ''}</div>`;
const apIntro = ipPanels('app-menu', '.apgal', IP_VARS_THEME, [
  { lay: 'center', bg: 'pale', chip: `앱 UI 사전 · ${amenu.items.length}가지`, h: '모바일은 이름만 대면<br><em>관례</em>가 따라와요',
    sub: '<b>모바일 앱 UI 전용.</b> 웹 UI 는 <b>ui-menu</b> 를 쓴다. 같은 단어라도 앱과 웹의 관례가 다르다. 모달은 앱에선 아래서 올라오는 풀스크린, 셀렉트는 드롭다운이 아니라 시트로 연다. 네이티브 열은 SwiftUI · Flutter · React Native 의 실제 컴포넌트명.',
    body: `<div class="ip-three">${apHero.map(it => `<figure>${apCard(it)}</figure>`).join('')}</div>${apHero[0] ? ipBub(apHero[0].ask) : ''}` },
  { lay: 'stack', bg: 'white', chip: 'AI한테 시키는 공식', h: '플랫폼 관례까지<br><em>한 문장</em>에 넣어요', sub: esc(af.note), body: ipFormula(af) },
  { lay: 'wide', bg: 'pale', chip: '이름 찾기', h: '이런 말엔<br><em>이런 이름</em>을 써요', sub: '오른쪽에 SwiftUI · Flutter · React Native 의 실제 이름까지 붙어 있어요.',
    body: `<div class="ip-rows">${amenu.categories.map(c => aby(c.id)[0]).filter(Boolean).map(it => `<a class="r" href="#${it.id}"><span class="w">"${esc(it.aliases[0])}"</span><span class="n"><b>${esc(it.name.ko)}</b></span>${it.native ? `<span class="v">${esc(it.native)}</span>` : ''}</a>`).join('')}</div>` },
  apX && { lay: 'split', bg: 'white', chip: '헷갈리는 짝', h: `<em>${esc(apX.name.ko)}</em>, 이럴 때 써요`, sub: `↔ ${esc(apX.vs)}`, body: ipBub(apX.ask), aside: apCard(apX) },
  { lay: 'band', bg: 'dark', chip: 'Claude Code 스킬', h: 'AI가 앱 관례를<br><em>먼저</em> 챙겨요', sub: '스킬로 깔아 두면 세이프에어리어 · 44pt · 시트 같은 관례를 말하지 않아도 넣어요.', body: ipInstall('app-menu') },
]);
const apCore = `<div class="apgal">
<style>${AGAL_CSS}</style>
${apIntro}
<nav class="gnav" aria-label="분류">
  ${amenu.categories.map(c => `<a href="#c-${c.id}"><b>${c.no}</b>${c.ko} ${aby(c.id).length}</a>`).join('\n  ')}
</nav>
${amenu.categories.map(cat => `
<section class="cat" id="c-${cat.id}">
  <h2><span class="no">${cat.no}</span> ${cat.ko} <span class="count">${aby(cat.id).length}</span></h2>
  <div class="ggrid">${aby(cat.id).map(aCardHtml).join('\n')}</div>
  ${aTableHtml(cat)}
</section>`).join('\n')}
<script>${CORE_JS.replace(/\.uigal/g, '.apgal')}</script>
</div>
`;

const adict = () => `# 앱 UI 메뉴판 (app-menu) · Giting Skills

> 모바일 앱 UI 를 말이 아니라 이름으로 시키게 해 주는 사전. 별칭 → 정식 명칭 → 요청 문장 → 네이티브(SwiftUI·Flutter·React Native) 매핑. 8개 코스 ${amenu.items.length}항목.
> 웹 UI 는 ui-menu. 같은 단어라도 관례가 다르다(모달=앱은 풀스크린, 셀렉트=앱은 시트).
> 공식: ${af.pattern}
> 갤러리: https://giting.kr/skills/app-menu · repo: https://github.com/hanmariyang/giting-skills (MIT)
> Claude Code: /plugin install app-menu@giting

${amenu.categories.map(cat => `## ${cat.no} ${cat.ko}

${aby(cat.id).map(it => `### ${it.name.ko} · ${it.name.en}
- 별칭: ${it.aliases.join(' · ')}
- 정의: ${it.oneliner}
- 요청: ${it.ask}${it.vs ? `
- 구분: ${it.vs}` : ''}${it.native ? `
- 네이티브: ${it.native}` : ''}
`).join('\n')}`).join('\n')}`;

if (SITE_DIR) {
  const AS = join(SITE_DIR, 'app-menu');
  mkdirSync(AS, { recursive: true });
  writeFileSync(join(AS, 'gallery-core.html'), apCore);
  writeFileSync(join(AS, 'llms.txt'), adict());
  writeFileSync(join(AS, 'llms-full.txt'), adict());
}
mkdirSync(join(ROOT, 'docs', 'app-menu'), { recursive: true });
writeFileSync(join(ROOT, 'docs', 'app-menu', 'index.html'), redirect.replace(/giting\.kr\/skills\//g, 'giting.kr/skills/app-menu'));
writeFileSync(join(ROOT, 'docs', 'app-menu', 'llms.txt'), adict());
console.log(`built app-menu: items ${amenu.items.length} · core ${(apCore.length / 1024).toFixed(0)}KB`);

// ── 랜딩 메뉴판 (landing-menu) — 07 ─────────────────────────────
// 랜딩 섹션 사전. 전폭 섹션이라 카드는 1열. 룩은 design-brief, 구조는 여기.
const LMP = join(ROOT, 'plugins', 'landing-menu');
const lmMenu = JSON.parse(readFileSync(join(LMP, 'menu.json'), 'utf8'));
const lmBy = id => lmMenu.items.filter(i => i.category === id);
const lmFrags = {};
for (const fn of readdirSync(join(LMP, 'demos')).filter(f => f.endsWith('.html'))) {
  const src = readFileSync(join(LMP, 'demos', fn), 'utf8');
  const parts = src.split(/<!--\s*@([a-z0-9-]+)([^>]*?)-->/);
  for (let i = 1; i < parts.length; i += 3)
    lmFrags[parts[i]] = { h: Number((parts[i + 1].match(/h=(\d+)/) || [])[1] || 360), body: parts[i + 2].trim() };
}
const lmMiss = lmMenu.items.filter(it => !lmFrags[it.id]).map(it => it.id);
if (lmMiss.length) { console.error('landing-menu 데모 없는 항목:', lmMiss.join(', ')); process.exit(1); }
const lmStandalone = it => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${it.name.ko} ${it.name.en} · 랜딩 메뉴판</title><style>*{box-sizing:border-box}body{margin:0;font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#17171b;font-size:13.5px;background:#fff}</style></head><body>
${lmFrags[it.id].body}
<script>document.addEventListener('click',function(e){var a=e.target.closest('a[href="#"]');if(a)e.preventDefault();});</script>
</body></html>`;
const lmCode = {};
rmSync(join(LMP, 'components'), { recursive: true, force: true });
mkdirSync(join(LMP, 'components'), { recursive: true });
for (const it of lmMenu.items) { lmCode[it.id] = lmStandalone(it); writeFileSync(join(LMP, 'components', `${it.id}.html`), lmCode[it.id]); }
const LM_RAW = 'https://raw.githubusercontent.com/hanmariyang/giting-skills/main/plugins/landing-menu/components';
const LM_CSS = `@import url('https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Gothic+A1:wght@800&family=IBM+Plex+Sans+KR:wght@400;700&family=Nanum+Pen+Script&display=swap');
@font-face{font-family:'GmarketSans';font-weight:700;font-display:swap;src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansBold.woff') format('woff')}
.lmgal{--ink:#17171b;--ink2:#6b6c74;--line:#e6e5e1;--acc:#0E7B62;--bg:#faf9f6;font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:var(--ink)}
.lmgal .lm-formula{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin:0 0 18px}
.lmgal .lm-formula .fp{font-size:14px;font-weight:700}.lmgal .lm-formula .fp span{color:var(--acc);font-weight:600;margin-left:8px}
.lmgal .lm-formula .fx{margin:10px 0 0;font-size:12.5px;color:var(--ink2);line-height:1.7}
.lmgal .lm-anti{margin:8px 0 0;font-size:12px;color:#8A6A1F}
.lmgal .lm-nav{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 20px}
.lmgal .lm-nav a{font-size:12.5px;color:var(--ink2);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:5px 12px}
.lmgal .lm-nav a b{color:var(--acc);margin-right:5px}
.lmgal .lm-cat{margin:0 0 30px}
.lmgal .lm-cat h2{font-size:16px;font-weight:800;display:flex;align-items:center;gap:9px;margin:0 0 14px;padding-bottom:8px;border-bottom:1px solid var(--line)}
.lmgal .lm-cat h2 .no{color:var(--acc)}.lmgal .lm-cat h2 .count{font-size:12px;color:var(--ink2);font-weight:600}
.lmgal .lm-grid{display:grid;gap:16px}
.lmgal .lm-card{border:1px solid var(--line);border-radius:14px;overflow:hidden;background:#fff}
.lmgal .lm-card header{display:flex;align-items:baseline;gap:9px;padding:13px 16px;border-bottom:1px solid var(--line)}
.lmgal .lm-card header h3{font-size:15px;font-weight:800;margin:0}.lmgal .lm-card header .en{font-family:ui-monospace,monospace;font-size:11.5px;color:var(--ink2)}
.lmgal .lm-card header .copy{margin-left:auto;font-size:11.5px;border:1px solid var(--line);background:#fff;border-radius:7px;padding:4px 10px;cursor:pointer;color:var(--ink)}
.lmgal .lm-card iframe{display:block;width:100%;border:0;background:#fff}
.lmgal .lm-card footer{padding:12px 16px;border-top:1px solid var(--line);font-size:12.5px;color:var(--ink2);display:grid;gap:5px}
.lmgal .lm-card footer .al{color:var(--ink);font-weight:600}
.lmgal .lm-card footer .vs{color:#8A6A1F}
.lmgal .lm-inote{font-size:12.5px;color:var(--ink2);margin:-4px 0 14px;line-height:1.6}.lmgal .lm-inote b{color:var(--ink)}
.lmgal .lm-ind{border:1px solid var(--line);border-radius:14px;background:#fff;overflow:hidden}
.lmgal .lm-ind header{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;padding:13px 16px;border-bottom:1px solid var(--line)}
.lmgal .lm-ind h3{font-size:15.5px;font-weight:800;margin:0}.lmgal .lm-ind .who{font-size:12px;color:var(--ink2);flex:1;min-width:0}
.lmgal .lm-ind .copy{font-size:11.5px;border:1px solid var(--line);background:#fff;border-radius:7px;padding:4px 10px;cursor:pointer;color:var(--ink)}
.lmgal .lm-order{list-style:none;counter-reset:o;display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:14px 16px 4px}
.lmgal .lm-order li{counter-increment:o;display:grid;gap:2px;border:1px solid var(--line);border-radius:10px;padding:7px 10px;font-size:13px;font-weight:700;max-width:220px}
.lmgal .lm-order li::before{content:counter(o);color:var(--acc);font-family:ui-monospace,monospace;font-size:10.5px}
.lmgal .lm-order a{color:var(--ink);text-decoration:none}.lmgal .lm-order small{font-weight:500;font-size:11.5px;color:var(--ink2)}
.lmgal .lm-kv{display:grid;gap:6px;padding:10px 16px 4px;font-size:12.5px;color:var(--ink2);line-height:1.55}.lmgal .lm-kv b{color:var(--ink);margin-right:8px}
.lmgal .lm-looks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:12px 16px 16px}
@media(max-width:720px){.lmgal .lm-looks{grid-template-columns:1fr}}
.lmgal .lm-look{margin:0}.lmgal .lm-look .pv{border-radius:12px;padding:16px 14px;min-height:150px;display:flex;flex-direction:column;gap:8px;border:1px solid rgba(0,0,0,.06)}
.lmgal .lm-look .t{font-size:19px;line-height:1.25;letter-spacing:-.02em;word-break:keep-all}.lmgal .lm-look .d{font-size:11.5px;opacity:.72;line-height:1.45;word-break:keep-all}
.lmgal .lm-look .b{align-self:flex-start;margin-top:auto;font-size:12px;font-weight:700;border-radius:8px;padding:6px 11px}
.lmgal .lm-look figcaption{display:grid;gap:3px;margin-top:8px;font-size:11.5px;color:var(--ink2)}.lmgal .lm-look figcaption b{font-size:12.5px;color:var(--ink)}
.lmgal .lm-look .sw{font-family:ui-monospace,monospace;font-size:10.5px}.lmgal .lm-look .sw i{display:inline-block;width:10px;height:10px;border-radius:3px;border:1px solid rgba(0,0,0,.15);vertical-align:-1px;margin-right:3px}
.lmgal .lm-look .nt{color:var(--ink2)}
.lmgal .lm-rhythm{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px 18px;margin:0 0 16px}
.lmgal .lm-rhythm>b{font-size:14.5px}.lmgal .lm-rhythm p{font-size:12.5px;color:var(--ink2);margin:6px 0 10px}
.lmgal .lm-rhythm ul{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px;padding:0;list-style:none}.lmgal .lm-rhythm li{font-size:12px;border:1px solid var(--line);border-radius:999px;padding:4px 11px}
.lmgal .lm-lays{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:0 0 12px}
.lmgal .lm-lays span{border:1px solid var(--line);border-radius:10px;padding:9px 11px;font-size:13px;font-weight:700;display:grid;gap:3px}
.lmgal .lm-lays i{font-style:normal;color:var(--acc);font-family:ui-monospace,monospace;font-size:11px}.lmgal .lm-lays small{font-weight:500;font-size:11.5px;color:var(--ink2)}
.lmgal .lm-rask{display:flex;gap:8px;align-items:flex-start}.lmgal .lm-rask code{flex:1;min-width:0;font-size:12px;line-height:1.6;background:var(--bg);border-radius:8px;padding:9px 11px;font-family:ui-monospace,monospace;white-space:pre-wrap;overflow-wrap:anywhere}
.lmgal .lm-rask .copy{flex:none;font-size:11.5px;border:1px solid var(--line);background:#fff;border-radius:7px;padding:4px 10px;cursor:pointer;color:var(--ink)}
@media(prefers-color-scheme:dark){.lmgal{--ink:#ececea;--ink2:#a9aab0;--line:#2a2a2e;--bg:#1a1a1d}.lmgal .lm-formula,.lmgal .lm-card{background:#1d1d20}.lmgal .lm-nav a{background:#1d1d20}}`;
const lmCard = it => `<article class="lm-card" id="l-${it.id}">
  <header><h3>${esc(it.name.ko)}</h3><span class="en">${esc(it.name.en)}</span><button class="copy" data-copy="${attr(it.ask)}" title="요청 문장 복사">문장 복사</button></header>
  <iframe title="${esc(it.name.ko)} 데모" loading="lazy" style="height:${lmFrags[it.id].h}px" srcdoc="${attr(lmCode[it.id])}"></iframe>
  <footer><span class="al">"${esc(it.aliases[0])}"</span><span>${esc(it.oneliner)}</span>${it.vs ? `<span class="vs">↔ ${esc(it.vs)}</span>` : ''}</footer>
</article>`;
// 업종별 레시피 + 룩 견본 (2026-10-23). 룩은 정하지 않고 design-brief 에 넘길 값으로만 보여 준다.
const lmInd = lmMenu.industries || [];
for (const x of lmInd) for (const st of x.order) if (!lmMenu.items.find(i => i.id === st.id)) { console.error('landing-menu 업종 레시피가 없는 항목을 가리킴:', x.id, st.id); process.exit(1); }
const LM_FONT = { 'Pretendard': "'Pretendard Variable',Pretendard,-apple-system,sans-serif", 'IBM Plex Sans KR': "'IBM Plex Sans KR',sans-serif", 'Gothic A1': "'Gothic A1',sans-serif", 'Black Han Sans': "'Black Han Sans',sans-serif", 'Nanum Pen Script': "'Nanum Pen Script',cursive", 'Gmarket Sans': "'GmarketSans','Gmarket Sans',sans-serif" };
const lmFont = spec => { const m = spec.match(/^(.*?)(?:\s+(\d{3}))?$/); const fam = m[1].trim(); return `font-family:${LM_FONT[fam] || `'${fam}',sans-serif`};font-weight:${m[2] || 400}`; };
const lmItemKo = id => lmMenu.items.find(i => i.id === id).name.ko;
const lmEx = x => (x.hook.match(/\(예: (.*)\)/) || [])[1] || x.ko;
const lmLook = (x, l) => `<figure class="lm-look"><div class="pv" style="background:${l.bg};color:${l.ink}"><div class="t" style="${lmFont(l.head)}">${esc(lmEx(x))}</div><div class="d" style="${lmFont(l.body)}">${esc(x.who)}</div><span class="b" style="background:${l.accent};color:${l.bg}">시작하기</span></div>
  <figcaption><b>${esc(l.name)}</b><span class="sw"><i style="background:${l.bg}"></i>${esc(l.bg)} <i style="background:${l.ink}"></i>${esc(l.ink)} <i style="background:${l.accent}"></i>${esc(l.accent)}</span><span class="fn">제목 ${esc(l.head)} · 본문 ${esc(l.body)}</span><span class="nt">${esc(l.note)}</span></figcaption></figure>`;
const lmIndHtml = lmInd.length ? `<section class="lm-cat" id="lc-industries">
  <h2><span class="no">＋</span> 업종별 레시피 <span class="count">${lmInd.length}</span></h2>
  <p class="lm-inote">업종마다 달라지는 것은 룩이 아니라 <b>순서와 증거</b>다. 아래 순서로 섹션을 고르고, 룩 견본은 design-brief 에 넘길 값의 예시로만 본다(사전이 룩을 정하지 않는다).</p>
  <div class="lm-grid">${lmInd.map(x => `<article class="lm-ind" id="li-${x.id}">
    <header><h3>${esc(x.ko)}</h3><span class="who">${esc(x.who)}</span><button class="copy" data-copy="${attr(x.ask)}" title="요청 문장 복사">문장 복사</button></header>
    <ol class="lm-order">${x.order.map(st => `<li><a href="#l-${st.id}">${esc(lmItemKo(st.id))}</a><small>${esc(st.as)}</small></li>`).join('')}</ol>
    <div class="lm-kv"><span><b>증거</b>${esc(x.proof)}</span><span><b>첫 줄 공식</b>${esc(x.hook)}</span></div>
    <div class="lm-looks">${x.looks.map(l => lmLook(x, l)).join('')}</div>
  </article>`).join('\n')}</div>
</section>` : '';
const lmF = lmMenu.formula;
// 판 리듬 인트로 — 랜딩 메뉴판 (공식 상자는 판 2 로 옮겼다)
const LM_HERO = ['hero-device', 'feature-alt', 'cta-band'];
const lmItem = id => { const it = lmMenu.items.find(i => i.id === id); if (!it) { console.error('landing-menu 인트로가 없는 항목을 가리킴:', id); process.exit(1); } return it; };
const lmFig = id => { const it = lmItem(id); return `<figure><iframe title="${esc(it.name.ko)} 데모" loading="lazy" style="height:${Math.min(lmFrags[id].h, 320)}px" srcdoc="${attr(lmCode[id])}"></iframe><figcaption>${esc(it.name.ko)}<span>"${esc(it.aliases[0])}"</span></figcaption></figure>`; };
const lmIntro = ipPanels('landing-menu', '.lmgal', '--ip-acc:var(--acc);--ip-ink:var(--ink);--ip-ink2:var(--ink2);--ip-ink3:var(--ink2);--ip-paper:#fff;--ip-line:var(--line);--ip-wash:var(--bg)', [
  { lay: 'center', bg: 'pale', chip: `랜딩 메뉴판 · ${lmMenu.items.length}섹션 · 업종 ${lmInd.length}`, h: '랜딩은 컴포넌트가 아니라<br><em>섹션의 순서</em>예요', sub: '섹션마다 이름 · 별칭 · 요청 문장 · 실물 HTML 이 있어요. <b>룩(색·글꼴)은 design-brief 에서</b>, 이 사전은 구조와 순서만 줘요.',
    body: `<div class="ip-three">${LM_HERO.map(lmFig).join('')}</div>${ipBub(lmItem(LM_HERO[0]).ask)}` },
  { lay: 'stack', bg: 'white', chip: 'AI한테 시키는 공식', h: '섹션 이름과 순서로<br><em>값</em>을 적어요', sub: esc(lmF.note || ''), body: `${ipFormula(lmF)}<p class="ip-foot">★ ${esc(lmMenu.antiGeneric[0])}</p>` },
  lmInd.length && { lay: 'wide', bg: 'pale', chip: '업종별 레시피', h: '업종마다 달라지는 건<br><em>순서와 증거</em>예요', sub: '누르면 그 업종의 섹션 순서 · 증거 · 첫 줄 공식 · 룩 견본으로 가요.',
    body: `<div class="ip-rows">${lmInd.map(x => `<a class="r" href="#li-${x.id}"><span class="w"><b style="color:var(--ip-ink)">${esc(x.ko)}</b> · ${esc(x.who)}</span><span class="n">${x.order.slice(0, 3).map(st => `<b>${esc(lmItemKo(st.id))}</b>`).join('')}</span></a>`).join('')}</div>` },
  lmMenu.rhythm && { lay: 'split', bg: 'white', chip: '⑦ 상세페이지', h: '판으로 설명할 땐<br><em>리듬</em>을 지켜요', sub: esc(lmMenu.rhythm.note),
    body: `<ul class="ip-list">${lmMenu.rhythm.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul>${ipBub(lmMenu.rhythm.ask)}`, aside: lmFig('chip-headline') },
  { lay: 'band', bg: 'dark', chip: 'Claude Code 스킬', h: '「랜딩 만들어줘」가<br><em>섹션 목록</em>으로 바뀌어요', sub: '스킬로 깔아 두면 업종과 증거를 먼저 묻고, 섹션 순서를 보여 준 뒤에 만들어요.', body: ipInstall('landing-menu') },
]);
const lmCore = `<div class="lmgal">
<style>${LM_CSS}</style>
${lmIntro}
<nav class="lm-nav">${lmMenu.categories.map(c => `<a href="#lc-${c.id}"><b>${c.no}</b>${esc(c.ko)} ${lmBy(c.id).length}</a>`).join('')}${lmInd.length ? `<a href="#lc-industries"><b>＋</b>업종별 레시피 ${lmInd.length}</a>` : ''}</nav>
${lmIndHtml}
${lmMenu.categories.map(cat => `<section class="lm-cat" id="lc-${cat.id}">
  <h2><span class="no">${cat.no}</span> ${esc(cat.ko)} <span class="count">${lmBy(cat.id).length}</span></h2>
  ${cat.id === 'detail' && lmMenu.rhythm ? `<div class="lm-rhythm"><b>${esc(lmMenu.rhythm.title)}</b><p>${esc(lmMenu.rhythm.note)}</p>
    <ul>${lmMenu.rhythm.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
    <div class="lm-lays">${lmMenu.rhythm.layouts.map((l, i) => `<span><i>${i + 1}</i>${esc(l.ko)}<small>${esc(l.use)}</small></span>`).join('')}</div>
    <div class="lm-rask"><code>${esc(lmMenu.rhythm.ask)}</code><button class="copy" data-copy="${attr(lmMenu.rhythm.ask)}" title="요청 문장 복사">문장 복사</button></div></div>` : ''}
  <div class="lm-grid">${lmBy(cat.id).map(lmCard).join('\n')}</div>
</section>`).join('\n')}
<script>document.querySelectorAll('.lmgal .copy').forEach(function(b){b.addEventListener('click',function(){navigator.clipboard&&navigator.clipboard.writeText(b.getAttribute('data-copy'));var t=b.textContent;b.textContent='복사됨';setTimeout(function(){b.textContent=t},1200);});});</script>
</div>
`;
const lmDict = full => `# 랜딩 메뉴판 (landing-menu) · Giting Skills

> 랜딩 페이지를 '무슨 섹션을 어떤 순서로'로 짓게 해 주는 사전. 별칭 → 정식 명칭 → 요청 문장 → 실물 HTML. ${lmMenu.categories.length}개 코스 ${lmMenu.items.length}개 항목.
> 룩(색·폰트)은 design-brief에서, 이 사전은 구조·순서만.
> 공식: ${lmF.pattern}  (✕ "${lmF.bad}" → ○ "${lmF.good}")
> 갤러리: https://giting.kr/skills/landing-menu · repo: https://github.com/hanmariyang/giting-skills (MIT)
> Claude Code: /plugin install landing-menu@giting

## 요청은 원하는 쪽만 적는다
${lmMenu.antiGeneric.map(a => `- ${a}`).join('\n')}
${lmMenu.rhythm ? `
## ${lmMenu.rhythm.title}
${lmMenu.rhythm.note}
${lmMenu.rhythm.rules.map(r => `- ${r}`).join('\n')}
- 판 꼴: ${lmMenu.rhythm.layouts.map(l => `${l.ko}(${l.use})`).join(' · ')}
- 요청 문장: ${lmMenu.rhythm.ask}
` : ''}${lmInd.length ? `
## 업종별 레시피 (순서 · 증거 · 첫 줄 공식 · 룩 견본)
룩 견본은 design-brief 에 넘길 값의 예시다. 사전이 룩을 정하지 않는다.
${lmInd.map(x => `### ${x.ko} — ${x.who}
- 순서: ${x.order.map((st, i) => `${i + 1}. ${lmItemKo(st.id)}(${st.as})`).join(' → ')}
- 증거: ${x.proof}
- 첫 줄 공식: ${x.hook}
- 요청 문장: ${x.ask}
- 룩 견본: ${x.looks.map(l => `${l.name}(바탕 ${l.bg} · 글자 ${l.ink} · 액센트 ${l.accent} · 제목 ${l.head} · 본문 ${l.body}: ${l.note})`).join(' / ')}`).join('\n')}
` : ''}
${lmMenu.categories.map(cat => `## ${cat.no} ${cat.ko}

${lmBy(cat.id).map(it => `### ${it.name.ko} (${it.name.en})
- 별칭: ${it.aliases.map(a => `"${a}"`).join(' · ')}
- 정의: ${it.oneliner}${it.vs ? `
- 구분: ${it.vs}` : ''}
- 요청 문장: ${it.ask}
- 레퍼런스: ${LM_RAW}/${it.id}.html${full ? `

\`\`\`html
${lmCode[it.id].trim()}
\`\`\`` : ''}
`).join('\n')}`).join('\n')}`;
if (SITE_DIR) {
  const LS = join(SITE_DIR, 'landing-menu');
  mkdirSync(LS, { recursive: true });
  writeFileSync(join(LS, 'gallery-core.html'), lmCore);
  writeFileSync(join(LS, 'llms.txt'), lmDict(false));
  writeFileSync(join(LS, 'llms-full.txt'), lmDict(true));
}
mkdirSync(join(ROOT, 'docs', 'landing-menu'), { recursive: true });
writeFileSync(join(ROOT, 'docs', 'landing-menu', 'index.html'), redirect.replace(/giting\.kr\/skills\//g, 'giting.kr/skills/landing-menu'));
writeFileSync(join(ROOT, 'docs', 'landing-menu', 'llms.txt'), lmDict(false));
console.log(`built landing-menu: items ${lmMenu.items.length} · core ${(lmCore.length / 1024).toFixed(0)}KB`);

// ── 캐러셀 메뉴판 (carousel-menu) — 09 ─────────────────────────────
// 인스타 캐러셀 장 사전. 장 견본은 tools/gen.mjs 가 demos/slides.html 로 낸다(1080×1350 을 360×450 으로). 룩은 design-brief, 꼴과 순서는 여기.
const CMP = join(ROOT, 'plugins', 'carousel-menu');
const cmMenu = JSON.parse(readFileSync(join(CMP, 'menu.json'), 'utf8'));
const cmBy = id => cmMenu.items.filter(i => i.category === id);
const cmFrags = {};
for (const fn of readdirSync(join(CMP, 'demos')).filter(f => f.endsWith('.html'))) {
  const parts = readFileSync(join(CMP, 'demos', fn), 'utf8').split(/<!--\s*@([a-z0-9-]+)([^>]*?)-->/);
  for (let i = 1; i < parts.length; i += 3) {
    if (cmFrags[parts[i]]) { console.error(`carousel-menu 데모 마커가 두 번 나옴: @${parts[i]}`); process.exit(1); }
    cmFrags[parts[i]] = { h: Number((parts[i + 1].match(/h=(\d+)/) || [])[1] || 490), body: parts[i + 2].trim() };
  }
}
const cmMiss = cmMenu.items.filter(it => !cmFrags[it.id]).map(it => it.id);
if (cmMiss.length) { console.error('carousel-menu 데모 없는 항목:', cmMiss.join(', ')); process.exit(1); }
for (const r of cmMenu.recipes) {
  for (const id of r.order) if (!cmMenu.items.find(i => i.id === id)) { console.error('carousel-menu 레시피가 없는 항목을 가리킴:', r.id, id); process.exit(1); }
  for (let k = 1; k < r.order.length; k++) if (r.order[k] === r.order[k - 1]) { console.error('carousel-menu 레시피에 같은 꼴이 연달아:', r.id, r.order[k]); process.exit(1); }
}
const cmStandalone = it => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(it.name.ko)} ${esc(it.name.en)} · 캐러셀 메뉴판</title><style>body{margin:0;background:#f6f5f2}</style></head><body>
${cmFrags[it.id].body}
</body></html>`;
const cmCode = {};
rmSync(join(CMP, 'components'), { recursive: true, force: true });
mkdirSync(join(CMP, 'components'), { recursive: true });
for (const it of cmMenu.items) { cmCode[it.id] = cmStandalone(it); writeFileSync(join(CMP, 'components', `${it.id}.html`), cmCode[it.id]); }
const CM_RAW = 'https://raw.githubusercontent.com/hanmariyang/giting-skills/main/plugins/carousel-menu/components';
const cmItem = id => cmMenu.items.find(i => i.id === id);
const CM_CSS = `.cmgal{--ink:#17171b;--ink2:#6b6c74;--line:#e6e4df;--acc:#E5482A;--bg:#f6f5f2;font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:var(--ink)}
.cmgal .cm-nav{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 20px}
.cmgal .cm-nav a{font-size:12.5px;color:var(--ink2);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:5px 12px;background:#fff}
.cmgal .cm-nav a b{color:var(--acc);margin-right:5px}
.cmgal .cm-rules{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 18px;margin:0 0 22px}
.cmgal .cm-rules b{font-size:14px}.cmgal .cm-rules ul{margin:8px 0 0;padding-left:18px;font-size:12.5px;color:var(--ink2);line-height:1.7}
.cmgal .cm-cat{margin:0 0 30px;scroll-margin-top:80px}
.cmgal .cm-cat h2{font-size:17px;font-weight:800;display:flex;align-items:center;gap:9px;margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid var(--line)}
.cmgal .cm-cat h2 .no{color:var(--acc)}.cmgal .cm-cat h2 .count{font-size:12px;color:#9a9aa4;font-weight:600}
.cmgal .cm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.cmgal .cm-card{border:1px solid var(--line);border-radius:13px;overflow:hidden;background:#fff;display:flex;flex-direction:column;min-width:0}
.cmgal .cm-card header{display:flex;align-items:baseline;gap:8px;padding:11px 14px;border-bottom:1px solid var(--line)}
.cmgal .cm-card h3{font-size:14.5px;font-weight:800;margin:0}.cmgal .cm-card .en{font-family:ui-monospace,monospace;font-size:11px;color:#9a9aa4;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cmgal .copy{flex:none;font-size:11.5px;border:1px solid var(--line);background:#fff;border-radius:7px;padding:3px 10px;cursor:pointer;color:var(--ink2)}
.cmgal .cm-card iframe{display:block;width:100%;border:0;background:#f6f5f2}
.cmgal .cm-card footer{padding:10px 14px 12px;border-top:1px solid var(--line);font-size:12px;color:var(--ink2);display:grid;gap:4px;margin-top:auto}
.cmgal .cm-card footer .al{color:var(--acc)}.cmgal .cm-card footer .vs{color:#9a9aa4}.cmgal .cm-card footer .ask{border-top:1px dashed var(--line);padding-top:6px;color:var(--ink)}
.cmgal .cm-rcp{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
.cmgal .cm-r{border:1px solid var(--line);border-radius:13px;background:#fff;padding:14px 16px;min-width:0}
.cmgal .cm-r header{display:flex;align-items:center;gap:8px}.cmgal .cm-r h3{font-size:15px;margin:0;flex:1}
.cmgal .cm-r ol{margin:10px 0 0;padding:0;list-style:none;display:grid;gap:5px;counter-reset:s}
.cmgal .cm-r li{counter-increment:s;font-size:13px;display:flex;gap:8px}.cmgal .cm-r li::before{content:counter(s);font-weight:800;color:var(--acc);width:14px}
.cmgal .cm-r li a{color:var(--ink);text-decoration:none;border-bottom:1px solid var(--line)}
.cmgal .cm-r p{font-size:12px;color:var(--ink2);margin:10px 0 0;line-height:1.6}
@media(prefers-color-scheme:dark){.cmgal{--ink:#ececea;--ink2:#a9aab0;--line:#2a2a2e;--bg:#1a1a1d}.cmgal .cm-card,.cmgal .cm-r,.cmgal .cm-rules,.cmgal .cm-nav a,.cmgal .copy{background:#1d1d20}}`;
const cmCard = it => `<article class="cm-card" id="c-${it.id}">
  <header><h3>${esc(it.name.ko)}</h3><span class="en">${esc(it.name.en)}</span><button class="copy" data-copy="${attr(it.ask)}" title="요청 문장 복사">문장 복사</button></header>
  <iframe title="${esc(it.name.ko)} 견본" loading="lazy" style="height:${cmFrags[it.id].h}px" srcdoc="${attr(cmCode[it.id])}"></iframe>
  <footer><span class="al">"${esc(it.aliases[0])}"</span><span>${esc(it.oneliner)}</span>${it.vs ? `<span class="vs">↔ ${esc(it.vs)}</span>` : ''}<span class="ask">${esc(it.ask)}</span></footer>
</article>`;
const CM_HERO = ['cover-question', 'checklist', 'follow-card'];
const cmFig = id => { const it = cmItem(id); return `<figure><iframe title="${esc(it.name.ko)} 견본" loading="lazy" style="height:${cmFrags[id].h}px" srcdoc="${attr(cmCode[id])}"></iframe><figcaption>${esc(it.name.ko)}<span>"${esc(it.aliases[0])}"</span></figcaption></figure>`; };
const cmF = cmMenu.formula;
const cmIntro = ipPanels('carousel-menu', '.cmgal', '--ip-acc:var(--acc);--ip-ink:var(--ink);--ip-ink2:var(--ink2);--ip-ink3:var(--ink2);--ip-paper:#fff;--ip-line:var(--line);--ip-wash:var(--bg)', [
  { lay: 'center', bg: 'pale', chip: `캐러셀 메뉴판 · ${cmMenu.items.length}가지 장 · 레시피 ${cmMenu.recipes.length}`, h: '캐러셀은 예쁜 한 장이 아니라<br><em>넘기게 만드는 순서</em>예요',
    sub: '장마다 꼴에 이름이 있어요. <b>이름과 순서로</b> 시키면 몇 장째에 무엇을 둘지가 한 번에 통해요. 룩(색·글꼴)은 design-brief 에서 와요.',
    body: `<div class="ip-three">${CM_HERO.map(cmFig).join('')}</div>${ipBub(cmMenu.recipes[0].ask)}` },
  { lay: 'stack', bg: 'white', chip: 'AI한테 시키는 공식', h: '장마다 꼴 이름과<br><em>실제 값</em>을 적어요', sub: esc(cmF.note), body: ipFormula(cmF) },
  { lay: 'wide', bg: 'pale', chip: '6장 레시피', h: '주제에 맞는<br><em>순서</em>부터 골라요', sub: '누르면 그 레시피의 장 순서와 요청문으로 가요.',
    body: `<div class="ip-rows">${cmMenu.recipes.map(r => `<a class="r" href="#cr-${r.id}"><span class="w"><b style="color:var(--ip-ink)">${esc(r.ko)}</b></span><span class="n">${r.order.slice(0, 3).map(id => `<b>${esc(cmItem(id).name.ko)}</b>`).join('')}</span></a>`).join('')}</div>` },
  { lay: 'band', bg: 'dark', chip: 'Claude Code 스킬', h: '「카드뉴스 만들어줘」가<br><em>장 목록</em>으로 바뀌어요', sub: '스킬로 깔아 두면 레시피를 고르고 장 목록을 먼저 보여 준 뒤에 만들어요.', body: ipInstall('carousel-menu') },
]);
const cmCore = `<div class="cmgal">
<style>${CM_CSS}</style>
${cmIntro}
<nav class="cm-nav">${cmMenu.categories.map(c => `<a href="#cc-${c.id}"><b>${c.no}</b>${esc(c.ko)} ${cmBy(c.id).length}</a>`).join('')}<a href="#cc-recipes"><b>＋</b>6장 레시피 ${cmMenu.recipes.length}</a></nav>
<div class="cm-rules"><b>공통 규격</b><ul>${cmMenu.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>
${cmMenu.categories.map(cat => `<section class="cm-cat" id="cc-${cat.id}">
  <h2><span class="no">${cat.no}</span> ${esc(cat.ko)} <span class="count">${cmBy(cat.id).length}</span></h2>
  <div class="cm-grid">${cmBy(cat.id).map(cmCard).join('\n')}</div>
</section>`).join('\n')}
<section class="cm-cat" id="cc-recipes">
  <h2><span class="no">＋</span> 6장 레시피 <span class="count">${cmMenu.recipes.length}</span></h2>
  <div class="cm-rcp">${cmMenu.recipes.map(r => `<article class="cm-r" id="cr-${r.id}"><header><h3>${esc(r.ko)}</h3><button class="copy" data-copy="${attr(r.ask)}" title="요청문 복사">문장 복사</button></header>
    <ol>${r.order.map(id => `<li><a href="#c-${id}">${esc(cmItem(id).name.ko)}</a></li>`).join('')}</ol><p>${esc(r.ask)}</p></article>`).join('\n')}</div>
</section>
<script>document.querySelectorAll('.cmgal .copy').forEach(function(b){b.addEventListener('click',function(){try{navigator.clipboard.writeText(b.getAttribute('data-copy'));}catch(x){}var t=b.textContent;b.textContent='복사됨';setTimeout(function(){b.textContent=t},1200);});});</script>
</div>
`;
const cmDict = full => `# 캐러셀 메뉴판 (carousel-menu) · Giting Skills

> ${cmMenu.description}
> 공식: ${cmF.pattern}  (✕ "${cmF.bad}" → ○ "${cmF.good}")
> 갤러리: https://giting.kr/skills/carousel-menu · repo: https://github.com/hanmariyang/giting-skills (MIT)
> Claude Code: /plugin marketplace add hanmariyang/giting-skills → /plugin install carousel-menu@giting

## 공통 규격
${cmMenu.rules.map(r => `- ${r}`).join('\n')}

${cmMenu.categories.map(cat => `## ${cat.no} ${cat.ko}

${cmBy(cat.id).map(it => `### ${it.name.ko} (${it.name.en})
- 별칭: ${it.aliases.map(a => `"${a}"`).join(' · ')}
- 정의: ${it.oneliner}${it.vs ? `
- 구분: ${it.vs}` : ''}
- 요청 문장: ${it.ask}
- 견본: ${CM_RAW}/${it.id}.html${full ? `

\`\`\`html
${cmCode[it.id].trim()}
\`\`\`` : ''}
`).join('\n')}`).join('\n')}
## 6장 레시피
${cmMenu.recipes.map(r => `### ${r.ko}
- 순서: ${r.order.map(id => cmItem(id).name.ko).join(' → ')}
- 요청 문장: ${r.ask}`).join('\n\n')}
`;
if (SITE_DIR) {
  const CS = join(SITE_DIR, 'carousel-menu');
  mkdirSync(CS, { recursive: true });
  writeFileSync(join(CS, 'gallery-core.html'), cmCore);
  writeFileSync(join(CS, 'llms.txt'), cmDict(false));
  writeFileSync(join(CS, 'llms-full.txt'), cmDict(true));
}
mkdirSync(join(ROOT, 'docs', 'carousel-menu'), { recursive: true });
writeFileSync(join(ROOT, 'docs', 'carousel-menu', 'index.html'), redirect.replace(/giting\.kr\/skills\//g, 'giting.kr/skills/carousel-menu'));
writeFileSync(join(ROOT, 'docs', 'carousel-menu', 'llms.txt'), cmDict(false));
console.log(`built carousel-menu: items ${cmMenu.items.length} · recipes ${cmMenu.recipes.length} · core ${(cmCore.length / 1024).toFixed(0)}KB`);

// ── 썸네일 메뉴판 (thumb-menu) — 10 ─────────────────────────────
// 유튜브 썸네일·쇼츠 표지 사전. 견본은 tools/gen.mjs 가 demos/thumbs.html 로 낸다(1280×720 을 줄여서).
// 그림은 assets/*.webp(우리가 만든 것). {{a:이름}} 을 쓰임새마다 바꿔 넣는다:
//   components/ = data URI(자가완결) · 갤러리 srcdoc = /skills/thumb-menu/a/ · llms = raw GitHub 주소
const TMP = join(ROOT, 'plugins', 'thumb-menu');
const tmMenu = JSON.parse(readFileSync(join(TMP, 'menu.json'), 'utf8'));
const tmBy = id => tmMenu.items.filter(i => i.category === id);
const tmFrags = {};
for (const fn of readdirSync(join(TMP, 'demos')).filter(f => f.endsWith('.html'))) {
  const parts = readFileSync(join(TMP, 'demos', fn), 'utf8').split(/<!--\s*@([a-z0-9-]+)([^>]*?)-->/);
  for (let i = 1; i < parts.length; i += 3) {
    if (tmFrags[parts[i]]) { console.error(`thumb-menu 데모 마커가 두 번 나옴: @${parts[i]}`); process.exit(1); }
    tmFrags[parts[i]] = { h: Number((parts[i + 1].match(/h=(\d+)/) || [])[1] || 244), body: parts[i + 2].trim() };
  }
}
const tmMiss = tmMenu.items.filter(it => !tmFrags[it.id]).map(it => it.id);
if (tmMiss.length) { console.error('thumb-menu 데모 없는 항목:', tmMiss.join(', ')); process.exit(1); }
for (const r of tmMenu.recipes) for (const id of r.order) if (!tmMenu.items.find(i => i.id === id)) { console.error('thumb-menu 레시피가 없는 항목을 가리킴:', r.id, id); process.exit(1); }
const tmAssets = readdirSync(join(TMP, 'assets')).filter(f => f.endsWith('.webp')).map(f => f.replace(/\.webp$/, ''));
const TM_RAW_A = 'https://raw.githubusercontent.com/hanmariyang/giting-skills/main/plugins/thumb-menu/assets';
const tmSub = (s, kind) => s.replace(/\{\{a:([a-z0-9-]+)\}\}/g, (_, n) => {
  if (!tmAssets.includes(n)) { console.error('thumb-menu 없는 그림:', n); process.exit(1); }
  if (kind === 'data') return `data:image/webp;base64,${readFileSync(join(TMP, 'assets', `${n}.webp`)).toString('base64')}`;
  if (kind === 'site') return `/skills/thumb-menu/a/${n}.webp`;
  return `${TM_RAW_A}/${n}.webp`;
});
const tmDoc = (it, kind) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(it.name.ko)} ${esc(it.name.en)} · 썸네일 메뉴판</title><style>body{margin:0;background:#f6f5f2}</style></head><body>
${tmSub(tmFrags[it.id].body, kind)}
</body></html>`;
const tmCode = {}, tmSite = {};
rmSync(join(TMP, 'components'), { recursive: true, force: true });
mkdirSync(join(TMP, 'components'), { recursive: true });
for (const it of tmMenu.items) { tmCode[it.id] = tmDoc(it, 'data'); tmSite[it.id] = tmDoc(it, 'site'); writeFileSync(join(TMP, 'components', `${it.id}.html`), tmCode[it.id]); }
const TM_RAW = 'https://raw.githubusercontent.com/hanmariyang/giting-skills/main/plugins/thumb-menu/components';
const tmItem = id => tmMenu.items.find(i => i.id === id);
const tmAZ = [...tmMenu.items].sort((a, b) => a.name.en.localeCompare(b.name.en, 'en'));
const TM_CSS = `.tmgal{--ink:#17171b;--ink2:#6b6c74;--line:#e6e4df;--acc:#F05032;--bg:#f6f5f2;font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:var(--ink)}
.tmgal .tm-nav{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 20px}
.tmgal .tm-nav a{font-size:12.5px;color:var(--ink2);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:5px 12px;background:#fff}
.tmgal .tm-nav a b{color:var(--acc);margin-right:5px}
.tmgal .tm-rules{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 18px;margin:0 0 22px}
.tmgal .tm-rules b{font-size:14px}.tmgal .tm-rules ul{margin:8px 0 0;padding-left:18px;font-size:12.5px;color:var(--ink2);line-height:1.7}
.tmgal .tm-cat{margin:0 0 30px;scroll-margin-top:80px}
.tmgal .tm-cat h2{font-size:17px;font-weight:800;display:flex;align-items:center;gap:9px;margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid var(--line)}
.tmgal .tm-cat h2 .no{color:var(--acc)}.tmgal .tm-cat h2 .count{font-size:12px;color:#9a9aa4;font-weight:600}
.tmgal .tm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.tmgal .tm-card{border:1px solid var(--line);border-radius:13px;overflow:hidden;background:#fff;display:flex;flex-direction:column;min-width:0}
.tmgal .tm-card header{display:flex;align-items:baseline;gap:8px;padding:11px 14px;border-bottom:1px solid var(--line)}
.tmgal .tm-card h3{font-size:14.5px;font-weight:800;margin:0}.tmgal .tm-card .en{font-family:ui-monospace,monospace;font-size:11px;color:#9a9aa4;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tmgal .copy{flex:none;font-size:11.5px;border:1px solid var(--line);background:#fff;border-radius:7px;padding:3px 10px;cursor:pointer;color:var(--ink2)}
.tmgal .tm-card iframe{display:block;width:100%;border:0;background:#f6f5f2}
.tmgal .tm-card footer{padding:10px 14px 12px;border-top:1px solid var(--line);font-size:12px;color:var(--ink2);display:grid;gap:4px;margin-top:auto}
.tmgal .tm-card footer .al{color:var(--acc)}.tmgal .tm-card footer .vs{color:#9a9aa4}.tmgal .tm-card footer .ask{border-top:1px dashed var(--line);padding-top:6px;color:var(--ink)}
.tmgal .tm-steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;counter-reset:s}
.tmgal .tm-steps li{counter-increment:s;background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 14px;font-size:12.5px;color:var(--ink2);line-height:1.6;min-width:0}
.tmgal .tm-steps li b{display:block;font-size:14px;color:var(--ink);margin-bottom:4px}.tmgal .tm-steps li b::before{content:counter(s,decimal-leading-zero) ' ';color:var(--acc)}
.tmgal .tm-steps li i{display:block;font-style:normal;border-top:1px dashed var(--line);margin-top:6px;padding-top:6px}
.tmgal .tm-az{columns:3 220px;column-gap:24px;font-size:13px;margin:0;padding:0;list-style:none}
.tmgal .tm-az li{break-inside:avoid;padding:4px 0;border-bottom:1px solid var(--line)}.tmgal .tm-az a{color:var(--ink);text-decoration:none}.tmgal .tm-az span{color:#9a9aa4;margin-left:6px}
.tmgal .tm-rcp{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
.tmgal .tm-r{border:1px solid var(--line);border-radius:13px;background:#fff;padding:14px 16px;min-width:0}
.tmgal .tm-r header{display:flex;align-items:center;gap:8px}.tmgal .tm-r h3{font-size:15px;margin:0;flex:1}
.tmgal .tm-r ol{margin:10px 0 0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:6px}
.tmgal .tm-r li a{font-size:12.5px;color:var(--ink);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:3px 10px}
.tmgal .tm-r p{font-size:12px;color:var(--ink2);margin:10px 0 0;line-height:1.6}
@media(prefers-color-scheme:dark){.tmgal{--ink:#ececea;--ink2:#a9aab0;--line:#2a2a2e;--bg:#1a1a1d}.tmgal .tm-card,.tmgal .tm-r,.tmgal .tm-rules,.tmgal .tm-nav a,.tmgal .copy,.tmgal .tm-steps li{background:#1d1d20}}`;
const tmCard = it => `<article class="tm-card" id="t-${it.id}">
  <header><h3>${esc(it.name.ko)}</h3><span class="en">${esc(it.name.en)}</span><button class="copy" data-copy="${attr(it.ask)}" title="요청 문장 복사">문장 복사</button></header>
  <iframe title="${esc(it.name.ko)} 견본" loading="lazy" style="height:${tmFrags[it.id].h}px" srcdoc="${attr(tmSite[it.id])}"></iframe>
  <footer><span class="al">"${esc(it.aliases[0])}"</span><span>${esc(it.oneliner)}</span>${it.vs ? `<span class="vs">↔ ${esc(it.vs)}</span>` : ''}<span class="ask">${esc(it.ask)}</span></footer>
</article>`;
const TM_HERO = ['thirds', 'versus', 'reaction-closeup'];
const tmFig = id => { const it = tmItem(id); return `<figure><iframe title="${esc(it.name.ko)} 견본" loading="lazy" style="height:${tmFrags[id].h}px" srcdoc="${attr(tmSite[id])}"></iframe><figcaption>${esc(it.name.ko)}<span>"${esc(it.aliases[0])}"</span></figcaption></figure>`; };
const tmF = tmMenu.formula;
const tmIntro = ipPanels('thumb-menu', '.tmgal', '--ip-acc:var(--acc);--ip-ink:var(--ink);--ip-ink2:var(--ink2);--ip-ink3:var(--ink2);--ip-paper:#fff;--ip-line:var(--line);--ip-wash:var(--bg)', [
  { lay: 'center', bg: 'pale', chip: `썸네일 메뉴판 · ${tmMenu.items.length}가지 · ${tmMenu.categories.length}갈래`, h: '「눈에 띄게」 말고<br><em>이름으로</em> 시켜요',
    sub: '썸네일 기법에는 다 이름이 있어요. <b>구도·주인공·글자·장치</b>를 이름으로 하나씩 고르면 한 번에 통해요.',
    body: `<div class="ip-three">${TM_HERO.map(tmFig).join('')}</div>${ipBub(tmMenu.recipes[0].ask)}` },
  { lay: 'stack', bg: 'white', chip: 'AI한테 시키는 공식', h: '구도부터 장치까지<br><em>이름 하나씩</em>', sub: esc(tmF.note), body: ipFormula(tmF) },
  { lay: 'wide', bg: 'pale', chip: '영상 종류별 레시피', h: '내 영상에 맞는<br><em>조합</em>부터 골라요', sub: '누르면 그 레시피의 조합과 요청문으로 가요.',
    body: `<div class="ip-rows">${tmMenu.recipes.map(r => `<a class="r" href="#tr-${r.id}"><span class="w"><b style="color:var(--ip-ink)">${esc(r.ko)}</b></span><span class="n">${r.order.slice(0, 3).map(id => `<b>${esc(tmItem(id).name.ko)}</b>`).join('')}</span></a>`).join('')}</div>` },
  { lay: 'band', bg: 'dark', chip: 'Claude Code 스킬', h: '「썸네일 만들어줘」가<br><em>조합 목록</em>으로 바뀌어요', sub: '스킬로 깔아 두면 구도·주인공·글자·장치를 먼저 고르고, 다 만든 뒤 작게 줄여 확인해요.', body: ipInstall('thumb-menu') },
]);
const tmCore = `<div class="tmgal">
<style>${TM_CSS}</style>
${tmIntro}
<nav class="tm-nav"><a href="#tc-process"><b>A–Z</b>처음부터 끝까지 ${tmMenu.process.length}단계</a>${tmMenu.categories.map(c => `<a href="#tc-${c.id}"><b>${c.no}</b>${esc(c.ko)} ${tmBy(c.id).length}</a>`).join('')}<a href="#tc-recipes"><b>＋</b>레시피 ${tmMenu.recipes.length}</a><a href="#tc-index"><b>EN</b>영문 이름 A–Z</a></nav>
<div class="tm-rules"><b>공통 규격</b><ul>${tmMenu.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>
<section class="tm-cat" id="tc-process">
  <h2><span class="no">A–Z</span> 처음부터 끝까지 <span class="count">${tmMenu.process.length}단계</span></h2>
  <ol class="tm-steps">${tmMenu.process.map(p => `<li><b>${esc(p.step)}</b>${esc(p.do)}<i>확인: ${esc(p.check)}</i></li>`).join('')}</ol>
</section>
${tmMenu.categories.map(cat => `<section class="tm-cat" id="tc-${cat.id}">
  <h2><span class="no">${cat.no}</span> ${esc(cat.ko)} <span class="count">${tmBy(cat.id).length}</span></h2>
  <div class="tm-grid">${tmBy(cat.id).map(tmCard).join('\n')}</div>
</section>`).join('\n')}
<section class="tm-cat" id="tc-recipes">
  <h2><span class="no">＋</span> 영상 종류별 레시피 <span class="count">${tmMenu.recipes.length}</span></h2>
  <div class="tm-rcp">${tmMenu.recipes.map(r => `<article class="tm-r" id="tr-${r.id}"><header><h3>${esc(r.ko)}</h3><button class="copy" data-copy="${attr(r.ask)}" title="요청문 복사">문장 복사</button></header>
    <ol>${r.order.map(id => `<li><a href="#t-${id}">${esc(tmItem(id).name.ko)}</a></li>`).join('')}</ol><p>${esc(r.ask)}</p></article>`).join('\n')}</div>
</section>
<section class="tm-cat" id="tc-index">
  <h2><span class="no">EN</span> 영문 이름 A–Z <span class="count">${tmAZ.length}</span></h2>
  <ul class="tm-az">${tmAZ.map(it => `<li><a href="#t-${it.id}">${esc(it.name.en)}</a><span>${esc(it.name.ko)}</span></li>`).join('')}</ul>
</section>
<script>document.querySelectorAll('.tmgal .copy').forEach(function(b){b.addEventListener('click',function(){try{navigator.clipboard.writeText(b.getAttribute('data-copy'));}catch(x){}var t=b.textContent;b.textContent='복사됨';setTimeout(function(){b.textContent=t},1200);});});</script>
</div>
`;
const tmDict = full => `# 썸네일 메뉴판 (thumb-menu) · Giting Skills

> ${tmMenu.description}
> 공식: ${tmF.pattern}  (✕ "${tmF.bad}" → ○ "${tmF.good}")
> 갤러리: https://giting.kr/skills/thumb-menu · repo: https://github.com/hanmariyang/giting-skills (MIT)
> Claude Code: /plugin marketplace add hanmariyang/giting-skills → /plugin install thumb-menu@giting

## 공통 규격
${tmMenu.rules.map(r => `- ${r}`).join('\n')}

## 처음부터 끝까지 (A–Z)
${tmMenu.process.map((p, i) => `${i + 1}. **${p.step}** ${p.do} (확인: ${p.check})`).join('\n')}

${tmMenu.categories.map(cat => `## ${cat.no} ${cat.ko}

${tmBy(cat.id).map(it => `### ${it.name.ko} (${it.name.en})
- 별칭: ${it.aliases.map(a => `"${a}"`).join(' · ')}
- 정의: ${it.oneliner}${it.vs ? `
- 구분: ${it.vs}` : ''}${it.use ? `
- 쓰는 곳: ${it.use}` : ''}
- 요청 문장: ${it.ask}
- 견본: ${TM_RAW}/${it.id}.html${full ? `

\`\`\`html
${tmDoc(it, 'raw').trim()}
\`\`\`` : ''}
`).join('\n')}`).join('\n')}
## 영상 종류별 레시피
${tmMenu.recipes.map(r => `### ${r.ko}
- 조합: ${r.order.map(id => tmItem(id).name.ko).join(' + ')}
- 요청 문장: ${r.ask}`).join('\n\n')}

## 영문 이름 A–Z
${tmAZ.map(it => `- ${it.name.en} = ${it.name.ko}`).join('\n')}
`;
if (SITE_DIR) {
  const TS = join(SITE_DIR, 'thumb-menu');
  rmSync(join(TS, 'a'), { recursive: true, force: true });
  mkdirSync(join(TS, 'a'), { recursive: true });
  for (const n of tmAssets) writeFileSync(join(TS, 'a', `${n}.webp`), readFileSync(join(TMP, 'assets', `${n}.webp`)));
  writeFileSync(join(TS, 'gallery-core.html'), tmCore);
  writeFileSync(join(TS, 'llms.txt'), tmDict(false));
  writeFileSync(join(TS, 'llms-full.txt'), tmDict(true));
}
mkdirSync(join(ROOT, 'docs', 'thumb-menu'), { recursive: true });
writeFileSync(join(ROOT, 'docs', 'thumb-menu', 'index.html'), redirect.replace(/giting\.kr\/skills\//g, 'giting.kr/skills/thumb-menu'));
writeFileSync(join(ROOT, 'docs', 'thumb-menu', 'llms.txt'), tmDict(false));
console.log(`built thumb-menu: items ${tmMenu.items.length} · steps ${tmMenu.process.length} · recipes ${tmMenu.recipes.length} · core ${(tmCore.length / 1024).toFixed(0)}KB`);

// ── 그리드 메뉴판 (grid-menu) — 12 ─────────────────────────────
// 포스터 그리드 사전. 견본은 tools/gen.mjs 가 demos/posters.html 로 낸다(캔버스 4:5, 8초 반복, 그리드 선 켜고 끄기).
// 그림은 tools/engine.js 의 GP[id] 하나. {{engine}} 을 쓰임새마다 바꿔 넣는다:
//   components/ = 엔진 통째로(자가완결) · 갤러리 srcdoc·스토어 = /skills/grid-menu/engine.js · llms = jsDelivr 주소
const GMP = join(ROOT, 'plugins', 'grid-menu');
const gmMenu = JSON.parse(readFileSync(join(GMP, 'menu.json'), 'utf8'));
const gmBy = id => gmMenu.items.filter(i => i.category === id);
const gmEngine = readFileSync(join(GMP, 'tools', 'engine.js'), 'utf8');
const gmFrags = {};
for (const fn of readdirSync(join(GMP, 'demos')).filter(f => f.endsWith('.html'))) {
  const parts = readFileSync(join(GMP, 'demos', fn), 'utf8').split(/<!--\s*@([a-z0-9-]+)([^>]*?)-->/);
  for (let i = 1; i < parts.length; i += 3) {
    if (gmFrags[parts[i]]) { console.error(`grid-menu 데모 마커가 두 번 나옴: @${parts[i]}`); process.exit(1); }
    gmFrags[parts[i]] = { h: Number((parts[i + 1].match(/h=(\d+)/) || [])[1] || 520), body: parts[i + 2].trim() };
  }
}
const gmMiss = gmMenu.items.filter(it => !gmFrags[it.id]).map(it => it.id);
if (gmMiss.length) { console.error('grid-menu 데모 없는 항목:', gmMiss.join(', ')); process.exit(1); }
for (const r of gmMenu.recipes) {
  for (const id of r.order) if (!gmMenu.items.find(i => i.id === id)) { console.error('grid-menu 레시피가 없는 항목을 가리킴:', r.id, id); process.exit(1); }
  if (!gmBy('grid').some(g => r.order.includes(g.id))) { console.error('grid-menu 레시피에 그리드 종류가 없음:', r.id); process.exit(1); }
}
const GM_CDN = 'https://cdn.jsdelivr.net/gh/hanmariyang/giting-skills@main/plugins/grid-menu/tools/engine.js';
const gmEng = kind => kind === 'inline' ? `<script>\n${gmEngine.trim()}\n</script>` : `<script src="${kind === 'site' ? '/skills/grid-menu/engine.js' : GM_CDN}"></script>`;
const gmDoc = (it, kind) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(it.name.ko)} ${esc(it.name.en)} · 그리드 메뉴판</title><style>body{margin:0;background:#f3f3f5}</style></head><body>
${gmFrags[it.id].body.replace('{{engine}}', gmEng(kind))}
</body></html>`;
const gmSite = {};
rmSync(join(GMP, 'components'), { recursive: true, force: true });
mkdirSync(join(GMP, 'components'), { recursive: true });
for (const it of gmMenu.items) { writeFileSync(join(GMP, 'components', `${it.id}.html`), gmDoc(it, 'inline')); gmSite[it.id] = gmDoc(it, 'site'); }
const GM_RAW = 'https://raw.githubusercontent.com/hanmariyang/giting-skills/main/plugins/grid-menu/components';
const gmItem = id => gmMenu.items.find(i => i.id === id);
const GM_CSS = `.gmgal{--ink:#16161a;--ink2:#6b6c74;--line:#e4e4e8;--acc:#E2457A;--bg:#f3f3f5;font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:var(--ink)}
.gmgal .gm-nav{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 20px}
.gmgal .gm-nav a{font-size:12.5px;color:var(--ink2);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:5px 12px;background:#fff}
.gmgal .gm-nav a b{color:var(--acc);margin-right:5px}
.gmgal .gm-rules{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 18px;margin:0 0 22px}
.gmgal .gm-rules b{font-size:14px}.gmgal .gm-rules ul{margin:8px 0 0;padding-left:18px;font-size:12.5px;color:var(--ink2);line-height:1.7}
.gmgal .gm-cat{margin:0 0 30px;scroll-margin-top:80px}
.gmgal .gm-cat h2{font-size:17px;font-weight:800;display:flex;align-items:center;gap:9px;margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid var(--line)}
.gmgal .gm-cat h2 .no{color:var(--acc)}.gmgal .gm-cat h2 .count{font-size:12px;color:#9a9aa4;font-weight:600}
.gmgal .gm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.gmgal .gm-card{border:1px solid var(--line);border-radius:13px;overflow:hidden;background:#fff;display:flex;flex-direction:column;min-width:0}
.gmgal .gm-card header{display:flex;align-items:baseline;gap:8px;padding:11px 14px;border-bottom:1px solid var(--line)}
.gmgal .gm-card h3{font-size:14.5px;font-weight:800;margin:0}.gmgal .gm-card .en{font-family:ui-monospace,monospace;font-size:11px;color:#9a9aa4;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gmgal .copy{flex:none;font-size:11.5px;border:1px solid var(--line);background:#fff;border-radius:7px;padding:3px 10px;cursor:pointer;color:var(--ink2)}
.gmgal .gm-card iframe{display:block;width:100%;border:0;background:#f3f3f5}
.gmgal .gm-card footer{padding:10px 14px 12px;border-top:1px solid var(--line);font-size:12px;color:var(--ink2);display:grid;gap:4px;margin-top:auto}
.gmgal .gm-card footer .al{color:var(--acc)}.gmgal .gm-card footer .vs{color:#9a9aa4}.gmgal .gm-card footer .ask{border-top:1px dashed var(--line);padding-top:6px;color:var(--ink)}
.gmgal .gm-rcp{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
.gmgal .gm-r{border:1px solid var(--line);border-radius:13px;background:#fff;padding:14px 16px;min-width:0}
.gmgal .gm-r header{display:flex;align-items:center;gap:8px}.gmgal .gm-r h3{font-size:15px;margin:0;flex:1}
.gmgal .gm-r ol{margin:10px 0 0;padding:0;list-style:none;display:grid;gap:5px;counter-reset:s}
.gmgal .gm-r li{counter-increment:s;font-size:13px;display:flex;gap:8px}.gmgal .gm-r li::before{content:counter(s);font-weight:800;color:var(--acc);width:14px}
.gmgal .gm-r li a{color:var(--ink);text-decoration:none;border-bottom:1px solid var(--line)}
.gmgal .gm-r p{font-size:12px;color:var(--ink2);margin:10px 0 0;line-height:1.6}
@media(prefers-color-scheme:dark){.gmgal{--ink:#ececea;--ink2:#a9aab0;--line:#2a2a2e;--bg:#1a1a1d}.gmgal .gm-card,.gmgal .gm-r,.gmgal .gm-rules,.gmgal .gm-nav a,.gmgal .copy{background:#1d1d20}}`;
const gmCard = it => `<article class="gm-card" id="g-${it.id}">
  <header><h3>${esc(it.name.ko)}</h3><span class="en">${esc(it.name.en)}</span><button class="copy" data-copy="${attr(it.ask)}" title="요청 문장 복사">문장 복사</button></header>
  <iframe title="${esc(it.name.ko)} 견본" loading="lazy" style="height:${gmFrags[it.id].h}px" srcdoc="${attr(gmSite[it.id])}"></iframe>
  <footer><span class="al">"${esc(it.aliases[0])}"</span><span>${esc(it.oneliner)}</span>${it.vs ? `<span class="vs">↔ ${esc(it.vs)}</span>` : ''}<span class="ask">${esc(it.ask)}</span></footer>
</article>`;
const GM_HERO = ['modular-grid', 'oblique-grid', 'stacked-title'];
for (const id of GM_HERO) if (!gmItem(id)) { console.error('grid-menu GM_HERO 가 없는 항목:', id); process.exit(1); }
const gmFig = id => { const it = gmItem(id); return `<figure><iframe title="${esc(it.name.ko)} 견본" loading="lazy" style="height:${gmFrags[id].h}px" srcdoc="${attr(gmSite[id])}"></iframe><figcaption>${esc(it.name.ko)}<span>"${esc(it.aliases[0])}"</span></figcaption></figure>`; };
const gmF = gmMenu.formula;
const gmIntro = ipPanels('grid-menu', '.gmgal', '--ip-acc:var(--acc);--ip-ink:var(--ink);--ip-ink2:var(--ink2);--ip-ink3:var(--ink2);--ip-paper:#fff;--ip-line:var(--line);--ip-wash:var(--bg)', [
  { lay: 'center', bg: 'pale', chip: `그리드 메뉴판 · ${gmMenu.items.length}가지 · 레시피 ${gmMenu.recipes.length}`, h: '포스터는 「세련되게」가 아니라<br><em>그리드 이름</em>으로 시켜요',
    sub: '판을 어떻게 나누고, 칸 위에 무엇을 어떻게 앉히는지에 이름이 있어요. <b>이름과 칸 수로</b> 시키고 그리드 선을 켠 판을 같이 받으면 칸을 지켰는지 바로 보여요.',
    body: `<div class="ip-three">${GM_HERO.map(gmFig).join('')}</div>${ipBub(gmMenu.recipes[0].ask)}` },
  { lay: 'stack', bg: 'white', chip: 'AI한테 시키는 공식', h: '그리드 이름과<br><em>칸 수·여백</em>을 먼저 적어요', sub: esc(gmF.note), body: ipFormula(gmF) },
  { lay: 'wide', bg: 'pale', chip: '포스터 레시피', h: '포스터 종류에 맞는<br><em>조합</em>부터 골라요', sub: '누르면 그 레시피의 조합과 요청문으로 가요.',
    body: `<div class="ip-rows">${gmMenu.recipes.map(r => `<a class="r" href="#gr-${r.id}"><span class="w"><b style="color:var(--ip-ink)">${esc(r.ko)}</b></span><span class="n">${r.order.slice(0, 3).map(id => `<b>${esc(gmItem(id).name.ko)}</b>`).join('')}</span></a>`).join('')}</div>` },
  { lay: 'band', bg: 'dark', chip: 'Claude Code 스킬', h: '「포스터 만들어줘」가<br><em>그리드 계획</em>으로 바뀌어요', sub: '스킬로 깔아 두면 그리드·놓는 법·글자 놓기를 먼저 고르고, 그리드 선 켠 판과 끈 판 두 장으로 줘요.', body: ipInstall('grid-menu') },
]);
const gmCore = `<div class="gmgal">
<style>${GM_CSS}</style>
${gmIntro}
<nav class="gm-nav">${gmMenu.categories.map(c => `<a href="#gc-${c.id}"><b>${c.no}</b>${esc(c.ko)} ${gmBy(c.id).length}</a>`).join('')}<a href="#gc-recipes"><b>＋</b>포스터 레시피 ${gmMenu.recipes.length}</a></nav>
<div class="gm-rules"><b>공통 규격</b><ul>${gmMenu.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>
${gmMenu.categories.map(cat => `<section class="gm-cat" id="gc-${cat.id}">
  <h2><span class="no">${cat.no}</span> ${esc(cat.ko)} <span class="count">${gmBy(cat.id).length}</span></h2>
  <div class="gm-grid">${gmBy(cat.id).map(gmCard).join('\n')}</div>
</section>`).join('\n')}
<section class="gm-cat" id="gc-recipes">
  <h2><span class="no">＋</span> 포스터 레시피 <span class="count">${gmMenu.recipes.length}</span></h2>
  <div class="gm-rcp">${gmMenu.recipes.map(r => `<article class="gm-r" id="gr-${r.id}"><header><h3>${esc(r.ko)}</h3><button class="copy" data-copy="${attr(r.ask)}" title="요청문 복사">문장 복사</button></header>
    <ol>${r.order.map(id => `<li><a href="#g-${id}">${esc(gmItem(id).name.ko)}</a></li>`).join('')}</ol><p>${esc(r.ask)}</p></article>`).join('\n')}</div>
</section>
<script>document.querySelectorAll('.gmgal .copy').forEach(function(b){b.addEventListener('click',function(){try{navigator.clipboard.writeText(b.getAttribute('data-copy'));}catch(x){}var t=b.textContent;b.textContent='복사됨';setTimeout(function(){b.textContent=t},1200);});});</script>
</div>
`;
const gmDict = full => `# 그리드 메뉴판 (grid-menu) · Giting Skills

> ${gmMenu.description}
> 공식: ${gmF.pattern}  (✕ "${gmF.bad}" → ○ "${gmF.good}")
> 갤러리: https://giting.kr/skills/grid-menu · repo: https://github.com/hanmariyang/giting-skills (MIT)
> Claude Code: /plugin marketplace add hanmariyang/giting-skills → /plugin install grid-menu@giting

## 공통 규격
${gmMenu.rules.map(r => `- ${r}`).join('\n')}

${gmMenu.categories.map(cat => `## ${cat.no} ${cat.ko}

${gmBy(cat.id).map(it => `### ${it.name.ko} (${it.name.en})
- 별칭: ${it.aliases.map(a => `"${a}"`).join(' · ')}
- 정의: ${it.oneliner}${it.vs ? `
- 구분: ${it.vs}` : ''}
- 요청 문장: ${it.ask}
- 견본: ${GM_RAW}/${it.id}.html${full ? `

\`\`\`html
${gmDoc(it, 'cdn').trim()}
\`\`\`` : ''}
`).join('\n')}`).join('\n')}
## 포스터 레시피
${gmMenu.recipes.map(r => `### ${r.ko}
- 조합: ${r.order.map(id => gmItem(id).name.ko).join(' + ')}
- 요청 문장: ${r.ask}`).join('\n\n')}
`;
if (SITE_DIR) {
  const GS = join(SITE_DIR, 'grid-menu');
  mkdirSync(GS, { recursive: true });
  writeFileSync(join(GS, 'engine.js'), gmEngine);
  writeFileSync(join(GS, 'gallery-core.html'), gmCore);
  writeFileSync(join(GS, 'llms.txt'), gmDict(false));
  writeFileSync(join(GS, 'llms-full.txt'), gmDict(true));
}
mkdirSync(join(ROOT, 'docs', 'grid-menu'), { recursive: true });
writeFileSync(join(ROOT, 'docs', 'grid-menu', 'index.html'), redirect.replace(/giting\.kr\/skills\//g, 'giting.kr/skills/grid-menu'));
writeFileSync(join(ROOT, 'docs', 'grid-menu', 'llms.txt'), gmDict(false));
console.log(`built grid-menu: items ${gmMenu.items.length} · recipes ${gmMenu.recipes.length} · core ${(gmCore.length / 1024).toFixed(0)}KB`);

// ── 흐름 메뉴판 (flow-menu) — 13 ─────────────────────────────
// 고객이 한 가지 일을 끝내기까지 넘기는 화면을 장 단위로. 장마다 부품은 app-menu id 로 적고 이름은 app-menu 에서 읽는다.
// 견본 = demos/<흐름 id>.html (자가완결, 부품마다 data-menu). components/ 는 그 사본.
const FLWP = join(ROOT, 'plugins', 'flow-menu');
const flwMenu = JSON.parse(readFileSync(join(FLWP, 'menu.json'), 'utf8'));
const flwApp = JSON.parse(readFileSync(join(ROOT, 'plugins', 'app-menu', 'menu.json'), 'utf8'));
const flwPart = id => { const it = flwApp.items.find(i => i.id === id); if (!it) { console.error('flow-menu 부품이 app-menu 에 없음:', id); process.exit(1); } return it; };
const flwDemo = {};
for (const f of flwMenu.flows) {
  const p = join(FLWP, 'demos', `${f.id}.html`);
  if (!existsSync(p)) { console.error('flow-menu 견본 없음:', f.id); process.exit(1); }
  flwDemo[f.id] = readFileSync(p, 'utf8');
  for (const s of f.steps) {
    if (s.parts.length > 3) { console.error('flow-menu 장마다 부품은 셋까지:', f.id, s.ko); process.exit(1); }
    for (const id of s.parts) {
      flwPart(id);
      const scr = flwDemo[f.id].split(/<div class="phone[^"]*" id="/).find(x => x.startsWith(`${s.screen}"`));
      if (!scr || !scr.includes(`data-menu="${id}"`)) { console.error('flow-menu 견본 화면에 그 부품이 없음:', f.id, s.screen, id); process.exit(1); }
    }
  }
}
rmSync(join(FLWP, 'components'), { recursive: true, force: true });
mkdirSync(join(FLWP, 'components'), { recursive: true });
for (const f of flwMenu.flows) writeFileSync(join(FLWP, 'components', `${f.id}.html`), flwDemo[f.id]);
const FM_RAW = 'https://raw.githubusercontent.com/hanmariyang/giting-skills/main/plugins/flow-menu/components';
const flwNo = i => '①②③④⑤⑥⑦⑧⑨⑩'[i];
const FM_CSS = `.fmgal{--ink:#16161a;--ink2:#6b6c74;--line:#e4e4e8;--acc:#F05032;--bg:#efeeeb;font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:var(--ink)}
.fmgal .ip-rows{max-width:720px;margin:0 auto;text-align:left}
@media(max-width:560px){.fmgal .ip-rows a.r{grid-template-columns:1fr}.fmgal .ip-rows .n{justify-content:flex-start}}
.fmgal .fm-nav{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 20px}.fmgal .fm-nav a{font-size:13px;color:var(--ink2);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:6px 14px;background:#fff}.fmgal .fm-nav a b{color:var(--acc);margin-right:3px}
.fmgal .fm-rules{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 18px;margin:0 0 22px}
.fmgal .fm-rules b{font-size:14px}.fmgal .fm-rules ul{margin:8px 0 0;padding-left:18px;font-size:12.5px;color:var(--ink2);line-height:1.7}
.fmgal .fm-flow{margin:0 0 34px;scroll-margin-top:80px}
.fmgal .fm-flow>h2{font-size:18px;font-weight:800;display:flex;align-items:baseline;gap:9px;margin:0 0 6px;flex-wrap:wrap}
.fmgal .fm-flow>h2 .en{font-family:ui-monospace,monospace;font-size:12px;color:#9a9aa4;font-weight:600}
.fmgal .fm-seen{font-size:12.5px;color:var(--ink2);margin:0 0 12px}
.fmgal .fm-rack{overflow-x:auto;border:1px solid var(--line);border-radius:13px;background:#ededf0;margin:0 0 14px}
.fmgal .fm-rack iframe{display:block;width:2200px;height:1060px;border:0;zoom:.6}
.fmgal .fm-steps{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin:0 0 14px}
.fmgal .fm-s{border:1px solid var(--line);border-radius:13px;background:#fff;padding:13px 15px;display:flex;flex-direction:column;gap:7px;min-width:0}
.fmgal .fm-s h3{margin:0;font-size:15.5px;font-weight:800}.fmgal .fm-s h3 b{color:var(--acc);margin-right:6px}
.fmgal .fm-s .pt{font-size:13px;line-height:1.55}
.fmgal .fm-s ol{margin:0;padding:0;list-style:none;display:grid;gap:3px;font-size:12.5px}
.fmgal .fm-s ol li span{font-family:ui-monospace,monospace;font-size:10.5px;color:#9a9aa4;margin-left:6px}
.fmgal .fm-s .ask{border-top:1px dashed var(--line);padding-top:7px;font-size:12px;color:var(--ink2);line-height:1.55;margin-top:auto}
.fmgal .fm-keep{background:#16161a;color:#fff;border-radius:13px;padding:14px 18px;margin:0 0 14px}
.fmgal .fm-keep b{font-size:13px;color:#ff9a84}.fmgal .fm-keep ul{margin:6px 0 0;padding-left:18px;font-size:13.5px;line-height:1.7}
.fmgal .fm-ask{border:1px solid var(--line);border-radius:13px;background:#fff;padding:13px 15px;display:flex;gap:10px;align-items:flex-start}
.fmgal .fm-ask p{margin:0;font-size:13px;line-height:1.65;flex:1;min-width:0}
.fmgal .copy{flex:none;font-size:11.5px;border:1px solid var(--line);background:#fff;border-radius:7px;padding:3px 10px;cursor:pointer;color:var(--ink2)}
@media(prefers-color-scheme:dark){.fmgal{--ink:#ececea;--ink2:#a9aab0;--line:#2a2a2e;--bg:#1a1a1d}.fmgal .fm-s,.fmgal .fm-nav a,.fmgal .fm-rules,.fmgal .fm-ask,.fmgal .copy{background:#1d1d20}}`;
const flwF = flwMenu.formula;
const flw0 = flwMenu.flows[0];
const flwIntro = ipPanels('flow-menu', '.fmgal', '--ip-acc:var(--acc);--ip-ink:var(--ink);--ip-ink2:var(--ink2);--ip-ink3:var(--ink2);--ip-paper:#fff;--ip-line:var(--line);--ip-wash:var(--bg)', [
  { lay: 'center', bg: 'pale', chip: `흐름 메뉴판 · 흐름 ${flwMenu.flows.length} · 부품 이름은 앱 메뉴판 그대로`, h: `「결제 화면」은 한 장이 아니라<br><em>${flw0.steps.length}장</em>이에요`,
    sub: `${esc(flw0.from)}부터 ${esc(flw0.to)}까지, 고객이 넘기는 화면을 장으로 나누고 <b>장마다 쓰는 부품을 이름으로</b> 적었어요.`,
    body: `<div class="ip-rows">${flw0.steps.map((s, i) => `<a class="r" href="#fl-${flw0.id}"><span class="w"><b style="color:var(--ip-ink)">${flwNo(i)} ${esc(s.ko)}</b></span><span class="n">${s.parts.map(id => `<b>${esc(flwPart(id).name.ko)}</b>`).join('')}</span></a>`).join('')}</div>` },
  { lay: 'stack', bg: 'white', chip: 'AI한테 시키는 공식', h: '장 수와 장 이름을<br><em>먼저</em> 적어요', sub: esc(flwF.note), body: ipFormula(flwF) },
  { lay: 'band', bg: 'dark', chip: 'Claude Code 스킬', h: '「결제 화면 만들어줘」가<br><em>장 계획</em>으로 바뀌어요', sub: '스킬로 깔아 두면 장 수·장 이름·장마다 부품을 먼저 보여 주고, 장을 넘겨도 지킬 규칙을 장마다 대조해요.', body: ipInstall('flow-menu') },
]);
const flwSite = f => flwDemo[f.id];
const flwCore = `<div class="fmgal">
<style>${FM_CSS}</style>
${flwIntro}
<div class="fm-rules"><b>공통 규격</b><ul>${flwMenu.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>
<nav class="fm-nav">${flwMenu.flows.map(f => `<a href="#fl-${f.id}"><b>${esc(f.ko)}</b> ${f.steps.length}장</a>`).join('')}</nav>
${flwMenu.flows.map(f => `<section class="fm-flow" id="fl-${f.id}">
  <h2>${esc(f.ko)} <span class="en">${esc(f.en)}</span> · ${f.steps.length}장</h2>
  <p class="fm-seen">${esc(f.from)} → ${esc(f.to)}. ${esc(f.seen)}</p>
  <div class="fm-rack"><iframe title="${esc(f.ko)} 흐름 견본" loading="lazy" srcdoc="${attr(flwSite(f))}"></iframe></div>
  <div class="fm-steps">${f.steps.map((s, i) => `<article class="fm-s"><h3><b>${flwNo(i)}</b>${esc(s.ko)}</h3><div class="pt">${esc(s.point)}</div>
    <ol>${s.parts.map(id => { const p = flwPart(id); return `<li>${esc(p.name.ko)}<span>${esc(p.name.en)}</span></li>`; }).join('')}</ol><div class="ask">${esc(s.ask)}</div></article>`).join('')}</div>
  <div class="fm-keep"><b>장을 넘겨도 지킬 것</b><ul>${f.keep.map(k => `<li>${esc(k)}</li>`).join('')}</ul></div>
  <div class="fm-ask"><p>${esc(f.ask)}</p><button class="copy" data-copy="${attr(f.ask)}" title="요청문 복사">문장 복사</button></div>
</section>`).join('\n')}
<script>document.querySelectorAll('.fmgal .copy').forEach(function(b){b.addEventListener('click',function(){try{navigator.clipboard.writeText(b.getAttribute('data-copy'));}catch(x){}var t=b.textContent;b.textContent='복사됨';setTimeout(function(){b.textContent=t},1200);});});</script>
</div>
`;
const flwDict = () => `# 흐름 메뉴판 (flow-menu) · Giting Skills

> ${flwMenu.description}
> 공식: ${flwF.pattern}  (✕ "${flwF.bad}" → ○ "${flwF.good}")
> 갤러리: https://giting.kr/skills/flow-menu · repo: https://github.com/hanmariyang/giting-skills (MIT)
> Claude Code: /plugin marketplace add hanmariyang/giting-skills → /plugin install flow-menu@giting
> 부품 이름은 앱 UI 메뉴판(app-menu) 그대로: https://giting.kr/skills/app-menu

## 공통 규격
${flwMenu.rules.map(r => `- ${r}`).join('\n')}

${flwMenu.flows.map(f => `## ${f.ko} (${f.en}) · ${f.steps.length}장
- 별칭: ${f.aliases.map(a => `"${a}"`).join(' · ')}
- 범위: ${f.from} → ${f.to}
- 확인한 곳: ${f.seen}
- 견본: ${FM_RAW}/${f.id}.html

${f.steps.map((s, i) => `### ${flwNo(i)} ${s.ko}
- 요점: ${s.point}
- 부품: ${s.parts.map(id => `${flwPart(id).name.ko} (${id})`).join(' · ')}
- 요청 문장: ${s.ask}`).join('\n\n')}

### 장을 넘겨도 지킬 것
${f.keep.map(k => `- ${k}`).join('\n')}

### 흐름 전체 요청 문장
${f.ask}
`).join('\n')}`;
if (SITE_DIR) {
  const FS2 = join(SITE_DIR, 'flow-menu');
  mkdirSync(FS2, { recursive: true });
  writeFileSync(join(FS2, 'gallery-core.html'), flwCore);
  writeFileSync(join(FS2, 'llms.txt'), flwDict());
  writeFileSync(join(FS2, 'llms-full.txt'), flwDict());
}
mkdirSync(join(ROOT, 'docs', 'flow-menu'), { recursive: true });
writeFileSync(join(ROOT, 'docs', 'flow-menu', 'index.html'), redirect.replace(/giting\.kr\/skills\//g, 'giting.kr/skills/flow-menu'));
writeFileSync(join(ROOT, 'docs', 'flow-menu', 'llms.txt'), flwDict());
console.log(`built flow-menu: flows ${flwMenu.flows.length} · steps ${flwMenu.flows.reduce((n, f) => n + f.steps.length, 0)} · core ${(flwCore.length / 1024).toFixed(0)}KB`);

// ── 모션 메뉴판 (motion-menu) — 08 ──────────────────────────────
// 영상·카메라 모션 사전. 데모는 CSS 로 재현한 움직임(iframe), 원맥락은 AI 영상 생성 프롬프트.
// 강조·전환 항목엔 ⭐(현장 다빈도) 배지. recipes = 샷 단위 조합. 스코프 .mogal.
const MMP = join(ROOT, 'plugins', 'motion-menu');
const moMenu = JSON.parse(readFileSync(join(MMP, 'menu.json'), 'utf8'));
const moBy = id => moMenu.items.filter(i => i.category === id);
const moFrags = {};
for (const fn of readdirSync(join(MMP, 'demos')).filter(f => f.endsWith('.html'))) {
  const src = readFileSync(join(MMP, 'demos', fn), 'utf8');
  const parts = src.split(/<!--\s*@([a-z0-9-]+)([^>]*?)-->/);
  for (let i = 1; i < parts.length; i += 3) {
    if (moFrags[parts[i]]) { console.error(`motion-menu 데모 마커가 두 번 나옴: @${parts[i]} (${fn})`); process.exit(1); }
    moFrags[parts[i]] = { h: Number((parts[i + 1].match(/h=(\d+)/) || [])[1] || 220), body: parts[i + 2].trim() };
  }
}
// 손잡이(knobs) — 값을 바꾸면 요청 문장(askT 의 {키})과 데모가 같이 바뀐다 (2026-10-25). 데모는 tools/knobs 가 낸다.
// MO_FILL 은 빌드 검사와 갤러리 페이지가 같은 함수를 쓴다. {키:ko} 는 한글 수(세 장).
const MO_FILL = "function(t,V,mk){return t.replace(/\\{(\\w+)(:ko|:c)?\\}/g,function(_,k,f){var v=V[k],s=f===':ko'?(['영','한','두','세','네','다섯','여섯','일곱','여덟','아홉','열'][v]||String(v)):f===':c'?String(Math.round(v)).replace(/\\B(?=(\\d{3})+(?!\\d))/g,','):String(Math.round(v*100)/100);return mk?mk(k,s):s;});}";
const moFill = new Function('return ' + MO_FILL)();
for (const it of moMenu.items.filter(i => i.knobs)) {
  const V = Object.fromEntries(it.knobs.map(k => [k.k, k.v])), bad = [];
  if (!it.askT) bad.push('askT 없음');
  for (const k of it.knobs) {
    if (!(k.min <= k.v && k.v <= k.max)) bad.push(`${k.k} 처음 값이 범위 밖`);
    if (!it.askT.includes('{' + k.k)) bad.push(`문장 틀에 {${k.k}} 없음`);
  }
  for (const m of it.askT.matchAll(/\{(\w+)/g)) if (!(m[1] in V)) bad.push(`문장 틀의 {${m[1]}} 에 맞는 손잡이 없음`);
  if (moFill(it.askT, V) !== it.ask) bad.push(`처음 값으로 채운 문장이 ask 와 다름: 「${moFill(it.askT, V)}」`);
  if (bad.length) { console.error(`motion-menu 손잡이 오류 ${it.id}:`, bad.join(' · ')); process.exit(1); }
}
const moMiss = [...moMenu.items, ...moMenu.recipes].filter(it => !moFrags[it.id]).map(it => it.id);
if (moMiss.length) { console.error('motion-menu 데모 없는 항목:', moMiss.join(', ')); process.exit(1); }
const moStandalone = it => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(it.name.ko)} ${esc(it.name.en)} · 모션 메뉴판</title><style>*{box-sizing:border-box}body{margin:0;font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#17171b;font-size:13.5px;background:#fff}.cap{color:#8b93a1;font-size:11.5px;text-align:center;margin:8px 12px 12px;line-height:1.5}</style></head><body>
${moFrags[it.id].body}
<script>document.addEventListener('click',function(e){var a=e.target.closest('a[href="#"]');if(a)e.preventDefault();});</script>
</body></html>`;
const moCode = {};
rmSync(join(MMP, 'components'), { recursive: true, force: true });
mkdirSync(join(MMP, 'components'), { recursive: true });
for (const it of moMenu.items) { moCode[it.id] = moStandalone(it); writeFileSync(join(MMP, 'components', `${it.id}.html`), moCode[it.id]); }
const moRcode = {};
for (const r of moMenu.recipes) { moRcode[r.id] = moStandalone({ id: r.id, name: { ko: r.shot, en: r.combo.join('+') } }); writeFileSync(join(MMP, 'components', `${r.id}.html`), moRcode[r.id]); }
const MO_RAW = 'https://raw.githubusercontent.com/hanmariyang/giting-skills/main/plugins/motion-menu/components';
// 「같은 장면, 말 한 줄 차이」 비교 + 「대본 문장마다 장면 하나」 장면표 (2026-10-14). 갤러리 전용, components/ 에는 안 낸다.
const moCmp = moMenu.compare || { list: [] }, moScn = moMenu.scenes || { list: [] };
const moInt = moMenu.intensity || { demos: [] };
const moExtraMiss = [...moCmp.list, ...moScn.list, ...moInt.demos].filter(x => !moFrags[x.id]).map(x => x.id);
if (moExtraMiss.length) { console.error('motion-menu 비교·장면 데모 없음:', moExtraMiss.join(', ')); process.exit(1); }
const moItemName = id => { const it = moMenu.items.find(i => i.id === id); if (!it) { console.error('motion-menu 없는 항목 참조:', id); process.exit(1); } return it.name; };
const moXcode = {};
for (const c of moCmp.list) { const n = moItemName(c.item); moXcode[c.id] = moStandalone({ id: c.id, name: { ko: n.ko + ' 비교', en: n.en } }); }
for (const sc of moScn.list) { sc.uses.forEach(moItemName); moXcode[sc.id] = moStandalone({ id: sc.id, name: { ko: sc.name, en: 'Scene ' + sc.no } }); }
for (const d of moInt.demos) { const n = moItemName(d.item); moXcode[d.id] = moStandalone({ id: d.id, name: { ko: n.ko + ' 세기', en: n.en } }); }
const MO_CSS = `.mogal{--ink:#17171b;--ink2:#6b6c74;--ink3:#9a9aa4;--line:#e8e6e1;--acc:#C2632B;--acc2:#E07A3F;--paper:#fff;--bg:#faf8f4;font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:var(--ink)}
.mogal .mo-formula{background:var(--paper);border:1px solid var(--line);border-radius:13px;overflow:hidden;margin:0 0 18px}
.mogal .mo-fh{padding:11px 16px;background:var(--bg);font-size:13px;font-weight:700;display:flex;gap:9px;flex-wrap:wrap;align-items:baseline}
.mogal .mo-fh span{font-weight:500;color:var(--ink2);font-family:ui-monospace,monospace;font-size:12px}
.mogal .mo-fx{display:grid;grid-template-columns:1fr 1fr}
@media(max-width:720px){.mogal .mo-fx{grid-template-columns:1fr}}
.mogal .mo-fx>div{padding:12px 16px;font-size:14px}
.mogal .mo-fx .bad{color:var(--ink3);border-right:1px solid var(--line)}
@media(max-width:720px){.mogal .mo-fx .bad{border-right:0;border-bottom:1px solid var(--line)}}
.mogal .mo-fx .mk{display:block;font-size:11px;font-family:ui-monospace,monospace;margin-bottom:3px}
.mogal .bad .mk{color:#C0392B}.mogal .good .mk{color:#17B26A}
.mogal .mo-nav{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 20px}
.mogal .mo-nav a{font-size:12.5px;color:var(--ink2);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:5px 12px;background:var(--paper)}
.mogal .mo-nav a b{color:var(--acc);margin-right:5px}
.mogal .mo-cat{margin:0 0 30px;scroll-margin-top:80px}
.mogal .mo-cat h2{font-size:17px;font-weight:800;display:flex;align-items:center;gap:9px;margin:0 0 6px;padding-bottom:8px;border-bottom:1px solid var(--line)}
.mogal .mo-cat h2 .no{color:var(--acc)}.mogal .mo-cat h2 .count{font-size:12px;color:var(--ink3);font-weight:600}
.mogal .mo-note{font-size:12.5px;color:var(--ink2);margin:0 0 14px}
.mogal .mo-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:860px){.mogal .mo-grid{grid-template-columns:1fr}}
.mogal .mo-card{border:1px solid var(--line);border-radius:13px;overflow:hidden;background:var(--paper);display:flex;flex-direction:column}
.mogal .mo-card header{display:flex;align-items:center;gap:7px;padding:9px 13px;border-bottom:1px solid var(--line)}
.mogal .mo-card header h3{font-size:14.5px;font-weight:700;margin:0}
.mogal .mo-card .star{color:var(--acc2);font-size:12px}
.mogal .mo-card .en{font-family:ui-monospace,monospace;font-size:11px;color:var(--ink3);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mogal .mo-card .copy,.mogal .mo-rcpi .copy{flex:none;border:1px solid var(--line);background:var(--paper);border-radius:7px;padding:3px 10px;font-size:11px;cursor:pointer;color:var(--ink2)}
.mogal .mo-card .copy:hover,.mogal .mo-rcpi .copy:hover{border-color:var(--ink3);color:var(--ink)}
.mogal .mo-card .copy.ok,.mogal .mo-rcpi .copy.ok{border-color:var(--acc2);color:var(--acc)}
.mogal .mo-card iframe{display:block;width:100%;border:0;background:#fff}
.mogal .mo-card footer{padding:9px 13px 11px;border-top:1px solid var(--bg);display:flex;flex-wrap:wrap;gap:4px 9px;align-items:baseline;margin-top:auto}
.mogal .mo-card .al{font-size:12px;color:var(--acc)}
.mogal .mo-card .one{font-size:12px;color:var(--ink2)}
.mogal .mo-card .ask{flex-basis:100%;font-size:11.5px;color:var(--ink2);border-top:1px dashed var(--line);padding-top:6px;margin-top:3px}
.mogal .mo-knobs{display:grid;gap:7px;padding:10px 13px;border-top:1px solid var(--line);background:var(--bg)}
.mogal .mo-knobs .kn{display:grid;grid-template-columns:5.2em minmax(0,1fr) 4.6em;align-items:center;gap:8px;font-size:12px;color:var(--ink2)}
.mogal .mo-knobs input{width:100%;min-width:0;accent-color:var(--acc);margin:0}
.mogal .mo-knobs output{text-align:right;font-variant-numeric:tabular-nums;font-weight:700;color:var(--ink)}
.mogal .mo-knobs .knreset{justify-self:start;border:1px solid var(--line);background:var(--paper);border-radius:7px;padding:3px 10px;font-size:11px;cursor:pointer;color:var(--ink2)}
.mogal .mo-card.has-kn .ask{font-size:13px;color:var(--ink)}
.mogal .mo-card .ask mark{background:color-mix(in srgb,var(--acc2) 18%,transparent);color:inherit;border-radius:4px;padding:0 2px;font-weight:700;transition:background .35s}
.mogal .mo-card .ask mark.on{background:var(--acc2);color:#fff}
.mogal .mo-kntag{flex:none;font-size:9.5px;font-weight:700;color:var(--acc);border:1px solid color-mix(in srgb,var(--acc) 32%,transparent);border-radius:5px;padding:1px 6px}
.mogal .mo-card .ask b{color:var(--ink3);font-weight:600;font-family:ui-monospace,monospace;font-size:10.5px}
.mogal .mo-card .coined{flex:none;font-size:9.5px;font-weight:700;color:#8A6A1F;background:color-mix(in srgb,#C79A3A 14%,transparent);border:1px solid color-mix(in srgb,#C79A3A 32%,transparent);border-radius:5px;padding:1px 6px}
.mogal .mo-card .mks{flex-basis:100%;display:flex;flex-wrap:wrap;gap:5px;align-items:center;font-size:10.5px;color:var(--ink3)}
.mogal .mk{font-family:ui-monospace,monospace;font-size:10px;border-radius:5px;padding:1px 7px;border:1px solid var(--line)}
.mogal .mk-ai{color:#1c6fb0;background:color-mix(in srgb,#2BA8E0 10%,transparent);border-color:color-mix(in srgb,#2BA8E0 28%,transparent)}
.mogal .mk-mg{color:var(--acc);background:color-mix(in srgb,var(--acc) 9%,transparent);border-color:color-mix(in srgb,var(--acc) 26%,transparent)}
.mogal .mk-css{color:#0F766E;background:color-mix(in srgb,#0F766E 9%,transparent);border-color:color-mix(in srgb,#0F766E 26%,transparent)}
.mogal .mo-card .mood{flex-basis:100%;font-size:11px;color:var(--ink2)}
.mogal .mo-card .vs{flex-basis:100%;font-size:11.5px;color:var(--ink3)}
.mogal .mo-rcp{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:720px){.mogal .mo-rcp{grid-template-columns:1fr}}
.mogal .mo-rcpi{border:1px solid var(--line);border-radius:13px;background:var(--paper);overflow:hidden;display:flex;flex-direction:column}
.mogal .mo-rcpi header{display:flex;align-items:center;gap:8px;padding:11px 14px;border-bottom:1px solid var(--line)}
.mogal .mo-rcpi h3{font-size:15px;font-weight:700;margin:0}
.mogal .mo-rcpi .rk{flex:1;min-width:0;font-size:12px;color:var(--ink3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mogal .mo-rcpi iframe{display:block;width:100%;border:0;background:#fff}
.mogal .mo-rcpc{display:flex;flex-wrap:wrap;gap:5px;padding:10px 14px 0}
.mogal .mo-rtag{font-family:ui-monospace,monospace;font-size:11px;color:var(--acc);background:color-mix(in srgb,var(--acc) 8%,transparent);border:1px solid color-mix(in srgb,var(--acc) 22%,transparent);border-radius:6px;padding:2px 8px}
.mogal .mo-rcpsc{margin:9px 14px 12px;font-size:12.5px;color:var(--ink2);line-height:1.55}
.mogal .mo-box{background:var(--paper);border:1px solid var(--line);border-radius:13px;padding:13px 16px;margin:0 0 14px}
.mogal .mo-box h3{font-size:14.5px;margin:0 0 4px;display:flex;align-items:center;gap:8px}
.mogal .mo-box h3 .copy{margin-left:auto}
.mogal .mo-box p{font-size:12.5px;color:var(--ink2);margin:0 0 8px}
.mogal .mo-roles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0 0 8px}
@media(max-width:640px){.mogal .mo-roles{grid-template-columns:1fr}}
.mogal .mo-roles div{border:1px solid var(--line);border-radius:10px;padding:8px 10px;font-size:12.5px}
.mogal .mo-roles b{display:block;font-size:13.5px}.mogal .mo-roles code{font-family:ui-monospace,monospace;color:var(--acc);font-size:12px}
.mogal .mo-ints{overflow-x:auto;margin:0 0 8px}.mogal .mo-ints table{border-collapse:collapse;font-size:12.5px;min-width:520px;width:100%}.mogal .mo-ints th,.mogal .mo-ints td{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left;font-variant-numeric:tabular-nums}.mogal .mo-ints thead th{color:var(--acc);font-size:12px}.mogal .mo-ints td.for{color:var(--ink3);font-size:11.5px}
.mogal .mo-pre{white-space:pre-wrap;font-family:ui-monospace,monospace;font-size:12px;line-height:1.6;background:var(--bg);border-radius:9px;padding:10px 12px;margin:0;overflow-wrap:anywhere}
.mogal .mo-cmp header{flex-wrap:wrap}
.mogal .mo-cmp .say{display:grid;gap:4px;padding:8px 13px 11px;border-top:1px solid var(--line);font-size:12.5px}
.mogal .mo-cmp .say span{color:var(--ink3)}.mogal .mo-cmp .say span::before{content:'✕ ';color:#C0392B}
.mogal .mo-cmp .say strong{font-weight:500;color:var(--ink)}.mogal .mo-cmp .say strong::before{content:'○ ';color:#17B26A}
.mogal .mo-rules{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px;padding:0;list-style:none}
.mogal .mo-rules li{font-size:12px;border:1px solid var(--line);border-radius:999px;padding:3px 10px;background:var(--paper)}
.mogal .mo-scn .when{font-size:12px;color:var(--acc);font-weight:600}
.mogal .mo-scn .uses{font-size:11.5px;color:var(--ink3)}
.mogal .mo-scn .uses a{font-family:ui-monospace,monospace;font-size:11px;color:var(--ink2);margin-right:6px}
@media(prefers-color-scheme:dark){.mogal{--ink:#ececea;--ink2:#a9aab0;--ink3:#80818a;--line:#2b2a2e;--paper:#1d1d20;--bg:#19181b}}`;
const moStar = it => it.star ? '<span class="star" title="현장에서 특히 많이 쓰는 것">★</span>' : '';
const MAKE_LBL = { ai: 'AI 영상', mg: '모션 그래픽', css: 'CSS' };
const moMake = it => (it.make || []).map(k => `<span class="mk mk-${k}">${MAKE_LBL[k] || k}</span>`).join('');
const moCoined = it => it.coined ? '<span class="coined" title="표준 용어가 아닌 애칭/지어낸 이름. 정식명은 영문·구분 참고">애칭</span>' : '';
const moShot = moMenu.recipes.filter(r => r.kind !== 'text'), moTxR = moMenu.recipes.filter(r => r.kind === 'text');
const moKnobs = it => `<div class="mo-knobs" data-def="${attr(JSON.stringify(Object.fromEntries(it.knobs.map(k => [k.k, k.v]))))}">${it.knobs.map(k => `<label class="kn"><span>${esc(k.label)}</span><input type="range" min="${k.min}" max="${k.max}" step="${k.step}" value="${k.v}" data-k="${k.k}" data-unit="${attr(k.unit)}" aria-label="${attr(k.label)}"><output>${k.v}${esc(k.unit === 'BPM' ? ' BPM' : k.unit)}</output></label>`).join('')}<button type="button" class="knreset" hidden>처음 값으로</button></div>`;
const moCard = it => `<article class="mo-card${it.knobs ? ' has-kn' : ''}" id="m-${it.id}">
  <header><h3>${esc(it.name.ko)}</h3>${moStar(it)}${moCoined(it)}${it.knobs ? '<span class="mo-kntag" title="값을 바꾸면 요청 문장도 같이 바뀌어요">손잡이</span>' : ''}<span class="en">${esc(it.name.en)}</span><button class="copy" data-copy="${attr(it.ask)}" title="요청 문장 복사">문장</button></header>
  <iframe title="${esc(it.name.ko)} 데모" loading="lazy" style="height:${moFrags[it.id].h}px" srcdoc="${attr(moCode[it.id])}"></iframe>
  ${it.knobs ? moKnobs(it) : ''}<footer><span class="al">"${esc(it.aliases[0])}"</span><span class="one">${esc(it.oneliner)}</span>${it.vs ? `<span class="vs">↔ ${esc(it.vs)}</span>` : ''}${it.mood ? `<span class="mood">쓰임 ${esc(it.mood)}</span>` : ''}<span class="mks">만드는 법 ${moMake(it)}</span><span class="ask"><b>AI에게 ▸</b> <span class="askt"${it.knobs ? ` data-askt="${attr(it.askT)}"` : ''}>${esc(it.ask)}</span></span></footer>
</article>`;
const moF = moMenu.formula;
const catNote = { 'cam-emphasis': '대부분 촬영 현장 용어예요. ★는 특히 자주 씁니다.', transition: '장면을 넘기고 드러내는 전환·효과. AI 영상·모션 그래픽(HyperFrames 등)에서 많이 씁니다. 애칭 표시는 표준 용어가 아닌 통용 이름이에요.', kinetic: '글자가 주인공인 모션. 숏폼·자기소개 영상의 핵심이에요.', timing: '같은 움직임도 속도 곡선에 따라 완전히 달라 보여요. 초보와 프로의 차이가 여기서 납니다. 「손잡이」 표시가 있는 카드는 값을 바꾸면 데모와 요청 문장이 같이 바뀌어요.', 'screen-transition': '장면 A 를 B 로 넘기는 그래픽 전환 40가지. 1~8 색면이 가로지름 · 9~16 모양이 퍼짐 · 17~24 액체·파문·충격 · 25~32 판이 바뀜 · 33~40 나누고 섞음. 요청 문장은 영어 이름으로 시작하세요.', background: '글자·사람 뒤에 까는 반복 배경 40가지. 1~8 점 · 9~16 격자 · 17~24 선 · 25~32 도형 · 33~40 미니멀. 전부 끊김 없이 이어지는 루프예요. 요청 문장에 반복 주기를 같이 적으세요.', 'text-motion': '글자가 주인공인 연출 40가지. 1~8 한 단어 임팩트 · 9~16 흐르는 글자 · 17~24 깊이 · 25~32 말 바꿔 끼우기 · 33~40 꾸밈. 요청 문장에 들어갈 실제 문구를 같이 적으세요.', 'text-body': '글자 하나하나의 몸이 움직이는 연출 26가지. 1~7 사라지고 모이기 · 8~14 쉬지 않고 흔들리기 · 15~20 물리와 소품 · 21~26 글자 안과 배치. 카드의 분위기 태그로 어디에 쓸지 고르세요.', 'screen-transition-2': '⑦에 없던 기본 전환과 실물 같은 전환 23가지. 1~5 밀고 덮기 · 6~9 빛과 어둠 · 10~13 돌고 빨려 들기 · 14~18 입체로 넘기기 · 19~23 물건처럼 부서지기. 푸시·딥 투 블랙처럼 제일 자주 쓰는 전환이 여기 있어요.', 'data-motion': '숫자와 차트가 움직이는 연출 26가지. 1~6 숫자 하나를 세우기 · 7~12 막대로 비교 · 13~19 선으로 흐름 · 20~26 비율 나누기. 요청 문장에 실제 값과 초를 같이 적으세요.', 'icon-motion': '로고·아이콘이 움직이는 작은 연출 24가지. 1~6 그려지며 나타나기 · 7~12 튀어 오르기 · 13~18 눌렀을 때 반응 · 19~24 쉬지 않고 반복. 요청 문장에 초와 크기 비율을 같이 적으세요.', 'social-overlay': '영상 위에 얹는 SNS 화면 요소 25가지. 1~6 구독과 팔로우 · 7~12 말풍선과 댓글 · 13~19 알림과 표시 · 20~25 화면 위에 짚어 주기. 요청 문장에 들어갈 실제 글자와 초를 같이 적으세요.', 'graphic-craft': '모션 그래픽을 만들 때 쓰는 기법 24가지. 1~6 길 따라 움직이기 · 7~12 복제와 선 · 13~18 장면 바꾸기 · 19~24 구조 보여 주기. 요청 문장에 초와 개수를 같이 적으세요.', 'background-2': '⑧에 없던 배경 9가지. 1~6 흐르고 번지기(유체 그라디언트 · 흐름장 · 반응-확산 · 등고선 · 연결망 · 조리개) · 7~9 멀리까지 펼쳐지기(점 바다 · 와이어프레임 지형 · 구름). ⑧보다 결이 깊어서 글자를 올릴 땐 어둡게 눌러 쓰세요.', 'number-motion': '쇼핑·게임·계기판에서 숫자가 움직이는 장면 16가지. 1~4 쇼핑 · 5~10 게임 · 11~16 계기. 전부 손잡이가 붙어 있어서 금액·개수를 바꾸면 데모와 요청 문장이 같이 바뀌어요.', 'opening-title': '영상·발표·랜딩의 첫 제목이 등장하는 완성 장면 24가지. 1~6 기계가 읽고 띄우기 · 7~12 영화처럼 열기 · 13~18 손으로 붙이고 뿌리기 · 19~24 부딪치고 맞추기. 요청 문장에 들어갈 제목과 서는 초를 같이 적으세요.', 'diagram-motion': '발표·설명 영상에서 도식이 그려지는 장면 24가지. 1~6 순서대로 흐르기 · 7~12 짜임 보여 주기 · 13~18 나란히 견주기 · 19~24 한 곳 짚어 말하기. 대괄호 자리에 실제 단계·이름을 넣어 시키세요.' };
// 상세페이지 결 인트로(2026-10-23, 의뢰자 「이 형식으로」 — @sequence_ai 상세페이지 참고). 판 다섯: 소개 · 말 한 줄 차이 · 공식 · 이런 말엔 이런 장면 · 처음 요청문.
// 실물은 사전의 데모를 그대로 iframe 으로 쓴다(따로 그리지 않는다). 아래 사전 섹션과 같은 id 로 이어진다.
const MO_HERO = ['scan-reveal', 'word-burst', 'odometer-roll'];
const moItem = id => { const it = moMenu.items.find(i => i.id === id); if (!it) { console.error('motion-menu 인트로가 없는 항목을 가리킴:', id); process.exit(1); } return it; };
const moCatNo = it => (moMenu.categories.find(c => c.id === it.category) || {}).no || '';
const moFig = (id, src) => { const it = moItem(id); return `<figure><iframe title="${esc(it.name.ko)} 데모" loading="lazy" style="height:${moFrags[id].h}px" srcdoc="${attr(src || moCode[id])}"></iframe><figcaption><b>${moCatNo(it)}</b>${esc(it.name.ko)}</figcaption></figure>`; };
const moBub = (text, cls = '', mark = '') => `<div class="mo-bub ${cls}">${mark ? `<span class="mk2">${mark}</span>` : ''}<p>${esc(text)}</p>${cls === 'plain' ? '' : `<button class="copy" data-copy="${attr(text)}" title="문장 복사">복사</button>`}</div>`;
const moCmp0 = moCmp.list[0];
const moIntro = ipPanels('motion-menu', '.mogal', '--ip-acc:var(--acc);--ip-ink:var(--ink);--ip-ink2:var(--ink2);--ip-ink3:var(--ink3);--ip-paper:var(--paper);--ip-line:var(--line);--ip-wash:var(--bg)', [
  { lay: 'center', bg: 'pale', chip: `모션 메뉴판 · ${moMenu.items.length}가지`, h: '움직임은 <em>이름</em>으로 시키면<br>한 번에 <i>통해요</i>',
    sub: '「멋지게 해줘」는 매번 다르게 나와요.<br><b>이름과 초를 붙여서</b> 말하면 AI 영상 · 모션 그래픽 · CSS 어디서든 같은 움직임이 나와요.',
    body: `<div class="ip-three">${MO_HERO.map(id => moFig(id)).join('')}</div>${ipBub(moItem(MO_HERO[0]).ask)}<p class="ip-foot">카드마다 「문장」을 누르면 이 요청문이 복사돼요.</p>` },
  moCmp0 && { lay: 'split', bg: 'white', chip: '말 한 줄 차이', h: '같은 장면인데<br><em>말 한 줄</em>이 움직임을 바꿔요', sub: '위는 느낌으로 시킨 결과, 아래는 <b>이름과 숫자로</b> 시킨 결과예요.',
    body: `${ipBub(moCmp0.plain, 'plain', '✕')}${ipBub(moCmp0.named, '', '○')}<p class="ip-foot"><a href="#mc-compare">비교 ${moCmp.list.length}가지 전부 보기 ↓</a></p>`,
    aside: `<figure><iframe title="${esc(moItemName(moCmp0.item).ko)} 비교 데모" loading="lazy" style="height:${moFrags[moCmp0.id].h}px" srcdoc="${attr(moXcode[moCmp0.id])}"></iframe><figcaption>${esc(moItemName(moCmp0.item).ko)}</figcaption></figure>` },
  { lay: 'stack', bg: 'pale', chip: '시키는 공식', h: '이 순서로만 말하면<br><em>고칠 일</em>이 줄어요', sub: esc(moF.note), body: ipFormula(moF) },
  moScn.list.length && { lay: 'wide', bg: 'white', chip: '장면표', h: '이런 말엔<br><em>이런 장면</em>을 골라요', sub: '짧은 정보 영상은 <b>대본 문장마다 장면 하나</b>. 같은 장면을 연달아 쓰지 않아요.',
    body: `<div class="ip-rows">${moScn.list.map(sc => `<a class="r" href="#m-${sc.id}"><span class="w">${sc.no}. ${esc(sc.name)} · ${esc(sc.when)}</span><span class="n">${sc.uses.map(u => `<b>${esc(moItemName(u).ko)}</b>`).join('')}</span></a>`).join('')}</div>` },
  { lay: 'band', bg: 'dark', chip: '처음 한 번', h: '이 요청문 하나로<br><em>시작</em>하세요', sub: esc(moMenu.starter ? moMenu.starter.note : ''),
    body: `${moMenu.starter ? ipBub(moMenu.starter.ask) : ''}${ipInstall('motion-menu')}` },
]);
const moCore = `<div class="mogal">
<style>${MO_CSS}</style>
${moIntro}
<nav class="mo-nav">${moMenu.categories.map(c => `<a href="#mc-${c.id}"><b>${c.no}</b>${esc(c.ko)} ${moBy(c.id).length}</a>`).join('')}<a href="#mc-recipes"><b>＋</b>조합 레시피 ${moShot.length}</a>${moTxR.length ? `<a href="#mc-text-recipes"><b>＋</b>글자 조합 ${moTxR.length}</a>` : ''}${moCmp.list.length ? `<a href="#mc-compare"><b>⇅</b>말 한 줄 차이 ${moCmp.list.length}</a>` : ''}${moScn.list.length ? `<a href="#mc-scenes"><b>▦</b>장면표 ${moScn.list.length}</a>` : ''}${moInt.knobs ? `<a href="#mc-intensity"><b>◐</b>세기 셋</a>` : ''}</nav>
${moMenu.easingRoles ? `<div class="mo-box"><h3>${esc(moMenu.easingRoles.title)}<button class="copy" data-copy="${attr(moMenu.easingRoles.ask)}" title="요청 문장 복사">문장</button></h3>
  <p>${esc(moMenu.easingRoles.note)}</p>
  <div class="mo-roles">${moMenu.easingRoles.roles.map(r => `<div><b>${esc(r.use)}</b><code>${esc(r.curve)}</code><br>${esc(r.feel)}</div>`).join('')}</div>
  <p>${esc(moMenu.easingRoles.avoid)} ${esc(moMenu.easingRoles.tip)}</p></div>` : ''}
${moInt.knobs ? `<div class="mo-box" id="mc-intensity"><h3>${esc(moInt.title)}<button class="copy" data-copy="${attr(moInt.ask)}" title="요청 문장 복사">문장</button></h3>
  <p>${esc(moInt.note)}</p>
  <div class="mo-ints"><table><thead><tr><th></th>${moInt.levels.map(l => `<th>${esc(l)}</th>`).join('')}<th>쓰는 곳</th></tr></thead><tbody>${moInt.knobs.map(kn => `<tr><th>${esc(kn.what)}</th>${kn.values.map(v => `<td>${esc(v)}</td>`).join('')}<td class="for">${esc(kn.for)}</td></tr>`).join('')}</tbody></table></div>
  <p>${esc(moInt.rule)}</p>
  <div class="mo-grid">${moInt.demos.map(d => { const n = moItemName(d.item); return `<article class="mo-card" id="m-${d.id}"><header><h3>${esc(n.ko)} 세기</h3><span class="en">${esc(n.en)}</span></header><iframe title="${esc(n.ko)} 세기 비교 데모" loading="lazy" style="height:${moFrags[d.id].h}px" srcdoc="${attr(moXcode[d.id])}"></iframe><footer><a href="#m-${d.item}" style="font-size:11.5px;color:var(--ink3)">사전에서 보기 ↓</a></footer></article>`; }).join('')}</div></div>` : ''}
${moCmp.list.length ? `<section class="mo-cat" id="mc-compare">
  <h2><span class="no">⇅</span> ${esc(moCmp.title)} <span class="count">${moCmp.list.length}</span></h2>
  <p class="mo-note">${esc(moCmp.note)}</p>
  <div class="mo-grid">${moCmp.list.map(c => { const n = moItemName(c.item); return `<article class="mo-card mo-cmp" id="m-${c.id}">
    <header><h3>${esc(n.ko)}</h3><span class="en">${esc(n.en)}</span><button class="copy" data-copy="${attr(c.named)}" title="이름으로 시키는 문장 복사">문장</button></header>
    <iframe title="${esc(n.ko)} 비교 데모" loading="lazy" style="height:${moFrags[c.id].h}px" srcdoc="${attr(moXcode[c.id])}"></iframe>
    <div class="say"><span>${esc(c.plain)}</span><strong>${esc(c.named)}</strong><a href="#m-${c.item}" style="font-size:11.5px;color:var(--ink3)">사전에서 보기 ↓</a></div>
  </article>`; }).join('\n')}</div>
</section>` : ''}
${moMenu.categories.map(cat => `<section class="mo-cat" id="mc-${cat.id}">
  <h2><span class="no">${cat.no}</span> ${esc(cat.ko)} <span class="count">${moBy(cat.id).length}</span></h2>
  ${catNote[cat.id] ? `<p class="mo-note">${catNote[cat.id]}</p>` : ''}
  <div class="mo-grid">${moBy(cat.id).map(moCard).join('\n')}</div>
</section>`).join('\n')}
<section class="mo-cat" id="mc-recipes">
  <h2><span class="no">＋</span> 조합 레시피 <span class="count">${moShot.length} · 샷 단위</span></h2>
  <p class="mo-note">낱개 모션을 아는 다음 단계, 흔한 샷이 어떤 조합으로 만들어지는지.</p>
  <div class="mo-rcp">${moShot.map(r => `<article class="mo-rcpi" id="m-${r.id}">
    <header><h3>${esc(r.shot)}</h3><span class="rk">${esc(r.ko)}</span><button class="copy" data-copy="${attr(r.ask)}" title="요청 문장 복사">문장</button></header>
    <iframe title="${esc(r.shot)} 조합 데모" loading="lazy" style="height:${moFrags[r.id].h}px" srcdoc="${attr(moRcode[r.id])}"></iframe>
    <div class="mo-rcpc">${r.combo.map(c => `<span class="mo-rtag">${esc(c)}</span>`).join('')}</div>
    <p class="mo-rcpsc">${esc(r.sc)}</p>
  </article>`).join('\n')}</div>
</section>
${moTxR.length ? `<section class="mo-cat" id="mc-text-recipes">
  <h2><span class="no">＋</span> 글자 조합 레시피 <span class="count">${moTxR.length}</span></h2>
  <p class="mo-note">이미 있는 글자 연출에 타이밍·효과를 하나 더 얹은 것. 새 이름을 외우지 말고 아는 이름 둘셋을 섞어서 시키세요.</p>
  <div class="mo-rcp">${moTxR.map(r => `<article class="mo-rcpi" id="m-${r.id}">
    <header><h3>${esc(r.shot)}</h3><span class="rk">${esc(r.ko)}</span><button class="copy" data-copy="${attr(r.ask)}" title="요청 문장 복사">문장</button></header>
    <iframe title="${esc(r.shot)} 조합 데모" loading="lazy" style="height:${moFrags[r.id].h}px" srcdoc="${attr(moRcode[r.id])}"></iframe>
    <div class="mo-rcpc">${r.combo.map(c => `<span class="mo-rtag">${esc(c)}</span>`).join('')}</div>
    <p class="mo-rcpsc">${esc(r.sc)}</p>
  </article>`).join('\n')}</div>
</section>
` : ''}
${moScn.list.length ? `<section class="mo-cat" id="mc-scenes">
  <h2><span class="no">▦</span> ${esc(moScn.title)} <span class="count">${moScn.list.length}</span></h2>
  <p class="mo-note">${esc(moScn.note)}</p>
  <ul class="mo-rules">${moScn.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
  <div class="mo-grid">${moScn.list.map(sc => `<article class="mo-card mo-scn" id="m-${sc.id}">
    <header><h3>${sc.no}. ${esc(sc.name)}</h3><span class="en"></span></header>
    <iframe title="${esc(sc.name)} 장면 데모" loading="lazy" style="height:${moFrags[sc.id].h}px" srcdoc="${attr(moXcode[sc.id])}"></iframe>
    <footer><span class="when">${esc(sc.when)}</span><span class="one">${esc(sc.does)}</span><span class="uses">만드는 항목 ${sc.uses.map(u => `<a href="#m-${u}">${esc(moItemName(u).ko)}</a>`).join('')}</span></footer>
  </article>`).join('\n')}</div>
  <div class="mo-box" style="margin-top:14px"><h3>대본을 장면표로 바꾸는 요청문<button class="copy" data-copy="${attr(moScn.ask)}" title="요청문 복사">복사</button></h3>
    <p>대본을 붙이고 이 문장을 같이 보내면 문장마다 어떤 장면을 넣을지 표로 나옵니다.</p><pre class="mo-pre">${esc(moScn.ask)}</pre></div>
</section>` : ''}
<script>(function(){var g=document.querySelector('.mogal');if(!g)return;
var fill=${MO_FILL};
function knState(card){var V={};card.querySelectorAll('.mo-knobs input').forEach(function(i){V[i.dataset.k]=+i.value;});return V;}
function knApply(card,changed){var V=knState(card),box=card.querySelector('.mo-knobs'),at=card.querySelector('.askt'),def=JSON.parse(box.dataset.def),same=true;
  box.querySelectorAll('input').forEach(function(i){var u=i.dataset.unit;i.nextElementSibling.textContent=fill('{'+i.dataset.k+(+i.value>=1000?':c':'')+'}',V)+(u==='BPM'?' BPM':u);if(+i.value!==def[i.dataset.k])same=false;});
  var txt=fill(at.dataset.askt,V);at.innerHTML='';at.dataset.txt=txt;
  var ks=[];fill(at.dataset.askt,V,function(k,s){ks.push(k);return s;});fill(at.dataset.askt,V,function(k,s){return '\\u0001'+s+'\\u0001';}).split('\\u0001').forEach(function(seg,i){if(i%2){var m=document.createElement('mark');m.textContent=seg;at.appendChild(m);}else at.appendChild(document.createTextNode(seg));});
  if(changed!=null){var ix=ks.indexOf(changed),mk=at.querySelectorAll('mark')[ix];if(mk){mk.classList.add('on');setTimeout(function(){mk.classList.remove('on');},400);}}
  card.querySelector('header .copy').setAttribute('data-copy',txt);box.querySelector('.knreset').hidden=same;
  var f=card.querySelector('iframe');try{f.contentWindow.postMessage({mok:V},'*');}catch(x){}}
g.querySelectorAll('.mo-card.has-kn').forEach(function(card){var f=card.querySelector('iframe');f.addEventListener('load',function(){if(card.dataset.touched)knApply(card);});});
g.addEventListener('input',function(e){var i=e.target.closest('.mo-knobs input');if(!i)return;var card=i.closest('.mo-card');card.dataset.touched='1';knApply(card,i.dataset.k);});
g.addEventListener('click',function(e){var r=e.target.closest('.knreset');if(!r)return;var card=r.closest('.mo-card'),def=JSON.parse(card.querySelector('.mo-knobs').dataset.def);card.querySelectorAll('.mo-knobs input').forEach(function(i){i.value=def[i.dataset.k];});knApply(card);});
g.addEventListener('click',function(e){var b=e.target.closest('.copy');if(!b)return;try{navigator.clipboard.writeText(b.getAttribute('data-copy'));}catch(x){}var o=b.textContent;b.textContent='복사됨';b.classList.add('ok');setTimeout(function(){b.textContent=o;b.classList.remove('ok');},1100);});})();</script>
</div>
`;
const moDict = full => `# 모션 메뉴판 (motion-menu) · Giting Skills

> '역동적으로 해줘' 대신 이름으로 시키는 영상·카메라 모션 사전. 별칭(사람이 실제로 하는 말) → 정식 명칭(한글·영어) → 바로 쓰는 요청 문장 → 움직이는 실물 데모. 5개 코스 ${moMenu.items.length}개 항목.
> 각 항목엔 '만드는 법'이 붙습니다. AI 영상(Runway·Kling·Sora 등 프롬프트) · 모션 그래픽(HyperFrames·After Effects 등 코드/키프레임) · CSS(웹에서 직접). 데모는 그 움직임을 브라우저에서 CSS 로 재현한 참고용.
> 애칭 표시 = 표준 용어가 아닌 통용 이름. 정식명은 각 항목 영어·구분을 따르세요.
> 공식: ${moF.pattern}  (✕ "${moF.bad}" → ○ "${moF.good}")
> 갤러리: https://giting.kr/skills/motion-menu · repo: https://github.com/hanmariyang/giting-skills (MIT)
> Claude Code: /plugin marketplace add hanmariyang/giting-skills → /plugin install motion-menu@giting

${moMenu.categories.map(cat => `## ${cat.no} ${cat.ko}
${catNote[cat.id] ? `${catNote[cat.id]}\n` : ''}
${moBy(cat.id).map(it => `### ${it.name.ko} (${it.name.en})${it.star ? ' ★' : ''}${it.coined ? ' [애칭]' : ''}
- 별칭: ${it.aliases.map(a => `"${a}"`).join(' · ')}
- 정의: ${it.oneliner}${it.vs ? `
- 구분: ${it.vs}` : ''}
${it.mood ? `- 쓰임: ${it.mood}
` : ''}- 만드는 법: ${(it.make || []).map(k => MAKE_LBL[k] || k).join(' · ')}
- 요청 문장: ${it.ask}${it.knobs ? `
- 손잡이(바꿔 쓰는 값): ${it.knobs.map(k => `${k.label} ${k.min}~${k.max}${k.unit === 'BPM' ? ' BPM' : k.unit}`).join(' · ')} · 문장 틀 「${it.askT}」` : ''}
- 데모: ${MO_RAW}/${it.id}.html${full ? `

\`\`\`html
${moCode[it.id].trim()}
\`\`\`` : ''}
`).join('\n')}`).join('\n')}
${moMenu.easingRoles ? `## ${moMenu.easingRoles.title}
${moMenu.easingRoles.note}
${moMenu.easingRoles.roles.map(r => `- ${r.use}: ${r.curve} (${r.feel})`).join('\n')}
- ${moMenu.easingRoles.avoid}
- ${moMenu.easingRoles.tip}
- 요청 문장: ${moMenu.easingRoles.ask}

` : ''}${moInt.knobs ? `## ${moInt.title}
${moInt.note}
${moInt.knobs.map(kn => `- ${kn.what}: ${moInt.levels.map((l, i) => `${l} ${kn.values[i]}`).join(' / ')} (${kn.for})`).join('\n')}
- ${moInt.rule}
- 요청 문장: ${moInt.ask}

` : ''}${moMenu.starter ? `## ${moMenu.starter.title}
${moMenu.starter.note}

\`\`\`text
${moMenu.starter.ask}
\`\`\`

` : ''}${moCmp.list.length ? `## ${moCmp.title}
${moCmp.note}
${moCmp.list.map(c => `- ${moItemName(c.item).ko}: ✕ "${c.plain}" → ○ "${c.named}"`).join('\n')}

` : ''}${moScn.list.length ? `## ${moScn.title}
${moScn.note}
규칙: ${moScn.rules.join(' · ')}
${moScn.list.map(sc => `- ${sc.no}. ${sc.name} (${sc.when}): ${sc.does} (만드는 항목: ${sc.uses.map(u => moItemName(u).ko).join(', ')})`).join('\n')}

\`\`\`text
${moScn.ask}
\`\`\`

` : ''}## ＋ 조합 레시피 (샷 단위 · 글자 조합)

${moMenu.recipes.map(r => `### ${r.shot} · ${r.ko}
- 조합: ${r.combo.join(' + ')}
- 설명: ${r.sc}
- 요청 문장: ${r.ask}`).join('\n\n')}`;
if (SITE_DIR) {
  const MS = join(SITE_DIR, 'motion-menu');
  mkdirSync(MS, { recursive: true });
  writeFileSync(join(MS, 'gallery-core.html'), moCore);
  writeFileSync(join(MS, 'llms.txt'), moDict(false));
  writeFileSync(join(MS, 'llms-full.txt'), moDict(true));
}
mkdirSync(join(ROOT, 'docs', 'motion-menu'), { recursive: true });
writeFileSync(join(ROOT, 'docs', 'motion-menu', 'index.html'), redirect.replace(/giting\.kr\/skills\//g, 'giting.kr/skills/motion-menu'));
writeFileSync(join(ROOT, 'docs', 'motion-menu', 'llms.txt'), moDict(false));
console.log(`built motion-menu: items ${moMenu.items.length} · recipes ${moMenu.recipes.length} · core ${(moCore.length / 1024).toFixed(0)}KB`);

// ── 메뉴판 스토어용 내보내기 (giting.kr/menu) ─────────────────────────────
// 여덟 사전의 항목을 한 모양으로 모아 menu-index.json 하나로, 실물 데모가 있는 항목은
// skills/c/<사전>/<id>.html 로 낸다. giting 사이트 빌드가 이걸 읽어 스토어 · 상세 · 영상 묶음 페이지를 만든다.
// ui-menu 데모에는 자동 시연기를 붙여 낸다(상세 페이지가 play 를 보낸다).
if (SITE_DIR) {
  const MENUS = [
    ['ui-menu', 'UI 메뉴판', menu, PLUGIN],
    ['motion-menu', '모션 메뉴판', moMenu, MMP],
    ['app-menu', '앱 UI 메뉴판', amenu, AP],
    ['css-menu', 'CSS 증상 사전', cmenu, CP],
    ['landing-menu', '랜딩 메뉴판', lmMenu, LMP],
    ['font-menu', '웹폰트 사전', fmenu, FP],
    ['type-menu', '타입스크립트 에러 사전', tmenu, TP],
    ['codelazy', '안 만들어도 되는 것 사전', lmenu, LP],
    ['carousel-menu', '캐러셀 메뉴판', cmMenu, CMP],
    ['thumb-menu', '썸네일 메뉴판', tmMenu, TMP],
    ['grid-menu', '그리드 메뉴판', gmMenu, GMP],
  ];
  const OUT = join(SITE_DIR, 'c');
  rmSync(OUT, { recursive: true, force: true });
  const index = { built: new Date().toISOString().slice(0, 10), menus: [], items: [] };
  for (const [slug, title, m, dir] of MENUS) {
    const cats = Object.fromEntries((m.categories || []).map((c) => [c.id, c.ko || c.title || c.id]));
    index.menus.push({ slug, title, cats: (m.categories || []).map((c) => ({ id: c.id, ko: cats[c.id], no: c.no || '' })) });
    const compDir = join(dir, 'components');
    const have = new Set((() => { try { return readdirSync(compDir).map((f) => f.replace(/\.html$/, '')); } catch { return []; } })());
    if (have.size) mkdirSync(join(OUT, slug), { recursive: true });
    for (const it of m.items) {
      const nm = it.name;
      const ko = typeof nm === 'string' ? nm : nm?.ko || it.family || it.id;
      const en = typeof nm === 'object' ? (nm.en || nm.dx || '') : (it.code || '');
      const ask = it.ask || (it.family ? `「${it.family}」 글꼴을 ${it.role} 자리에 써줘. ${it.source} 에서 불러오고, 대체 글꼴까지 ${it.css} 로.` : '');
      const demo = have.has(it.id);
      if (demo) {
        const src = slug === 'ui-menu' && code[it.id] ? demoDoc(it.id, code[it.id]) : slug === 'thumb-menu' ? tmSite[it.id] : slug === 'grid-menu' ? gmSite[it.id] : readFileSync(join(compDir, `${it.id}.html`), 'utf8');
        writeFileSync(join(OUT, slug, `${it.id}.html`), src);
      }
      const row = { m: slug, id: it.id, c: it.category, g: it.group || '', ko, en, al: (it.aliases || (it.vibe ? [it.vibe] : [])).slice(0, 4),
        one: it.oneliner || it.rx || it.vibe || '', ask, demo };
      for (const k of ['mood', 'vs', 'touch', 'native', 'rx', 'check', 'err', 'before', 'after', 'use', 'whenNot', 'pairsWith', 'load', 'css']) if (it[k]) row[k] = it[k];
      if (it.culprit || it.culprits) row.why = it.culprit ? [it.culprit] : it.culprits;
      if (it.license?.blurb) row.lic = `${it.license.name} · ${it.license.blurb}`;
      index.items.push(row);
    }
    if (slug === 'font-menu' && fPairs.length) {
      index.menus[index.menus.length - 1].cats.push({ id: 'pairs', ko: '짝', no: String(m.categories.length + 1).padStart(2, '0') });
      for (const p of fPairs) {
        const t = fById[p.title.font], u = fById[p.sub.font];
        const g = fPairGroups.find(x => x.id === p.group);
        index.items.push({ m: slug, id: p.id, c: 'pairs', g: g.ko, ko: `${t.family} + ${u.family}`, en: `${p.title.weight} / ${p.sub.weight}`,
          al: [g.ko, p.head], one: p.rule, ask: p.ask, demo: false, pairsWith: `제목 ${t.family} ${p.title.weight} + 보조 ${u.family} ${p.sub.weight}. ${fmenu.pairRule}.` });
      }
    }
  }
  writeFileSync(join(SITE_DIR, 'menu-index.json'), JSON.stringify(index));
  console.log(`built menu-index: ${index.items.length} items · demos ${index.items.filter((x) => x.demo).length}`);
}
