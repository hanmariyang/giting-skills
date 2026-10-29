// 색 규칙 시험: node --test eval/colors.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const TOOL = join(HERE, '..', 'scripts', 'capsync.mjs'), EX = join(HERE, '..', 'examples');
const run = (...a) => { const r = spawnSync('node', [TOOL, ...a, '--json'], { encoding: 'utf8' }); return { code: r.status, j: JSON.parse(r.stdout) }; };
const at = (j, rule) => j.before.issues.filter((x) => x.rule === rule).map((x) => x.n);

test('글자 전체에 색: SRT font 와 ASS 꼬리표를 잡고, 흰색은 넘긴다', () => {
  const { j } = run(join(EX, 'colors.srt'));
  assert.deepEqual(at(j, 'COLOR'), [1, 4]);
});
test('한 자막에 색 칠한 곳이 둘이면 포인트 색', () => {
  const { j } = run(join(EX, 'colors.srt'));
  assert.deepEqual(at(j, 'POINT'), [3]);
});
test('--colors 없이는 대비를 재지 않는다', () => {
  const { j } = run(join(EX, 'colors.srt'));
  assert.equal(j.inputs.colors, false);
  assert.deepEqual(at(j, 'CONTRAST'), []);
});
test('외곽선과 대비가 4.5:1 미만인 색을 잡는다', () => {
  const { j } = run(join(EX, 'colors.srt'), '--colors', 'text=#FFFFFF,outline=#1A1A1A,point=#FFE14D');
  assert.deepEqual(at(j, 'CONTRAST'), [6]);            // #2A2A2A 는 검은 외곽선에 묻힌다
});
test('--colors 의 포인트 색 자체도 잰다', () => {
  const { j } = run(join(EX, 'colors.srt'), '--colors', 'outline=#1A1A1A,point=#333333');
  assert.ok(j.before.issues.some((x) => x.rule === 'CONTRAST' && x.n == null));
});
test('VTT: STYLE 의 ::cue 색과 <c.yellow> 한 줄 전체를 잡는다', () => {
  const { j } = run(join(EX, 'colors.vtt'));
  assert.deepEqual(at(j, 'COLOR'), [null, 1]);
});
test('--speaker-colors 면 BBC 화자 색(노랑, 청록, 초록)은 허용', () => {
  const { j } = run(join(EX, 'colors.vtt'), '--speaker-colors');
  assert.deepEqual(at(j, 'COLOR'), []);
});
test('색 꼬리표가 있는 자막은 줄을 다시 나누지 않아 색을 잃지 않는다', () => {
  const out = join(tmpdir(), `capsync-colors-${process.pid}.srt`);
  const r = spawnSync('node', [TOOL, join(EX, 'colors.srt'), '-o', out], { encoding: 'utf8' });
  assert.notEqual(r.status, 2);
  const s = readFileSync(out, 'utf8'); rmSync(out);
  assert.equal((s.match(/<font/g) || []).length, 6);   // 들어간 6개 그대로
});
