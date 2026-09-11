# Giting Skills

오픈소스를 별점이 아니라 실측으로 읽는 [Giting](https://giting.kr)이 만들고 검수한 Claude Code 스킬 모음입니다. **실측 검수를 통과한 스킬만 올라옵니다.**

Curated Claude Code skills from [Giting](https://giting.kr), the open-source field-measurement review site. Every skill here passed a hands-on review before listing.

## 설치

```
/plugin marketplace add hanmariyang/giting-skills
/plugin install ui-menu@giting
```

## 스킬 목록

### 01 · ui-menu — UI 메뉴판

"접었다 폈다 되는 거"를 **아코디언**이라 부르게 해 주는 사전입니다. 이름을 아는 순간 AI에게 시키는 시간이 줄어듭니다.

- **8개 코스 105개 항목**: ①페이지 뼈대 ②이동·탐색 ③내용 보여주기 ④입력받는 것 ⑤누르는 것 ⑥알려주는 것 ⑦작은 표시들 ⑧상태·동작
- **별칭 사전**: 사람이 실제로 하는 말("화면 가운데 뜨는 창", "옆에서 미끄러져 나오는 메뉴") → 정식 명칭 매핑
- **AI한테 시키는 공식**: [어디에] + [컴포넌트 이름] + [개수] + [세부 조건] — 항목마다 그대로 복사해 쓰는 요청 문장
- **실물 HTML**: 전 항목이 그림이 아니라 실제로 동작하는 자가완결 HTML (의존성 0, 접근성 기본 포함)
- **에이전트 채널**: [llms.txt](https://giting.kr/skills/llms.txt) · [llms-full.txt](https://giting.kr/skills/llms-full.txt) (코드 포함)

라이브 갤러리: **https://giting.kr/skills/**

설치하면 Claude가 네 가지를 합니다.

1. **통역** — "위에 눌러서 화면 바뀌는 거" → "그건 탭(Tabs)입니다" + 다음부터 쓸 요청 문장
2. **요청 다듬기** — 두루뭉술한 요청을 공식대로 다시 써서 확인
3. **구현** — 검증된 레퍼런스 HTML을 기반으로 기존 코드 스타일에 맞춰 이식
4. **제안** — "이 목록이 너무 길어" → 상황에 맞는 컴포넌트를 근거와 함께 추천

## 등재 기준

- 실제로 써 보고 검수한 것만 올립니다 (자동 수집 없음)
- 수치·효용 주장은 실측 근거가 있는 것만 적습니다
- 외부 스킬 등재 접수는 아직 받지 않습니다

## 개발

```bash
node build.mjs   # docs/ 갤러리 + llms.txt 재생성 (의존성 0)
```

사전 정본(SSOT)은 `plugins/ui-menu/menu.json` + `plugins/ui-menu/demos/*.html`(프래그먼트)입니다. `components/*.html`(스킬용 자가완결 파일)과 갤러리·llms.txt는 전부 빌드가 생성합니다.

## License

MIT © Giting
