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

### 02 · css-menu — CSS 증상 사전

깨진 화면을 CSS 용어가 아니라 **증상**으로 찾는 사전입니다. "가운데 정렬이 안 돼요", "스크롤이 두 개예요", "버튼이 안 눌려요"를 그대로 입구로 씁니다. 기획자·디자이너 등 비개발자 우선 설계.

- **8개 코스 42개 항목**: ①정렬 ②삐져나옴·잘림 ③스크롤 ④겹침·가려짐 ⑤폰에서만 ⑥간격 ⑦글자 ⑧안 보임
- **깨진/고친 실물 나란히**: 전 항목이 before/after 실제 동작 HTML — 이중 스크롤은 굴려보고, 막힌 버튼은 눌러본다
- **즉방형 34 · 분기형 8**: 상황 불문 같은 처방인 것만 "고쳐줘" 문장을 주고, 상황 의존(한글 줄바꿈·줄 간격 등)은 **진단 먼저** — 일률 처방으로 위장하지 않는 것이 검수 기준
- **확인법 동봉**: 항목마다 "고쳐졌는지 눈으로 확인하는 방법" ("창 높이를 바꿔도 가운데면 성공")
- **에이전트 채널**: [llms.txt](https://giting.kr/skills/css-menu/llms.txt) · [llms-full.txt](https://giting.kr/skills/css-menu/llms-full.txt)

라이브 갤러리: **https://giting.kr/skills/css-menu**

```
/plugin install css-menu@giting
```

### 03 · codelazy — 안 만들어도 되는 것 사전

AI 가 부풀리기 쉬운 지점을 증상으로 짚고 표준 한 줄로 되돌리는 사전. ponytail(MIT) 정신을 우리 증상 사전 포맷으로 재구현.

- **5개 코스 15개 항목**: 표준이 이미 함 · 한 줄이면 됨 · 라이브러리 안 깔아도 됨 · 안 시킨 추상화 · 안 시킨 확장점
- **실측 before/after**: 캐싱 27→17줄, 중복제거 12→1줄 등 재현 실측한 코드 비교
- **즉방형 / 분기형**: 표준에 정답 있는 건 바로, 추상화가 때로 정당한 건 진단 먼저(무조건 "만들지마" 금지)

라이브: **https://giting.kr/skills/codelazy**

```
/plugin install codelazy@giting
```

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
