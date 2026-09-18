# canvas-motion

창발적(살아 있는) 캔버스 모션을 자유롭게 만드는 스킬. **외부 애니 라이브러리 0** — 순수 Canvas 2D + requestAnimationFrame. 랜딩·히어로·데모의 인상적인 모션은 라이브러리가 아니라 `도메인 모델 + 캔버스 렌더러 + rAF 루프`라는 코드 레시피라는 통찰에서 나왔다.

## 구성

```
engine/
  canvas-motion.js       코어 — 고정 timestep 루프+보간·이징·아이소 투영·깊이 정렬·시드 rng
  canvas-motion-plus.js  고급 — 노이즈/플로우필드·보이드·공간해시·카메라·A*·파티클·큐레이션 스킴·스프라이트 글로우·팔레트
recipes/
  flagship-iso-hub.html  시뮬(아이소) — 물류 허브: A* 로봇 + 보이드 드론 + 데이터 스트림 + 발광 타워
  aurora-flow.html       제너러티브(추상) — 노이즈 플로우필드 × 2,400 입자 × 잔광 리본
  constellation-net.html 네트워크(추상) — 표류 노드 + 근접 연결선(거리 페이드) + 허브 글로우
lint/
  motion-lint.mjs        규율 점검 — reduced-motion·라이브러리금지·rAF·DPR·고정timestep·깊이정렬·시드
skills/canvas-motion/SKILL.md
```

## 두 모드

- **시뮬레이션 구동**: 상태+규칙을 매 tick 갱신 → 결과를 그림. 창발적(볼 때마다 다름). 로봇·군집·흐름.
- **타임라인 구동**: 절대 시각 t 로 결정적 연출(키프레임을 코드로). 순차 설명·루프 데모.

## 핵심 규율 (motion-lint 강제)

- prefers-reduced-motion 필수(CM.loop 자동) · 고정 timestep(프레임레이트 독립) · DPR 대응 · 아이소는 깊이 정렬 · 창발 시뮬은 시드 고정 · 60fps 예산 · **라이브러리 0**.

## 설치

```
/plugin marketplace add hanmariyang/giting-skills
/plugin install canvas-motion@giting
```

## 쓰는 법

1. 모드를 고른다(살아 있어야 하면 시뮬).
2. 가장 가까운 `recipes/` 를 복제해 시작한다(밑바닥부터 X).
3. 모델→렌더→`CM.loop` 순으로 얹는다.
4. `node lint/motion-lint.mjs <file.html>` 로 자가 점검.

라이선스 MIT. 자세한 API·절차는 `skills/canvas-motion/SKILL.md`.
