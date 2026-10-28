import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
// 실측 채점: out/*.srt 를 같은 기준(넷플릭스 한국어 · 30fps · 컷 · 말 구간)으로 잰다
//   node score.mjs
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const E = dirname(fileURLToPath(import.meta.url)), TOOL = join(E, '../scripts/capsync.mjs');
const seed = JSON.parse(readFileSync(`${E}/words.json`, 'utf8'));
const han = (s) => [...s].filter((c) => /[가-힯]/.test(c)).length;
const total = han(seed.segments.map((s) => s.text).join(''));
const rows = [];
for (const d of readdirSync(`${E}/out`).sort()) {
  const out = `${E}/out/${d}`;
  if (!existsSync(out)) { rows.push({ d, out: false }); continue; }
  let j; try { execFileSync('node', [TOOL, out, '--fps', '30', '--cuts', `${E}/cuts.txt`, '--speech', `${E}/words.json`, '--json']); } catch (e) { j = JSON.parse(e.stdout.toString()); }
  if (!j) j = JSON.parse(execFileSync('node', [TOOL, out, '--fps', '30', '--cuts', `${E}/cuts.txt`, '--speech', `${E}/words.json`, '--json']).toString());
  const txt = readFileSync(out, 'utf8').split('\n').filter((l) => !/^\d+$/.test(l.trim()) && !l.includes('-->')).join('');
  rows.push({ d, cues: j.cues, issues: j.before.total, by: j.before.byRule, keep: Math.round(han(txt) / total * 100) });
}
for (const r of rows) console.log(r.d.padEnd(16), r.out === false ? '파일 없음' : `자막 ${String(r.cues).padStart(3)} · 남은 문제 ${String(r.issues).padStart(3)} · 글자 ${r.keep}% · ${JSON.stringify(r.by)}`);
