---
name: canvas-motion
description: "웹 랜딩·히어로·데모에 창발적(살아 있는) 모션 그래픽을 만들 때 사용한다. '움직이는 배경', '살아 있는 히어로', '파티클', '아이소메트릭 시뮬레이션', '데이터가 흐르는 애니메이션', '창발적/제너러티브 모션', '캔버스 애니메이션', 'GSAP/Lottie 없이 모션' 같은 요청에. Canvas 2D + requestAnimationFrame 만으로(라이브러리 0) 시뮬레이션 구동 또는 타임라인 연출 모션을 만들고, 고정 timestep 루프·보간·아이소 투영·깊이 정렬·보이드·플로우필드·A*·파티클·글로우를 재사용 엔진으로 제공한다. prefers-reduced-motion·DPR·60fps 규율 포함."
---

# canvas-motion — 창발 캔버스 모션 엔진 + 레시피

랜딩의 인상적인 모션은 라이브러리가 아니라 **코드 레시피**다: `도메인 모델(시뮬 또는 타임라인) + 캔버스 렌더러(투영·깊이·보간) + rAF 루프`. 이 스킬은 그 배관을 의존성 0 엔진으로 고정하고, 창발 모션을 자유롭게 만들게 한다. **외부 애니 라이브러리(GSAP·Lottie·Framer·anime.js) 금지** — 순수 Canvas 2D + rAF.

## 두 가지 모드 — 먼저 이걸 고른다

| 모드 | 무엇 | 언제 | 레시피 |
|---|---|---|---|
| **시뮬레이션 구동** | 상태 + 규칙을 매 tick 갱신 → 결과를 그림. **창발적**(볼 때마다 다름) | 로봇·군집·흐름·생명감 있는 씬 | `recipes/flagship-iso-hub.html` |
| **타임라인 구동** | 절대 시각 t 로 장면을 결정적으로 연출(키프레임을 코드로) | 서사(책장→뽑기→펼침)·6단계 플로우·순차 설명 | `recipes/book-shelf-timeline.html` · 아래 "타임라인 뼈대" |

핵심 규율: **키프레임을 손으로 그리지 말고, 상태+규칙을 갱신하라.** 그래야 살아 있다.

## 두 가지 대원칙 (pusil BvA 실험에서)

1. **모션은 장식이 아니라 논지를 나른다.** 예쁜 추상 모션은 메시지를 안 나른다. 좋은 히어로 모션은 **제품의 핵심 진실을 움직임으로 번역**한다 — pusil("읽는 중을 함께")의 히어로는 페이지 바코드가 *살아 있어야* 그 주장을 증명한다. 정적 바코드는 논지를 스스로 배반한다. 씬을 고르기 전에 물어라: **이 모션이 카피가 못 하는 무엇을 하는가?**
2. **창발 > 스크립트.** "지금 누가 어디쯤"을 고정된 N개의 사인파로 뛰게 하면 가짜다. **읽는 사람을 시뮬(옮겨다니고·머물고·떠나고·스레드를 남기고, 전체는 식음)로 돌리면** 따뜻한 지점이 저절로 움직이고 나타났다 사라진다. 그게 창발이고, 그게 살아 있는 것이다.

## 엔진 — 두 파일, 전역 CM / CMX

`engine/canvas-motion.js`(코어) + `engine/canvas-motion-plus.js`(고급). 자가완결 HTML 이면 `<script src>` 로 넣거나 인라인한다.

**코어 `CM`**
- `setupCanvas(canvas,{width,height,maxDpr})` → `{ctx,w,h,dpr}`. DPR 대응(선명함), 논리 좌표는 CSS 픽셀.
- `loop({tick,update,render,settle,reduced})` → `{stop}`. **고정 timestep**: `update(dt)` 는 tick 초마다 정확히, `render(now,alpha)` 는 매 프레임. ⚠️ **첫 인자가 `now`(밀리초 타임스탬프)**, 둘째가 `alpha`(다음 tick까지 0~1, 보간용). 타임라인(t 기반)이면 `render(now){ var t=(now/1000)%DUR }`. `reduced`(reduced-motion)면 `settle` 번만 밟고 정지 프레임 1장(`staticAt` 로 그 시각 지정). 탭 숨으면 자동 일시정지.
- `ease.{linear,inOutSine,outCubic,inOutCubic,outBack,outElastic}` · `lerp(a,b,t)` · `clamp` · `seg(t,a,b)`(구간 진행률, 타임라인용).
- `iso(tw,ox,oy)` → `P(x,y,h)`: 격자→아이소 화면. **h 는 픽셀 높이**(격자 단위 아님 — 타워는 40~150px).
- `drawList()` → `{add(depth,fn),flush()}`: **깊이 정렬**(painter's). 아이소 가림은 `depth = x+y`.
- `rng(seed)`: **재현 가능한 난수**. 창발 시뮬을 결정적으로(검증·비교·버그 재현). `alongPath(pts,u)`: 폴리라인 위 이동.

**고급 `CMX`** (창발의 재료)
- `makeNoise(seed)` → fbm 노이즈 · `flowField(noise,scale,strength)` → 위치별 흐름 벡터.
- `spatialHash(cell)` → `insert/near`: O(1)급 이웃 질의(보이드·충돌 필수).
- `steer.{seek,arrive,separate,align,cohesion,follow,integrate}`: 레이놀즈 스티어링/보이드.
- `particles(max)` → `emit/update/draw`: 파티클 이미터.
- `camera(w,h)`: pan/zoom, 월드↔화면. `astar(walkable,cols,rows)`: 격자 A*.
- `scheme(name)`: **큐레이션 팔레트**(aurora·cyber·ember·mono) → `{bg:[상,하], cols:[쿨 3~4], accent:단일}`. **design-brief 안티-슬롭: 무지개 랜덤 팔레트 금지, 절제 + 단일 액센트.** `rgba(color,a)`: hex/hsl → rgba.
- `makeGlow(color,r,inner)` → 스프라이트 `{blit(ctx,x,y,scale)}`: **shadowBlur 대체(10~100x 빠름).** 매 프레임 `glow()`(shadowBlur) 호출은 성능을 죽인다 — 색별로 1회 `makeGlow` 하고 `blit` 하라(`lighter` 합성). `isoBox(ctx,P,x,y,z,w,d,h,c)`: 아이소 3면 박스. `glow(ctx,...)`: shadowBlur(1회성·소량만).

## 새 모션 만들기 — 절차

1. **모드 결정**(시뮬 vs 타임라인). 살아 있어야 하면 시뮬.
2. **가장 가까운 레시피를 복제**해 시작한다(`recipes/`). 밑바닥부터 쓰지 않는다.
3. **모델**을 짠다 — 시뮬이면 상태(에이전트/격자)+규칙(스티어링/A*/노이즈), 타임라인이면 구간표.
4. **렌더**를 짠다 — `setupCanvas` → 아이소면 `iso`+`drawList`, 파티클이면 이미터, 글로우는 `glow`/`lighter`.
5. **루프**에 얹는다 — `CM.loop`. 시뮬은 `update` 에서 상태 갱신, `render` 에서 보간해 그림.
6. **규율 통과**(아래). `node lint/motion-lint.mjs <file.html>` 로 자가 점검.

## 타임라인 뼈대 (결정적 연출)

```js
var DUR=12; // 초, 루프
function draw(t){ // t=경과초 (0~DUR)
  // seg(t,a,b) 로 구간 진행률, ease 로 부드럽게, lerp/alongPath 로 이동
  var u=CM.ease.inOutCubic(CM.seg(t,1.5,3.5));
  var p=CM.alongPath(path, u);
  // ...장면을 t 기준으로 그린다
}
CM.loop({tick:1/60, render:function(){ draw((performance.now()/1000)%DUR); }, settle:0,
  reduced:CM.prefersReducedMotion()}); // reduced면 draw(DUR*0.6) 한 장
```

## 규율 (motion-lint 가 강제)

- **reduced-motion 필수** — `CM.loop` 는 자동 처리하나, 직접 rAF 를 쓰면 `prefers-reduced-motion`에서 정지 프레임을 그린다.
- **고정 timestep** — 시뮬은 프레임레이트에 독립(`while(acc>=tick)`). dt 를 그대로 위치에 곱하지 마라(느린 기기에서 폭주).
- **DPR 대응** — `setupCanvas` 사용(레티나 선명함).
- **아이소는 깊이 정렬 필수** — `drawList`(depth=x+y) 없이는 가림이 깨진다.
- **시드 고정** — 창발 시뮬은 `rng(seed)` 로 결정적이게(재현·검증).
- **성능 예산** — 60fps 목표. ⚠️ **매 프레임 `ctx.shadowBlur`/`glow()`가 가장 흔한 병목이다** — `makeGlow` 스프라이트로 대체하라(색별 1회 생성 후 blit). 입자 수천 개면 dpr 상한을 낮추고 배열(Float32)로 관리. 정적 요소(바닥 격자)는 오프스크린에 1회 굽고 blit. `lighter` 합성은 아끼기.
- **미감** — 무지개 랜덤 팔레트를 쓰지 마라(아마추어 신호). `scheme()`으로 절제된 쿨/듀오톤 + 단일 액센트. 액센트는 10~15%만.
- **라이브러리 0** — 외부 애니 라이브러리 금지. 순수 Canvas 2D.

## 금지

- GSAP·Lottie·Framer·anime.js 등 애니 라이브러리 도입.
- reduced-motion 무시(접근성·멀미).
- 키프레임을 손으로 나열해 "살아 있는 척"(그건 시뮬이 아니다 — 정말 살아 있게 하려면 규칙으로).
- 없는 성능 주장(fps 는 실제로 재고 말한다).
