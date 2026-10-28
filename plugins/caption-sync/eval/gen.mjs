// 실측용 가짜 녹음: 대본에 단어 시각을 붙인다 (말 빠르기 초당 6.5음절, 문장 사이 쉼, 점프 컷)
const S = [
  '영상 편집을 맡길 때마다 저는 늘 말로 설명하다가 막혔어요',
  '화면이 옆으로 쓱 지나가게 해 주세요 이런 식으로요',
  '네',
  '근데 이게 매번 다르게 나오더라고요',
  '알고 보니까 이런 움직임에는 전부 이름이 있었어요',
  '옆으로 훑는 건 팬이고 앞으로 다가가는 건 달리예요',
  '진짜요?',
  '줌이랑 달리가 다른 거라는 것도 이번에 처음 알았어요',
  '줌은 렌즈만 당기는 거고 달리는 카메라가 직접 움직이는 거라서 배경이 같이 커지는 느낌이 달라요',
  '그래서 이름만 알면 편집 요청이 한 줄로 끝나요',
  '오늘은 자주 쓰는 스무 개를 정리해 봤어요',
  '하나씩 보여 드릴게요',
];
let t = 0.4, seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const segs = [], cuts = [];
S.forEach((s, i) => {
  if (i && [2, 4, 6, 8, 10].includes(i)) cuts.push(+(t - 0.12 - rnd() * 0.1).toFixed(3));   // 말 시작 직전에 자른 점프 컷
  const words = [];
  for (const w of s.split(' ')) {
    const syl = [...w.replace(/[?!.,]/g, '')].length, d = syl / (6 + rnd());
    words.push({ word: w, start: +t.toFixed(3), end: +(t + d).toFixed(3) }); t += d + 0.06 + rnd() * 0.05;
  }
  segs.push({ start: words[0].start, end: words.at(-1).end, text: s, words });
  t += 0.25 + rnd() * 0.35;
});
await import('node:fs').then((fs) => { fs.writeFileSync('words.json', JSON.stringify({ language: 'ko', segments: segs }, null, 1)); fs.writeFileSync('cuts.txt', cuts.join('\n') + '\n'); });
console.log('끝', t.toFixed(2), '초, 컷', cuts.length);
