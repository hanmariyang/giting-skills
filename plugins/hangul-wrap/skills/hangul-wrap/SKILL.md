---
name: hangul-wrap
description: "Find and fix Korean line breaks that split a word (어절) in half on web pages, measured in a real browser instead of guessed. Use when a Korean UI or landing page looks 'AI-made', when the user says 한글 줄바꿈이 이상해요, 단어가 중간에서 끊겨요, 제목이 지저분하게 꺾여요, 줄넘김, word-break, keep-all, or before shipping any Korean HTML/CSS. Ships a zero-dependency checker (scripts/wrapcheck.mjs) that opens the page at several widths, rebuilds each line from real glyph positions, and reports split words, one-syllable orphan lines and overflow. Fixes are scoped by role (heading, body, narrow cell, code/URL), never a blanket rule, and are re-measured after."
---

# hangul-wrap: 한글이 어절 중간에서 꺾이지 않게

브라우저는 한글을 **글자 사이 어디서나** 꺾는다. 그래서 따로 손대지 않은 한국어 화면은
`간단/한 방법`, `걸립니/다.` 처럼 어절이 두 줄로 갈린다. 영어로 만든 틀에 한국어를 넣은
화면, 그리고 AI 가 만든 화면에서 가장 흔한 티다.

처방 속성은 넷이다(`word-break` · `text-wrap` · `overflow-wrap` · `white-space`).
어려운 건 속성이 아니라 **어디에 주느냐**다. 같은 `keep-all` 이 제목에서는 약이고,
좁은 표 칸에서는 칸을 뚫는다. 그래서 이 스킬은 늘 **재고 → 자리별로 고치고 → 다시 잰다.**

## 1. 잰다 (고치기 전에 반드시)

```sh
node scripts/wrapcheck.mjs <url|파일> [폭들] [--scope 셀렉터] [--json]
node scripts/wrapcheck.mjs index.html                 # 기본 390,768,1280
node scripts/wrapcheck.mjs http://localhost:3000 360,390 --scope main
```

- 크롬 계열 브라우저와 Node 22 이상만 있으면 된다. 설치할 패키지 없음. 경로가 다르면 `CHROME_PATH`.
- 글자 하나하나의 **실제 위치**로 줄을 되살린다. CSS 를 읽고 추측하지 않는다.
- 끝 코드: `0` 문제 없음 · `1` 쪼개짐이나 넘침 있음 · `2` 실행 못 함. 배포 앞 검사에 걸 수 있다.

잡는 것 셋:

| 표시 | 뜻 | 셈에 넣나 |
|---|---|---|
| ✂ 쪼개짐 | 이웃한 두 글자가 띄어쓰기 없이 다른 줄로 갈림 (`간단/한`) | 끝 코드 1 |
| ⛔ 넘침 | 글자가 상자를 뚫었거나 페이지가 옆으로 밀림. `keep-all`·`nowrap` 부작용 | 끝 코드 1 |
| · 외톨이 | 마지막 줄에 한두 글자만 남음 | 알리기만 |

가로 스크롤 상자 안과 말줄임(…)은 일부러 그런 것이라 넘침으로 치지 않는다.

보고서는 블록마다 **자리**를 붙인다(제목 · 본문 · 좁은 칸 · 코드·주소). 처방이 자리마다 다르기 때문이다.

## 2. 자리별로 고친다

| 자리 | 처방 | 이유 |
|---|---|---|
| 제목 | `word-break: keep-all` + `text-wrap: balance` | 어절 단위로 꺾고 줄 길이를 고르게. balance 는 몇 줄 이하에만 먹으니 제목 전용 |
| 본문 | `word-break: keep-all` + `text-wrap: pretty` | 어절 단위 + 마지막 줄 외톨이 줄이기 |
| 좁은 칸 (표·배지·버튼·태그) | **keep-all 주지 않는다.** 칸 폭을 늘리거나 말줄임, 꺾이면 안 되는 짧은 묶음(`월 9,900원`·`3분 전`)만 `white-space: nowrap` | keep-all 은 어절이 칸보다 길면 칸을 뚫는다 |
| 코드·주소 | `overflow-wrap: anywhere` (keep-all 은 그대로 둔다) | 긴 주소·토큰은 칸 안에서 아무 데서나 끊고, 코드 속 한글 어절은 지킨다 |

프로젝트에 줄바꿈 규칙이 하나도 없다면 기본값으로 이것을 넣는다:

```css
/* :where() 라 명시도가 0 이다. 컴포넌트에 이미 있는 규칙이 언제나 이긴다 */
:where(h1, h2, h3, h4, h5, h6, p, li, dd, dt, blockquote, figcaption) {
  word-break: keep-all;
  overflow-wrap: break-word;   /* 어절 하나가 줄보다 길 때만 마지막 수단으로 자른다 */
}
:where(h1, h2, h3, h4, h5, h6) { text-wrap: balance; }
:where(p, li, dd, blockquote, figcaption) { text-wrap: pretty; }
:where(pre, code, kbd, samp) { overflow-wrap: anywhere; }
```

`body` 에 걸어 상속시키는 방법도 된다(`:where(body) { word-break: keep-all; overflow-wrap: break-word; }`).
더 넓게 먹지만 그만큼 좁은 칸까지 내려가니, 걸고 나서 넘침을 꼭 다시 잰다.

## 3. 다시 잰다

같은 폭으로 다시 돌려 **쪼개짐 0 · 넘침 0** 을 확인한다. 고치기 전 수와 나란히 보고한다.
넘침이 새로 생겼다면 거의 늘 좁은 칸에 keep-all 이 내려간 것이다. 그 칸만 되돌린다.

## 하지 말 것

- **한글 글에 `word-break: break-all` 을 주지 않는다.** AI 가 넘침을 고치겠다며 가장 자주 넣는 한 줄인데,
  어절을 아무 데서나 자른다. 넘침은 자리별 처방으로 푼다.
- **`white-space: nowrap` 을 넓게 주지 않는다.** 묶어야 할 짧은 조각에만 `span` 단위로.
- **중국어·일본어가 섞인 글에 `keep-all` 을 주지 않는다.** 띄어쓰기가 없는 글이라 줄이 아예 안 꺾인다.
- **한 폭만 보고 "됐다"고 하지 않는다.** 쪼개짐은 특정 폭에서만 생긴다. 최소 폰 폭 하나와 데스크톱 하나.
- `text-wrap: balance`·`pretty` 를 지원하지 않는 브라우저는 그냥 무시한다. 해가 없으니 지원 여부로 막지 않는다.

## 손으로 다듬을 때

- 제목 속 긴 합성어는 원하는 자리에 `<wbr>` 을 넣어 거기서만 꺾이게 한다.
- 절대 갈리면 안 되는 두 어절(`3월 5일`)은 사이를 `&nbsp;` 로 붙인다.

## 보고하는 법

```
줄바꿈 실측 (390 · 768 · 1280)
  고치기 전  쪼개짐 11 · 넘침 2
  고친 뒤    쪼개짐 0 · 넘침 0
  바꾼 곳    제목·본문 기본값 1블록, 요금표 칸 nowrap, 연동 주소 code 처리
```

예시 페이지 둘(`examples/before.html`, `examples/after.html`)로 바로 돌려 볼 수 있다.
