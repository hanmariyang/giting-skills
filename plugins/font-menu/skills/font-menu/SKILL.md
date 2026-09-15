---
name: font-menu
description: "웹폰트를 '어떤 인상을 원하는지'로 고르고, 그 폰트를 어디서 어떻게 불러오는지 로딩 스니펫째 주는 사전. 사용자가 '폰트 추천', '이 랜딩에 어울리는 폰트', 'AI 스타트업 느낌 폰트', '고급스러운 제목 폰트', '한글 폰트 뭐 쓰지', 'Pretendard 대안', 'Satoshi/Inter/Space Grotesk 넣어줘', '폰트가 안 바뀌어요/기본 폰트로 나와요'라고 할 때 사용한다. Google Fonts·Fontshare·jsDelivr는 로딩법이 다르고, 틀리면 조용히 시스템 폰트로 폴백된다. 맥락별 폰트·짝·라이선스·정확한 <link>를 준다."
---

# 웹폰트 사전 (font-menu)

"폰트 예쁘게 넣어줘"라고 하면 AI는 (1) 늘 쓰던 Inter만 얹거나 (2) Google Fonts에 없는 폰트를 Google `<link>`에 박아 **조용히 시스템 폰트로 폴백**시킨다. 화면은 멀쩡해 보이는데 의도한 폰트가 아니다. 이 사전은 폰트마다 **어디서·어떻게 불러오는지**를 복사용 스니펫으로 주고, 맥락별 짝·라이선스·안 쓸 때까지 붙였다.

## 대원칙 — 로더가 폰트마다 다르다

이게 이 사전의 핵심이다. 폰트 이름만 안다고 뜨지 않는다. **출처가 셋으로 갈린다.**

- **Google Fonts** — Google에 있는 폰트. `<link>`로 부르고 CSS 폴백 스택 필수. 파일 번들·상용 자유.
- **Fontshare** — Indian Type Foundry 배포(Satoshi·Clash Display·General Sans). **Google에 없다.** `api.fontshare.com`에서만 로드한다. 무료·상용은 되지만 **파일을 프로젝트에 넣어 재배포하면 라이선스 위반** — CDN `<link>`로만 쓴다.
- **jsDelivr** — Google에 없는 오픈 폰트(Pretendard·Wanted Sans)를 GitHub 저장소째 서빙. OFL이라 번들도 가능하지만 CDN `<link>`가 간편.

⚠️ 가장 흔한 사고: `family=Satoshi`를 Google `<link>`에 박기. Google엔 Satoshi가 없어 아무 일도 안 일어나고 시스템 폰트로 폴백된다. **Fontshare 폰트는 반드시 Fontshare `<link>`로.**

## 사전을 읽는 법

`menu.json`이 SSOT다. 항목마다:

- `family` — 폰트 이름
- `category` — 맥락(본문·테크·랜딩·세리프·모노·한글)
- `source` — **Google Fonts / Fontshare / jsDelivr** (로더가 여기서 갈린다)
- `license` — OFL(번들 가능) vs Fontshare(CDN 로드만)
- `load` — **복사해서 `<head>`에 넣는 정확한 스니펫**
- `css` — `font-family` 값(폴백 스택 포함)
- `vibe` — 어떤 인상인가
- `use` / `whenNot` — 언제 쓰고 언제 피하나
- `pairsWith` — 어떤 폰트와 짝지을까
- `weights` — 사용 가능한 두께

## AI한테 시키는 공식

1. **인상부터** — "AI 스타트업 느낌", "고급스러운 제목", "읽기 편한 국문 본문" 같은 인상을 정한다.
2. **짝으로** — 제목(display) 하나 + 본문(body) 하나. 보통 둘이면 충분하다. 셋 넘기지 않는다.
3. **로딩 스니펫째 시킨다** — "이 폰트를 이 `<link>`로 불러오고, `font-family`에 폴백 스택까지 넣어줘."

- ✕ 이렇게 말고: 「폰트 예쁘게 넣어줘」
- ○ 이렇게: 「히어로 제목은 Instrument Serif, 본문은 Inter로. 둘 다 Google Fonts `<link>`로 불러오고 CSS 폴백 스택도 넣어줘」

## 짝 레시피 (자주 쓰는 조합)

- **AI 스타트업** — 제목 Space Grotesk + 본문 Inter (+ 라벨 Space Mono)
- **프리미엄 랜딩** — 제목 Instrument Serif 또는 Fraunces + 본문 Satoshi/Inter
- **강렬한 히어로** — 제목 Clash Display + 본문 Satoshi
- **개성 있게(AI 티 지우기)** — 제목 Bricolage Grotesque + 본문 Manrope
- **럭셔리·격식** — 제목 Playfair Display + 본문 Newsreader
- **개발자 도구** — 본문 Geist + 코드 Geist Mono
- **국문 기본** — Pretendard 단독(한/영/숫자 다 받음)
- **국문 감성** — 제목 Gowun Batang + 본문 Pretendard

## "AI가 만든 티" 주의

Inter·Space Grotesk는 지금 웹에서 가장 흔한 폰트다. **제목까지 Inter/Space Grotesk면 "AI가 만든 화면" 신호**가 된다. 개성이 필요한 히어로에는 세리프(Instrument Serif·Fraunces)나 디스플레이(Clash Display·Bricolage)로 대비를 준다. Inter는 '안전'이지 '인상'이 아니다.

## 폴백 스택은 항상

폰트가 로드되기 전·실패 시를 위해 `font-family`에 시스템 폴백을 항상 넣는다. 각 항목의 `css` 값이 이미 폴백까지 포함한 형태다(예: `'Inter', system-ui, sans-serif`).

## 쓰는 법

- **Claude Code**: "이 랜딩에 어울리는 폰트 짝 골라서 로딩까지 넣어줘" — 인상→짝→정확한 `<link>`.
- **다른 AI/직접**: `menu.json`에서 폰트를 고르고 `load` 스니펫을 `<head>`에, `css` 값을 `font-family`에.
- 갤러리(각 폰트 실물 렌더): https://giting.kr/skills/font-menu
- 에이전트용 사전: `llms.txt`
