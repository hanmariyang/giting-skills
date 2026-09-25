#!/usr/bin/env node
// landing-menu 빌더 (의존성 0). demos/*.html(<!-- @id h=NNN [full] --> 구분) + menu.json → components/<id>.html
// 마켓 설치본에 필요하므로 components/ 는 커밋한다. giting.kr 갤러리 통합은 루트 build.mjs 후속.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN = dirname(fileURLToPath(import.meta.url));
const menu = JSON.parse(readFileSync(join(PLUGIN, 'menu.json'), 'utf8'));

const frags = {};
for (const f of readdirSync(join(PLUGIN, 'demos')).filter(f => f.endsWith('.html'))) {
  const src = readFileSync(join(PLUGIN, 'demos', f), 'utf8');
  const parts = src.split(/<!--\s*@([a-z0-9-]+)([^>]*?)-->/);
  for (let i = 1; i < parts.length; i += 3) {
    const id = parts[i], opts = parts[i + 1], body = parts[i + 2].trim();
    frags[id] = { h: Number((opts.match(/h=(\d+)/) || [])[1] || 360), full: /\bfull\b/.test(opts), body };
  }
}
const missing = menu.items.filter(it => !frags[it.id]).map(it => it.id);
if (missing.length) { console.error('데모 없는 항목:', missing.join(', ')); process.exit(1); }

const BASE = `  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: #17171b; font-size: 13.5px; background: #fff; }`;

const standalone = it => `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${it.name.ko} ${it.name.en} — 랜딩 메뉴판</title>
<style>
${BASE}
</style>
</head>
<body>
${frags[it.id].body}
<script>
document.addEventListener('click', function (e) { var a = e.target.closest('a[href="#"]'); if (a) e.preventDefault(); });
</script>
</body>
</html>
`;

rmSync(join(PLUGIN, 'components'), { recursive: true, force: true });
mkdirSync(join(PLUGIN, 'components'), { recursive: true });
for (const it of menu.items) writeFileSync(join(PLUGIN, 'components', `${it.id}.html`), standalone(it));
console.log(`landing-menu: components ${menu.items.length}종 생성 (${menu.items.map(i => i.id).join(', ')})`);
