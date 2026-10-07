#!/usr/bin/env node
// 모든 SKILL.md 에 공통 조각을 맞춰 넣는다. 정본은 shared/ 하나다.
//
//   node sync-shared.mjs          # 맞춰 쓴다
//   node sync-shared.mjs --check  # 어긋난 곳이 있으면 이름을 대고 끝 코드 1
//
// 넣는 것 셋
//   ① 공통 규칙   shared/rules.md          → 모든 스킬, 첫 제목(#) 바로 아래
//   ② 사용하는 도구 shared/tools/<이름>.md  → 그 파일이 있는 스킬만, 공통 규칙 바로 아래
//   ③ 스킬 목록   shared/router.json + marketplace.json → skill-router 스킬 안
//
// 표시(<!-- giting:… -->) 사이는 이 스크립트가 덮어쓴다. SKILL.md 에서 직접 고치지 않는다.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ⚠️ URL.pathname 은 공백을 %20 으로 남긴다(워크스페이스 이름에 공백이 있다)
const ROOT = dirname(fileURLToPath(import.meta.url));
const CHECK = process.argv.includes('--check');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const NOTE = '정본 shared/ · node sync-shared.mjs 가 맞춘다. 여기서 고치지 않는다';
const block = (tag, body) => `<!-- giting:${tag} · ${NOTE} -->\n${body.trim()}\n<!-- /giting:${tag} -->`;

// 표시가 이미 있으면 그 자리를 바꾸고, 없으면 anchor 뒤에 끼운다
function place(text, tag, body, afterTag) {
  const re = new RegExp(`<!-- giting:${tag} [^]*?<!-- /giting:${tag} -->`);
  const b = block(tag, body);
  if (re.test(text)) return text.replace(re, b);
  if (afterTag) {
    const end = `<!-- /giting:${afterTag} -->`;
    const i = text.indexOf(end);
    if (i >= 0) return text.slice(0, i + end.length) + '\n\n' + b + text.slice(i + end.length);
  }
  // 첫 제목(#) 줄 바로 아래. 제목이 없으면 머리말(---) 바로 아래
  const lines = text.split('\n');
  let at = lines.findIndex((l) => /^# /.test(l));
  if (at < 0) {
    const fm = lines.indexOf('---', 1);
    at = fm >= 0 ? fm : -1;
  }
  lines.splice(at + 1, 0, '', b);
  return lines.join('\n');
}

function remove(text, tag) {
  return text.replace(new RegExp(`\\n*<!-- giting:${tag} [^]*?<!-- /giting:${tag} -->`), '');
}

// ③ 스킬 목록: marketplace 에 있는 플러그인이 router.json 에 하나라도 빠지면 멈춘다
const market = JSON.parse(read('.claude-plugin/marketplace.json'));
const router = JSON.parse(read('shared/router.json'));
const names = market.plugins.map((p) => p.name).filter((n) => n !== 'skill-router');
const missing = names.filter((n) => !router[n]);
const extra = Object.keys(router).filter((n) => !names.includes(n));
if (missing.length || extra.length) {
  console.error(`shared/router.json 이 마켓과 다르다. 빠짐: ${missing.join(', ') || '없음'} · 남음: ${extra.join(', ') || '없음'}`);
  process.exit(1);
}
const groups = [];
for (const n of names) {
  const g = router[n].group;
  if (!groups.includes(g)) groups.push(g);
}
const catalog = groups.map((g) => {
  const rows = names.filter((n) => router[n].group === g).map((n) =>
    `| \`${n}\` | ${router[n].says.map((s) => `「${s}」`).join(' ')} | ${router[n].gives} |`);
  return `### ${g}\n\n| 스킬 | 이럴 때 | 주는 것 |\n|---|---|---|\n${rows.join('\n')}`;
}).join('\n\n');

const rules = read('shared/rules.md');
const drift = [];
for (const plugin of readdirSync(join(ROOT, 'plugins'))) {
  const dir = join(ROOT, 'plugins', plugin, 'skills');
  if (!existsSync(dir)) continue;
  for (const skill of readdirSync(dir)) {
    const rel = join('plugins', plugin, 'skills', skill, 'SKILL.md');
    if (!existsSync(join(ROOT, rel))) continue;
    const before = read(rel);
    let after = place(before, 'rules', rules);
    const tools = join('shared', 'tools', `${skill}.md`);
    after = existsSync(join(ROOT, tools))
      ? place(after, 'tools', `**사용하는 도구**\n\n${read(tools)}`, 'rules')
      : remove(after, 'tools');
    if (skill === 'skill-router') after = place(after, 'catalog', catalog, 'tools');
    if (after !== before) {
      drift.push(rel);
      if (!CHECK) writeFileSync(join(ROOT, rel), after);
    }
  }
}

if (CHECK) {
  if (drift.length) {
    console.error(`공통 조각이 어긋난 SKILL.md ${drift.length}개 (node sync-shared.mjs 로 맞춘다)\n  ${drift.join('\n  ')}`);
    process.exit(1);
  }
  console.log('공통 조각 일치');
} else {
  console.log(drift.length ? `맞춤 ${drift.length}개\n  ${drift.join('\n  ')}` : '바뀐 것 없음');
}
