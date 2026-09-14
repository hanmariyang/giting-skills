---
name: slide-pick
description: "Decide WHAT to draw on each slide before designing a deck. Given a topic and the judgment the audience must make, this picks the right layout, chart, and diagram type, names it, and blocks the choices that mislead. Use when the user asks to make a PPT/deck/발표자료/장표, or asks which chart/layout/diagram to use, or says 'make it clean/fast'. Ships a selection method (판단 문장 → 후보 좁히기 → 금지 규칙), a fill-in PPT prompt template, and concise taxonomies for layouts, charts (by intent), and SmartArt-style diagrams."
---

# slide-pick — choose what to draw before you design

Most AI decks fail before design: they pick a chart or layout by vibe, so the slide
does not help the audience decide anything. This skill fixes the order. For each slide,
first write the one judgment the audience must make, then let that pick the form.

The rule under everything: **every slide states one judgment the viewer makes, and the
form is chosen to serve that judgment, not to decorate it.**

## The method (do this per slide)

1. Write one sentence: "on this slide, the audience must judge ___."
2. Route it with the picker below to narrow candidates.
3. Choose one, name it with the exact name here (do not invent names).
4. Check it against the forbidden list. If a request violates one, say so first.
5. State the reason in one line: `[slide N] judgment: OO → form: OO (because OO)`.
6. No data, no chart. If there is no basis, write "자료 없음" (no source).

## Picker — start here

**Step 1 — what does this slide do?**

| does | go to |
| --- | --- |
| previews the whole talk | 목차 |
| explains an order (B needs A first) | 순서·프로세스 |
| a procedure with branches (if ~) | 절차·플로우 |
| shows an analysis frame | 분석 프레임워크 |
| dated events | 연혁·타임라인 |
| shows numbers | 데이터·수치 → charts |
| shows change/result | 성과·결과 |
| compares options | 비교 |
| burns in one line | 강조 |
| divides sections | 표지·간지·마무리 |

**Step 2 — if numbers, what are you saying?** (intent, not data shape)

| saying | intent | typical chart |
| --- | --- | --- |
| how far it deviates from a baseline | Deviation | diverging bar |
| do two move together | Correlation | scatter, bubble |
| order matters more than value | Ranking | ordered bar, slope, bump |
| how values spread | Distribution | histogram, boxplot, beeswarm |
| changed over time | Change over time | line, slope, streamgraph |
| bigger/smaller | Magnitude | column, bar, bullet |
| how a whole splits | Part-to-whole | stacked bar, treemap, waterfall |
| place/geography | Spatial | choropleth, flow map |
| from where to where, how much | Flow | sankey, chord, waterfall |

**Step 3 — if a diagram, what relationship?**

| relationship | diagram family |
| --- | --- |
| listed, no order | 목록형 |
| B needs A first | 프로세스 |
| loops back to start | 주기형 |
| top governs bottom | 계층 구조형 |
| mutual influence | 관계형 |
| two axes, four cells | 행렬형 |
| stacked in layers | 피라미드형 |
| a photo is the evidence | 그림형 |

## Layouts by purpose (when / avoid)

- **목차**: 번호 세로형(≤5항목) · 2단 분할(길 때) · 진행 표시형(발표 15분+). 항목 6+면 세로형 피함.
- **순서·프로세스**: 가로 화살표(3~5 대등단계) · 갈매기형(누적) · 계단형(수준 상승) · 세로 흐름(설명 길 때). 화살표 크기를 단계마다 다르게 하지 말 것(중요도로 읽힘). 각 단계에 동사+산출물.
- **절차·플로우**: 플로우차트(분기 있음) · 레인(누가 하는지가 쟁점). 마름모에서 나가는 선엔 예/아니오 라벨, 한 장에 판단 3개까지.
- **분석 프레임워크**: 순환(PDCA·OODA·DMAIC)은 반드시 원형(가로 프로세스 금지) · 2×2(SWOT·아이젠하워·BCG)는 축 이름 필수 · 나열(3C·4P·PEST) · STP는 순서형이라 프로세스로.
- **연혁·타임라인**: 가로 일자(4~6) · 세로 일자(많고 설명 길 때) · 간트(기간) · 마일스톤(결정적 순간). 시간 간격을 균등히 그리지 말 것.
- **데이터·수치**: KPI 카드(3~4 지표) · 숫자+추이(하나 깊게) · 표(정확값, 7행 이하). KPI 숫자는 라벨의 3배, %와 %p 구분.
- **성과·결과**: Before/After(같은 축·스케일) · 목표 대비 실적 · 추이+개입 시점 · 폭포. 결과 옆에 항상 "의미"(예: 40분→12분=주당 4.6시간).
- **비교**: 2단 대비 · 3단 카드 · 비교 표(항목 4+ × 기준 여러). 추천 열 하나를 반드시 강조(없으면 청중이 결정 못 함).
- **강조**: 큰 글자 한 장 · 색 강조(한 군데) · 흐리게 처리(색 강조보다 강함). 한 장에 강조는 하나.
- **표지·간지·마무리**: 표지 제목은 결론형 · 간지는 배경색 반전 · 마무리는 "감사합니다" 금지 → 결론 한 문장 + 다음 액션.

## Charts by intent

Categories follow the Financial Times Visual Vocabulary (CC BY-SA 4.0, linked in sources);
the when-to-use notes here are our own. Use the FT category to narrow, then pick:

- **Deviation**: diverging bar, diverging stacked bar(설문 동의/중립/반대에 최적).
- **Correlation**: scatter(표준), bubble(+3번째 변수), connected scatter(관계가 시간에 따라). 상관을 인과로 서술 금지.
- **Ranking**: ordered bar, slope(순위가 시간에 따라), bump(여러 시점 변동), lollipop(값 자체 주목).
- **Distribution**: histogram(간격 좁게), boxplot(중앙값·범위 요약), beeswarm(개별 점).
- **Change over time**: line(표준), slope(2~3 시점), streamgraph(비중 변화), fan chart(미래 불확실성).
- **Magnitude**: column(축 0에서 시작), bar(범주명 길 때), bullet(목표·성과 맥락), isotype(정수만).
- **Part-to-whole**: stacked bar(구성요소 4 이하), treemap(계층), waterfall(음수 포함), pie(3~5조각, 정확 비교엔 약함).
- **Spatial**: choropleth(총량 아닌 비율로), flow map, dot density.
- **Flow**: sankey, chord, waterfall.

## Diagrams (SmartArt families)

Microsoft SmartArt names are Microsoft's (source linked). Pick by relationship, then use
the exact Microsoft layout name in the deck. Category → when:

- **목록형**: 순서 없는 그룹·나열. 항목이 대등할 때.
- **프로세스**: 앞이 끝나야 뒤. 동사+산출물이 붙는 단계.
- **주기형**: 끝이 시작으로 돌아감(개선 사이클). 가로로 그리지 말 것.
- **계층 구조형**: 조직·의사결정 트리. 4단 이상이면 글씨가 안 읽힘.
- **관계형**: 서로 영향·수렴·발산. 중심-위성이면 방사형.
- **행렬형**: 두 축 네 칸. 축 이름 없으면 성립 안 함.
- **피라미드형**: 층으로 쌓인 비례·계층.
- **그림형**: 사진이 근거일 때.

## Fill-in PPT prompt (hand this to a slide-making AI)

```
아래 내용과 첨부 자료로 PPT(.pptx)를 만들어줘. 이 자료를 본 사람이 [판단]하게 할 거야.

[목적]  · 주제:  · 보는 사람:  · 봐야 하는 판단:  · 슬라이드 수:

[바로 디자인하지 말고 이 순서로 사고]
1. 첨부 자료 핵심 분석  2. 그 판단에 이르게 할 슬라이드 순서 결정
3. 각 슬라이드 근거가 자료 어디 있는지 확인  4. 슬라이드별 최적 차트·도식·레이아웃 결정
5. 통계·성과·비교는 텍스트 나열 말고 시각화로 변환

[먼저 표로 보내줘] 1.제목(결론문장) 2.이 장 뒤 청중 판단 3.근거 4.시각화 방식
 · 근거 없는 슬라이드는 "자료 없음"  · 논리 안 이어지면 지적

[그 다음 PPT] · 16:9 · 제목=결론문장 · 한 장 핵심 1개 · 통계는 차트로(판단에 필요한 것만)
 · 색상 [___, ___, ___] · 레이아웃 기계적 반복 금지

[주의] 없는 숫자 만들지 말 것("자료 없음"), 불확실하면 불확실하다 표기

[다 만든 뒤 점검] 1.제목만 읽어도 이야기가 이어지나 2.3초 안에 핵심 읽히나
 3.글자 넘칠 장 4.근거 약한 장 5.목적에 맞는 스토리인가
```

## Forbidden (say so even if requested)

- **차트**: 3D(원근 왜곡) · 이중 Y축(스케일 조작) · 막대 Y축 0 아님(차이 부풀림) · 원형 6조각+ · 무지개색(순서 없는 색을 순서 데이터에) · 격자선 진하게 · 워드클라우드(크기가 빈도인지 중요도인지 불명).
- **도형**: 안 겹치는데 벤다이어그램 · 방사형을 순환 뜻으로 · 순서 없는데 프로세스형 · 축 이름 없는 2×2 · 계층 4단+.
- **문서**: 첨부에 없는 숫자 · 프레임 이름을 제목으로("SWOT 분석") · 마지막 장 "감사합니다" · 한 장에 강조 2개+ · 장표마다 같은 레이아웃 반복.

## Sources

- Financial Times Visual Vocabulary (chart categories) — github.com/Financial-Times/chart-doctor · CC BY-SA 4.0
- Microsoft SmartArt (diagram names) — support.microsoft.com
- From Data to Viz (data-shape → chart) — data-to-viz.com · Data Viz Project — datavizproject.com

Category systems above are referenced from these; the when-to-use guidance and the method
are this skill's own. Do not paste those sources' descriptions verbatim into a deck.
