# Giting Skills — 마켓플레이스 repo 가이드

Giting 이 검수한 Claude Code 스킬 모음. repo 자체가 마켓플레이스다 (`.claude-plugin/marketplace.json`).

## 구조

```
.claude-plugin/marketplace.json      # 마켓 정의 — 스킬 추가 시 plugins 배열에 등록
plugins/ui-menu/
├── .claude-plugin/plugin.json       # 플러그인 메타
├── menu.json                        # 사전 SSOT (11코스 129항목 — 별칭·정의·요청 문장·formula)
├── demos/*.html                     # 데모 프래그먼트 SSOT (<!-- @id h=NNN [full] --> 마커 구분)
├── components/*.html                # 생성물 — 스킬용 자가완결 129종 (빌드가 만들지만 커밋한다: 설치 시 빌드 없음)
└── skills/ui-menu/SKILL.md          # 스킬 본체
build.mjs                            # demos+menu.json → components/ + 갤러리 생성 (의존성 0)
docs/                                # GitHub Pages — 리다이렉트 + llms 미러 + promo (생성물)
```

**갤러리 정본 = https://giting.kr/skills/** (2026-09-12 owner 확정 — 우리 도메인 서빙, GitHub 은 소스 버튼).
빌드는 `GITING_SITE_DIR` 환경변수가 가리키는 곳(워크스페이스: `../giting/site/static/skills`)에 갤러리·llms·promo 를 쓰고, giting 사이트 빌드가 static 패스스루로 dist 에 싣는다. **스킬 수정 시 두 repo 를 같이 출하**:
```bash
GITING_SITE_DIR=../giting/site/static/skills node build.mjs   # 이 repo + giting 양쪽 산출
# → giting repo 커밋·main 머지(사이트 배포) + 이 repo 커밋·main 머지(github.io 미러)
```
github.io 는 구 링크 소비자용 리다이렉트(canonical giting.kr/skills)와 llms 미러만 유지.

## 규약

- **SSOT는 menu.json + demos/**. `components/` 와 `docs/` 는 전부 생성물이므로 `node build.mjs` 로만 갱신하고 직접 수정하지 않는다. 단 `components/` 는 마켓 설치본에 필요하므로 **커밋에 포함**한다.
- menu.json 항목 id = demos 마커 id. 항목을 추가하면 두 곳을 같이 (마커 없는 항목은 빌드가 에러로 잡는다).
- 데모 수정·추가 후 반드시 `node build.mjs` 실행 → components/·docs/ 를 같은 커밋에 포함 (Pages 는 docs/ 를 그대로 서빙).
- 컴포넌트 원칙: 자가완결 단일 HTML, 외부 의존성 0, 시맨틱 요소 우선, 접근성 최소선(aria·focus-visible·prefers-reduced-motion).
- 새 스킬 추가: `plugins/<name>/` 생성 + marketplace.json 등재 + README 목록 갱신. 이름은 `기능-명사` 소문자 케밥 (제품형 이름 금지).
- 등재는 실측 검수를 통과한 것만 (Giting 정체성). 외부 접수 없음.
- 브랜치: main 직접 푸시 금지, develop → PR.

## 공통 조각 (2026-10-08)

모든 SKILL.md 가 같은 조각을 품는다. **정본은 `shared/` 하나**이고 `node sync-shared.mjs` 가 표시(`<!-- giting:… -->`) 사이를 덮어쓴다. `build.mjs` 가 맨 먼저 이걸 돌린다. SKILL.md 안의 표시 사이는 직접 고치지 않는다.

| 조각 | 정본 | 들어가는 곳 |
|---|---|---|
| 공통 규칙 | `shared/rules.md` | 모든 스킬, 첫 제목 바로 아래 |
| 사용하는 도구 표 | `shared/tools/<스킬>.md` | 스크립트·외부 도구를 쓰는 스킬만 (지금 5개) |
| 스킬 목록 | `shared/router.json` + marketplace | `skill-router` |

- 새 스킬을 마켓에 넣으면 **`shared/router.json` 에도 한 줄**(group·says·gives). 빠지면 sync 가 멈춘다.
- 어긋났는지만 보려면 `node sync-shared.mjs --check` (끝 코드 1).
- 출처: Anthropic knowledge-work-plugins 의 영업 2.0 규칙 묶음과 「Tools used」 표, 소상공인 `smb-router` 입구 스킬을 우리 말로 다시 썼다.

## 모션 메뉴판 ⑦ 화면 전환 40 (2026-10-13)

`plugins/motion-menu/demos/m8-screen-transition.html` 은 **생성물**이다. 정본은 `plugins/motion-menu/tools/transitions/engine.js`(전환 하나 = 캔버스 함수 하나)와 menu.json.
```bash
node plugins/motion-menu/tools/transitions/gen.mjs        # engine.js → demos/m8 (그다음 build.mjs)
FFMPEG=<ffmpeg> node plugins/motion-menu/tools/transitions/render.mjs <폴더> video   # 홍보 영상 5편(1080×1920, 8초, 무음)
node plugins/motion-menu/tools/transitions/render.mjs <폴더> sheet                    # 40개 멈춤 확인 한 장
```
갤러리 데모와 홍보 영상이 같은 함수에서 나온다. 한 경로에 감는 방향이 반대인 도형을 넣으면 겹친 곳이 지워진다(코너 와이프에서 밟음) — 도형마다 따로 칠한다.

## 모션 메뉴판 ⑧ 배경 40 (2026-10-13)

⑦과 같은 구조다. `demos/m9-background.html` 은 생성물, 정본은 `plugins/motion-menu/tools/backgrounds/engine.js`(배경 하나 = `BG[id](c,w,h,t,k)`, t 는 초)와 menu.json.
```bash
node plugins/motion-menu/tools/backgrounds/gen.mjs        # engine.js → demos/m9 (그다음 build.mjs)
FFMPEG=<ffmpeg> node plugins/motion-menu/tools/backgrounds/render.mjs <폴더> video   # 홍보 영상 5편(1080×1920, 8초, 무음)
node plugins/motion-menu/tools/backgrounds/render.mjs <폴더> sheet                    # 40개를 0·2·4·6초에서 멈춘 한 장
```
**모든 움직임은 8초에 한 바퀴** 돌아 영상 끝이 처음과 이어진다. 회전은 도형의 대칭각 배수로만 돌린다(바람개비 8날=45°, 만화경 12조각=60°). 색을 정체성에 붙인 겹(터널 등)은 주기 안 바뀜 횟수로 나눠떨어지는 개수로 칠한다(8초에 8겹 지나가면 4색 주기, 3색 주기는 끝에서 색이 튄다).

## 모션 메뉴판 ⑨ 글자 연출 40 (2026-10-13)

⑦·⑧과 같은 구조. `demos/m10-text-motion.html` 은 생성물, 정본은 `plugins/motion-menu/tools/text/engine.js`(`TX[id](c,w,h,t,k)`, 8초 주기)와 menu.json. 명령은 ⑧의 `backgrounds` 를 `text` 로 바꾸면 된다.
글자로 오려 내는 합성(무늬 마스크·리퀴드 필)은 helpers 의 `layer()` 로 따로 그린 판에서 한다. 본 칸에 `source-atop` 을 쓰면 바탕까지 칠해진다. 좁은 칸에서는 `fit()` 으로 글자를 줄인다(영상 칸 272×130 에서 넘치던 것이 여럿이었다).

## 모션 기본기 24 (2026-10-13)

코스가 아니라 흩어진 기본기 24개를 한 결로 다시 그린 홍보용 묶음이다. 정본 `plugins/motion-menu/tools/basics/engine.js`(`BS[id]`), 순서는 `basics/gen.mjs` 의 `ORDER`.
24개 중 16개는 원래 코스의 CSS 데모가 갤러리에 그대로 있고, 이때 새로 넣은 8개(`NEW`: 팝인·버스트·라인 드로·카운트업·셰이프 모프·리퀴드 모션·파티클·임팩트 셰이크)만 `demos/m11-basics.html` 로 나간다. 영상은 `render.mjs` 가 24개 전부로 3편을 굽는다.
⚠️ `render.mjs <폴더> video FEEL` 처럼 묶음 하나만 구우면 파일 번호가 01 부터 매겨진다. 고쳐 굽기만 할 때는 이름을 되돌린다.

## 검증

- 갤러리: headless Chrome 스크린샷으로 실측 확인 (iframe srcdoc 데모가 실제 렌더되는지)
- JSON: `node -e "JSON.parse(...)"` 3파일 (menu / marketplace / plugin)

## UI 메뉴판 갤러리 — 자동 시연·프롬프트·항목 주소 (2026-10-14)

- **자동 시연**: 정본 `plugins/ui-menu/demo-steps.json`(항목 id → 단계 배열). 빌드가 갤러리 iframe 의 srcdoc 에만 시연기(`RUNNER`)를 붙인다. **`components/`·코드 복사에는 안 들어간다.** 화면에 60% 이상 보이는 카드만 돌고, 세 번 돌면 멈추고, 사람이 누르면 그 카드는 다시 안 돈다. 동작 줄이기 설정이면 아예 안 돈다. 위쪽 「자동 시연 끄기」가 브라우저에 기억된다.
- `:hover`·`:active`·`:focus` 는 스크립트로 못 켜서, 시연기가 같은 규칙을 `.uim-hover`·`.uim-active`·`.uim-focus` 로 복제해 켠다. 시연 단계를 고치면 헤드리스로 전부 돌려 본다(선택자가 있는지·화면이 바뀌는지·오류 0).
- **「프롬프트」**: 요청 문장 + 이름·별칭 + 견본 코드 + 적용 지침 5줄(`PROMPT_TAIL`, 끝은 「바꾼 파일 / 확인한 것 / 확인하지 못한 것」). 코드는 클릭 때 카드의 코드 상자에서 가져온다(페이지에 두 번 싣지 않는다).
- **「#」**: 그 항목 주소를 복사한다. 항목 id 가 곧 앵커다(`giting.kr/skills/ui-menu#tabs`). giting 페이지의 다른 id 와 겹치지 않는지 확인했다(2026-10-14).
- ⚠️ `UI_JS` 는 템플릿 문자열 안의 JS 라서 줄바꿈은 `\\n` 으로 두 번 이스케이프한다. 한 번만 쓰면 빌드는 되고 페이지에서 SyntaxError 가 난다(실제로 밟음). 고친 뒤엔 `gallery-core.html` 의 마지막 `<script>` 를 떼어 `node --check`.

## 모션 메뉴판 0.9.0 — 비교·장면표·이징 역할·첫 요청문 (2026-10-14)

- `menu.json` 에 갤러리용 묶음 넷: `compare`(같은 장면을 「느낌으로」 vs 「이름+숫자로」, 8) · `easingRoles`(등장 ease-out · 이동 ease-in-out · 퇴장 ease-in) · `starter`(처음 붙여 넣는 요청문, 끝 줄은 「짧은 판 먼저」) · `scenes`(짧은 정보 영상에서 대본 문장마다 고르는 장면 7과 규칙). 데모는 `demos/m12-compare-scenes.html`(`@cmp-*`·`@scene-*`), **갤러리 전용**이라 `components/` 에는 안 낸다. `compare.item`·`scenes.uses` 가 없는 항목을 가리키면 빌드가 멈춘다.
- 디즈니 12원칙 중 빠져 있던 셋 추가: 오버래핑 액션 · 홀드 · 세컨더리 액션(⑤ 타이밍, 191항목).
- ⛔ **⑨ 글자 연출 40 데모가 전부 안 돌았다(10-13 출하 ~ 10-14 수정)**. 엔진 헬퍼 `fit()`(글자 줄이기)이 데모 러너의 `fit()`(캔버스 크기 맞추기)을 덮어써서 첫 줄에서 예외 → `requestAnimationFrame` 까지 못 갔다. 러너 쪽 이름을 `sizeCanvas` 로 바꿨다(네 gen.mjs 전부). **러너가 쓰는 이름을 헬퍼에 쓰지 않는다.** 그리고 첫 프레임에 `now < t0` 라 `t` 가 음수가 되어 `floor(t/2)%4 = -1` 로 배열을 넘던 것(셰이프 모프)도 러너에서 `Math.max(0, …)` 로 막았다.
- ⭐ 검증 순서: 영상(render.mjs)이 멀쩡해도 갤러리 데모는 다른 러너라 따로 깨진다. 출하 전 **갤러리 `gallery-core.html` 의 iframe 전부를 헤드리스로 열어 예외 0** 을 본다(10-14 실측 213개).
- ⚠️ (0.7.1) 운영에서 자동 시연이 안 돌았다. 갤러리 페이지가 커서 iframe 이 `UI_JS` 보다 먼저 떠 `ready` 메시지를 놓쳤다. 스크립트가 시작할 때 이미 뜬 iframe 을 준비로 치고 `load` 도 듣는다. ⭐ 로컬 file:// 시험은 경쟁 조건을 우연히 통과할 수 있다 → **배포 뒤 운영 주소에서 한 번 더** 본다.

## 모션 메뉴판 0.10.0 — ⑩ 글자 몸짓 24 (2026-10-14)

- ⑨가 단어의 배치와 공간을 다룬다면 ⑩은 글자 하나하나의 몸을 움직인다. `group` VANISH(사라지고 모이기) · SWAY(흔들리기) · PLAY(물리와 소품) · INSIDE(글자 안과 배치), 6개씩. 215항목.
- 정본은 ⑨와 같은 `tools/text/engine.js`(`TX`)다. `gen.mjs` 가 `m10-text-motion.html` 과 `m13-text-body.html` 을 같이 만든다. 색은 `PALETTE_BODY`.
- 영상·확인 시트는 `TEXT_CAT=text-body node plugins/motion-menu/tools/text/render.mjs <폴더> sheet|video`.
- helpers 에 `slots`(한 자씩 놓을 자리)와 `dots`(글자 모양을 점 집합으로, 가루 소멸용)를 더했다. 그래서 ⑨ components 40개도 같이 다시 생성된다(동작은 그대로).
- 아이디어는 외부 글자 연출 모음에서 가져왔고 문구·글자·색·데모는 전부 새로 썼다. 출처는 공개 글에 적지 않는다.

## 모션 메뉴판 0.11.0 — 글자 조합 레시피 10 · 쓰임 태그 · ⑩ 홍보 영상 (2026-10-14)

- `recipes` 에 `kind:"text"` 10개. 데모는 ⑨⑩과 같은 `tools/text/engine.js` 의 `TX['rcp-tx-*']` 이고 `gen.mjs` 가 `m13-text-body.html` 끝에 붙인다. 갤러리는 「조합 레시피(샷 단위)」와 「글자 조합 레시피」 두 섹션으로 나눈다. `combo` 는 menu.json 에 있는 영어 이름만 쓴다.
- 215항목 전부 `mood`(쓰임 두 낱말). 카드 footer 에 「쓰임」으로, llms 에 `- 쓰임:` 으로 나간다.
- `render.mjs` 는 묶음 항목 수가 8 미만이면 줄 높이를 늘려 1080×1920 을 채운다(8이면 예전 그대로).

## UI 메뉴판 0.8.0 — 웹 연출 24 (2026-10-16)

- 코스 셋 추가: ⑨ 스크롤 연출 · ⑩ 마우스 반응 · ⑪ 불러오기·흐름, 8개씩(129항목). 데모 `demos/d4-web-fx.html`, id 는 전부 `fx-` 접두어(기존 항목·giting 페이지 id 와 안 겹치게).
- 새 필드 `touch`(선택): 폰에서는 그 연출이 어떻게 되는지·무엇으로 대신하는지. 카드 footer 「폰에서는」, llms `- 폰에서는:`. 호버·커서 계열 6개에 있다.
- 요청 문장(`ask`)은 전부 「몇 초 · 얼마나 · 무엇이」 숫자를 품는다. 웹 연출은 이름만으로는 결과가 매번 달라진다.
- 스크롤 데모는 iframe 안의 `#sc` 스크롤 상자로 돈다(자동 시연 `scroll` 단계가 그걸 민다). 커서 따라오기·자석 버튼은 마우스가 1.5초 안 움직이면 스스로 원을 그리며 시연한다(시연기는 mousemove 를 못 쏜다).
- ui-menu 에 이미 있는 무한 스크롤은 겹쳐서 빼고 타이핑 효과를 넣었다. 아이디어는 외부 연출 모음에서 가져왔고 문구·데모는 전부 새로 썼다. 출처는 공개 글에 적지 않는다.

## 메뉴판 스토어 내보내기 (2026-10-16)

- `GITING_SITE_DIR` 이 있으면 build.mjs 끝에서 여덟 사전을 한 모양으로 모아 `menu-index.json`(538항목: 사전 · 코스 · 이름 · 별칭 · 한 줄 · 요청 문장 · 쓰임 · 구분 · 폰에서는 · 사전별 추가 칸)과 실물 데모 `c/<사전>/<id>.html`(412개)을 낸다. giting 의 `site/menu.mjs` 가 이걸로 giting.kr/menu 를 만든다.
- ui-menu 데모는 자동 시연기(`RUNNER`)를 붙여 낸다. 상세 페이지가 `{uim:'play'}` 를 보내고 `done` 이 오면 다시 튼다.
- 웹폰트 사전은 요청 문장(`ask`)이 없어 「글꼴을 ○○ 자리에 써줘 …」를 만들어 넣는다.


## 모션 메뉴판 0.12.0 · ⑪ 화면 전환 2 · 23 (2026-10-17)

- ⑦이 색면·도형·패널 같은 평면 그래픽이라 기본 전환(푸시·슬라이드·딥 투 블랙)과 실물 같은 전환(큐브·페이지 컬·유리·종이·TV)이 비어 있었다. 그 23개. `group` BASIC 5 · FADE 4 · SPIN 4 · SOLID 5 · OBJECT 5. 238항목.
- 정본은 ⑦과 같은 `tools/transitions/engine.js`(`TR`)다. `gen.mjs` 가 `m8-screen-transition.html` 과 `m14-screen-transition-2.html` 을 같이 만든다. 색은 `PALETTE2`, 코스 표는 `COURSES`.
- 영상·확인 시트는 `TR_CAT=screen-transition-2 node plugins/motion-menu/tools/transitions/render.mjs <폴더> sheet|video`.
- helpers 에 `snap`(장면을 그려 픽셀로 떼어 두기) · `face`(떼어 둔 장면을 세로/가로축 3D 판으로, 세로줄 56개로 원근) · `clipHalf`(반평면 자르기, 페이지 컬 접힌 면)를 더했다. 그래서 ⑦ components 40개도 같이 다시 생성된다(동작은 그대로).
- `face` 는 화면에서 왼쪽에서 오른쪽으로 늘어나는 줄만 그린다(뒷면 숨김). 판 방향(`Dir`)을 거꾸로 주면 통째로 안 보인다. 큐브 옆면은 `[0, 1]`.
- 캔버스 `filter: blur()` 는 사파리에서 안 먹어서 쓰지 않는다. 스핀 블러는 같은 판을 조금씩 돌려 여러 번 겹쳐 흐림을 낸다.
- 아이디어는 외부 화면 전환 모음에서 가져왔고 문구·데모는 전부 새로 썼다. 출처는 공개 글에 적지 않는다.

## 도구 경로 · sheet-io 인코딩 (2026-10-18)

- 도구(`scripts/`)가 있는 스킬 다섯(design-brief · hangul-wrap · pixel-run · product-shot · sheet-io)은 도구가 **플러그인 폴더**에 있는데 SKILL.md 는 `scripts/…` 로만 적어, 스킬 폴더 기준으로 찾다가 못 찾았다. Haiku 는 못 찾으면 알리지 않고 손으로 대신했다(sheet-io 에서 `cat >>`). 정본 `shared/tools/<이름>.md` 끝에 「도구 위치」 한 줄을 넣었다. 계산식(`../../`)보다 **예시 경로**가 잘 먹었다(계산식 5/6 → 예시 9/9).
- `sheet.py append` 가 늘 UTF-8 로 붙여 cp949 엑셀 CSV 에 깨진 줄을 남겼다. 이제 원본 인코딩·줄바꿈에 맞추고, 그 인코딩에 없는 글자는 거절한다.
- 남은 것: 스킬을 켜 둬도 Haiku·Sonnet 이 「members.csv 에 회원 추가」를 스킬 일로 알아보지 못했다(자동 호출 0/9). 이름으로 부르면 된다.

## 모션 메뉴판 0.13.0 · ⑫ 데이터 모션 24 (2026-10-19)

- 숫자와 차트가 움직이는 연출. `group` NUMBER · BAR · LINE · SHARE, 6개씩. 262항목. 시리즈 ⑫⑬⑭(데이터 · 아이콘·로고 · 소셜 오버레이)의 첫 번째.
- 정본 `plugins/motion-menu/tools/data/engine.js`(`DM[id](c,w,h,t,k)`, 8초 주기: 0.4초 비고 → 들어와 머물고 → 7.2~8초 사라짐). `gen.mjs` 가 `demos/m15-data-motion.html`, `render.mjs` 가 영상 4편(6줄)·확인 시트를 만든다. 명령은 ⑧의 `backgrounds` 를 `data` 로.
- 숫자는 전부 지어낸 예시 값이다. 요청 문장(`ask`)에는 실제 값과 초를 넣는다.
- 칸 비율이 약 2:1(갤러리 170px·영상 칸)이라 가로로 늘어놓는 것(증감 배지 · 아이콘 줄 · 크기 비교)은 `measureText` 와 `w` 로 맞춘다. 처음엔 숫자 앞이 잘리고 아이콘이 칸을 넘었다.
- 기본기의 카운트업 · 라인 드로와 겹치지 않게 오도미터 · 라인 차트 드로로 이름과 `vs` 를 갈랐다.

## 모션 메뉴판 0.14.0 · ⑬ 아이콘·로고 몸짓 24 (2026-10-19)

- 시리즈 두 번째. `group` DRAW · POP · REACT · LOOP, 6개씩. 286항목.
- 정본 `plugins/motion-menu/tools/icons/engine.js`(`IC`). `gen.mjs` → `demos/m16-icon-motion.html`, `render.mjs` 영상 4편. gen·render 는 ⑫ 것을 그대로 복제했다(머리말·코스 이름만 다르다).
- 로고는 엔진 안에서 만든 추상 도형(`MARK_OUT` 둥근 사각 + `MARK_IN` 번개)이다. 남의 로고를 쓰지 않는다.
- LOOP 묶음은 8초 안에서 나눠떨어지는 주기만 쓴다(1 · 1.6 · 2 · 4 · 8/3초). 나머지 셋은 ⑫처럼 들어와 머물고 7.2초부터 사라진다.
- ⭐ 공용 값·도우미는 반드시 `/*@helpers*/` 안에 둔다. ⑫에서 바깥에 두었다가 데모 10개가 갤러리에서 ReferenceError 로 멈췄다(영상은 엔진 파일을 통째로 실어 멀쩡했다).
- `back()` 이징은 0 근처에서 아주 작은 음수가 나온다. `arc` 반지름에 쓰면 IndexSizeError 로 멈추니 `Math.max(0, …)` 로 감싼다.

## 모션 메뉴판 0.15.0 · ⑭ 소셜 오버레이 24 (2026-10-19)

- 시리즈 세 번째(마지막). `group` FOLLOW · CHAT · ALERT · FRAME, 6개씩. 310항목.
- 정본 `plugins/motion-menu/tools/social/engine.js`(`SO`). `gen.mjs` → `demos/m17-social-overlay.html`, `render.mjs` 영상 4편.
- 영상 위에 얹는 요소라 바탕을 흐린 「영상 자리」(`scene`: 그라디언트 + 빛 원 둘)로 칠한다. 사진을 쓰지 않는다. 계정 이름·숫자는 지어낸 예시다.
- ⛔ **엔진 도우미 이름이 render 페이지 함수와 겹치면 영상에서 조용히 덮어써진다.** render 페이지는 `txt` · `pill` · `cell` · `draw` · `sheet` 를 전역에 둔다. ⑭에서 `txt`·`pill` 을 써서 영상 시트의 글자가 전부 사라졌다(갤러리 데모는 멀쩡). 엔진 쪽을 `say` · `sayW` · `chip` 으로 바꿨다. 갤러리 러너의 `sizeCanvas` · `frame` · `F` · `cv` · `c` · `K` 도 같은 이유로 피한다.

## 모션 메뉴판 0.16.0 · ⑮ 그래픽 기법 24 (2026-10-19)

- 오너가 가져온 남의 치트시트(모션 그래픽 기법 24) 이미지에서 출발했다. 24개 중 17개는 이미 있었고(같은 이름이거나 거의 같은 동작), 빠진 7개(모션 패스·핑퐁 루프·리피터·라인 보일·블라인드·픽셀레이트·분해도)를 중심으로 같은 결의 기법을 우리가 더 골라 24개로 만들었다. ⛔ 그쪽 묶음·설명·그림은 베끼지 않는다. 기법 이름만 일반 용어다.
- `group` PATH · REPEAT · SWITCH · SHOW, 6개씩. 334항목.
- 정본 `plugins/motion-menu/tools/craft/engine.js`(`GC`). `gen.mjs` → `demos/m18-graphic-craft.html`, `render.mjs` 영상 4편.
- SWITCH 는 낮(`sceneDay`)에서 밤(`sceneNight`)으로 2.2~3.6초에 넘어간다. 전환이 끝나면 밤 장면을 통째로 다시 그린다. 띠·조각 clip 을 남겨 두면 이음매에 가는 줄이 보인다(블라인드·스캔·퍼즐에서 실제로 보였다).
- SHOW 의 물건은 엔진에서 만든 버거·상자·카드·블록이다. 아이소 블록은 x+y, 그다음 z 순서로 그린다.

## 모션 메뉴판 0.18.0 · ⑰ 오프닝 타이틀 24 (2026-10-22)

- 오너가 가져온 남의 「오프닝 48선」 이미지에서 출발했다. 48개 중 절반쯤은 이미 있었고(글리치·큐브·터널·스탬프 등), 빠진 쪽(스캔·HUD·홀로그램·파티클 모임·콜라주 등)을 중심으로 24개를 우리가 골랐다. ⛔ 그쪽 묶음·문구·그림은 베끼지 않는다. 제목 글자도 전부 새로 정했다.
- 다른 코스가 움직임 하나라면 ⑰은 배경·소품·제목이 맞물린 **완성 장면**이다. `group` SCAN · CINEMA · CRAFT · MOVE, 6개씩. 374항목, 17코스.
- 정본 `plugins/motion-menu/tools/opening/engine.js`(`OP`). `gen.mjs` → `demos/m20-opening-title.html`. `render.mjs` 는 영상 4편(video) · 확인 시트(sheet) · **스레드용 한 편(grid, 1080×1350, 8칸×3장, 15초)**.
- ⛔ 함수 밖 전역(`PIX`·`SIG` 같은 캐시)은 반드시 helpers 안에 둔다. gen 은 helpers 와 함수 본문만 데모에 싣는다(영상은 엔진 전체를 싣는 바람에 통과했고, 갤러리에서만 ReferenceError 두 개가 났다).
- ⛔ helpers 이름이 render 페이지 이름과 겹치면 안 된다(`MONO` 가 글꼴 문자열과 겹쳐 고정폭 글자 함수를 `MFONT` 로 바꿨다).
- giting 사이트 산출은 **깨끗한 giting worktree(origin/main)** 로 `GITING_SITE_DIR` 를 돌린다. 오너 작업 브랜치에 그대로 돌리면 다른 스킬 산출물까지 덮어쓴다.

## 카드 줄이기 · ui-menu 0.9.0 · design-brief 0.4.0 (2026-10-22)

- AI 가 화면을 전부 카드로 감싸는 버릇을 이름으로 고치게 했다. ui-menu ① 페이지 뼈대에 `whitespace-group`(여백으로 묶기)·`featured-card`(피처 카드) 2항목(131), `card` 에 `vs`.
- `slop_check.mjs` G6 카드 남용: 둥근 모서리(6px 이상, 알약 제외)에 테두리나 그림자를 두른 클래스를 찾아 HTML 에서 그 클래스 요소를 센다. 8개 이상이거나(클래스 4종 이상이면서 5개 이상) 걸림. 버튼·칩·배지·아바타 이름은 뺀다. 일부러 카드 격자(상품 목록·벤토)면 `--allow 'g6'`.
- ⚠️ 정적 검사라 스크립트가 만드는 요소는 못 센다. ui-menu·landing-menu 컴포넌트 몇 개로 거짓 걸림이 없는 것만 확인했다.

## 랜딩 메뉴판 0.2.2 · 요청은 원하는 쪽만 (2026-10-19)

- 「제너릭 회피」 규칙이 「⛔ 다크 배경 … 쓰지 않는다」 부정문이었다. 실측(같은 앱 랜딩, Haiku·Sonnet 3번씩): 「…다크 배경 쓰지 말고 흰 지면에」 6/6 다크, 「바탕은 흰색 #FFFFFF, 글자는 먹색」 0/6, 그냥 「랜딩 만들어줘」 0/6. 지금 모델의 기본값은 다크가 아니었다.
- 규칙(SKILL.md·`antiGeneric`)과 부정문 요청 4개(hero-text·hero-shot·stat-strip·footer)를 원하는 쪽을 값으로 적는 문장으로 바꿨다. 갤러리의 ⛔ 표시도 ★ 로.
- ⭐ 요청 문장(`ask`)에 「~말고」「금지」를 쓰지 않는다. 피할 것은 원하는 값으로 바꿔 적는다. 예시 숫자도 넣지 않는다(AI 가 지어낸 값으로 베낀다).

## 모션 메뉴판 0.17.0: ⑯ 배경 2 · 항목 7 · 세기 셋 (2026-10-21)

- 외부 모션 모음과 대조해 우리에게 없던 것 중 「입력 없이 저절로 도는 것」만 16개 넣었다(350항목). ⑯ 배경 2 9개(FLOW 6 · DEPTH 3)는 ⑧과 같은 `tools/backgrounds/engine.js` 의 `BG` 에 두고 `gen.mjs` 가 `demos/m19-background-2.html` 도 같이 만든다. 영상은 `BG_CAT=background-2 node …/backgrounds/render.mjs <폴더> sheet|video`.
- 나머지 7개는 있던 코스에 넣었다: ⑩ 흐림에서 선명하게 · 물속 일렁임(`TX`) / ⑫ 점 지구본 · 물 게이지(`DM`) / ⑭ 아일랜드 알림(`SO`) / ⑥ 필름 그레인 · 벡터 CRT(`m7-effects.html` 손으로 쓴 캔버스). 항목은 menu.json 에서 자기 group 의 끝에 끼워 번호 구간이 이어지게 했다(catNote 번호도 같이 고침).
- 처음 고른 20개 중 4개는 이미 있는 항목과 같아서 뺐다: 잔상 출렁 글자=텍스트 에코 · 글자 속 흐르는 선=무늬 마스크 · 선 물결 면=물결선 · 큐브 바닥=아이소메트릭 격자. **넣기 전에 `oneliner` 로 겹침을 먼저 본다.**
- `intensity`(세기 셋): 거리·배율·흔들림·흐림·부서짐·빛마다 약·보통·강 숫자. 메뉴판이 정한 기준값이다(업계 표준이라고 쓰지 않는다). 갤러리 「이징」 상자 아래에 표와 비교 데모 3개(`@int-*`, m12, 갤러리 전용), llms 에 한 절. 공식(`formula.pattern`) 끝에 `+ [세기]`.
- ⚠️ 텍스트 엔진 helpers 에는 `lerpC` 가 없다(배경 엔진에만 있다). 다른 엔진에서 함수를 옮겨 쓰면 갤러리에서만 ReferenceError 가 난다.
- ⚠️ 흐림은 캔버스 `filter` 대신 `shadowBlur` 로 낸다(칸 밖에 글자를 그리고 그림자만 보낸다). `shadowOffsetX` 는 변환을 안 받으니 `scale(z)` 아래에서는 `FAR * 화면배율 * z` 로 맞춘다. 안 맞추면 흐린 글자가 옆으로 밀려 겹친다(실제로 밟음).

## 모션 메뉴판 갤러리 — 상세페이지 결 인트로 (2026-10-23)

- 갤러리 맨 위에 판 다섯(소개 · 말 한 줄 차이 · 시키는 공식 · 이런 말엔 이런 장면 · 처음 요청문). 문법은 @sequence_ai 자막 모션 팩 상세페이지에서 가져왔다: 칩 라벨 → 가운데 두 줄 제목(형광 한 단어) → 회색 설명 한두 줄 → 실물 → **말풍선 = 사람이 칠 문장(복사 단추)**.
- 실물은 사전 데모를 그대로 쓴다(`MO_HERO` 셋 · `compare.list[0]` · `scenes`). 판 전용 데모를 따로 그리지 않는다. `MO_HERO` 가 없는 id 를 가리키면 빌드가 멈춘다.
- 옛 맨 위 「AI한테 시키는 공식」 상자와 「처음 한 번에 붙여 넣는 요청문」 상자는 판으로 옮겨서 지웠다. `menu.json` 은 그대로.
- 갤러리 전용이라 `components/`·플러그인 버전은 안 바뀐다.

## 웹폰트 사전 0.2.0 · 한글 제목·손글씨 10 · 짝 12 (2026-10-23)

- 07 한글 제목·손글씨 10종(Black Han Sans · Do Hyeon · Jua · Paperlogy · Bagel Fat One · Song Myung · Hahmlet · Nanum Brush Script · Nanum Pen Script · Gaegu). 새 칸 `familyKo` · `weightNums`(실제로 있는 두께, 카드 두께 줄과 짝 검사가 쓴다) · `licenseUrl` · `checked`(라이선스 확인한 날).
- 짝은 `pairs`(title·sub 의 font id 와 weight · rule · head · subText · ask), 묶음 `pairGroups`, 공통 규칙 `pairRule`. **없는 글꼴 id 나 그 글꼴에 없는 두께를 가리키면 빌드가 멈춘다.** menu-index 에는 `c:'pairs'` 로 나간다.
- Paperlogy 는 Google Fonts 에 없고 저장소에 태그가 없어 커밋을 고정한 jsDelivr 주소로 `<style>@font-face</style>` 를 준다. 갤러리는 `@import` 를 앞에, 이런 `@font-face` 를 뒤에 모은다(`@import` 는 스타일 맨 앞에만 올 수 있다).
- 로드 확인은 스니펫만 넣은 페이지(iframe srcdoc)에서 `document.fonts.load()` 가 실제 face 를 돌려주는지로 봤다. `document.fonts.check()` 는 없는 글꼴 이름에도 true 를 줄 수 있어 그것만으로는 못 믿는다.
- 넣지 않은 것: 여기어때 잘난체 2(배포처 요약은 OFL 인데 같은 곳에 「수정·재배포 금지」, 임베딩 「조건부」라 앞뒤가 안 맞고, 웹폰트 주소가 제작사가 아닌 곳이었다). G마켓 산스(Paperlogy 가 그 한글을 쓴다).
- (같은 날) **UI 메뉴판 갤러리도 같은 결**: 판 다섯(소개 · 시키는 공식 · 이런 말엔 이런 이름 · 화면 조합 레시피 · 스킬 설치). ⭐ 의뢰자 조건 = **원래 있던 요소는 하나도 빼지 않는다** — 옛 단독 갤러리 히어로 문장 · 공식 넷(pattern·bad·good·note) · 별칭→이름·shadcn·구분(vs) · 레시피 · 설치·GitHub·llms 를 판으로 올렸고, 코스 내비 · 자동 시연 · 카드 버튼 넷 · 코스별 표 · 레시피 섹션은 그대로. 옛 공식 상자만 판 2 와 같은 내용이라 뺐다. 인트로 데모에도 `data-demo` 가 붙어 자동 시연이 돈다. 모션 판 공식 설명도 note 전문으로 바꿨다(첫 문장만 잘라 쓰던 것).
- (같은 날, 2차) **갤러리 여덟 전부 판 리듬 인트로**: 판 다섯이 같은 틀로 반복된다는 지적 → landing-menu ⑦ `rhythm` 을 공용 모듈 `ipPanels(name, scope, vars, panels)` 로 옮겨 여덟 갤러리가 같이 쓴다. 판 꼴 `center`(첫 판만) · `split` · `wide` · `stack` · `band`(어두운 띠), 바탕 `pale`/`white`/`dark`. ⭐ **빌드가 리듬을 지킨다** — 같은 꼴 연달아 · 가운데가 첫 판이 아님 · 같은 바탕 연달아면 `process.exit(1)`. 원래 맨 위에 있던 것(공식 상자 · font 로더 상자 · app 모바일 안내 · landing 공식+antiGeneric)은 판으로 옮겼고 지우지 않았다. 판 전용 데모는 없다 — 사전 데모·카드를 그대로 쓴다. 판 CSS 는 `--ip-*` 변수로 스코프마다 색을 받는다(giting 테마 스코프는 `IP_VARS_THEME`).

## 모션 메뉴판 0.19.0 · 손잡이 (2026-10-25)

- ⑤ 타이밍 코스 9개(오버슈트·안티시페이션·스태거·BPM 비트 싱크·팔로 스루·오버래핑 액션·홀드·팝인·리퀴드 모션)에 손잡이를 붙였다. 갤러리 카드에서 값을 바꾸면 **데모가 그 값 그대로 움직이고 요청 문장의 숫자도 바뀐다**(바뀐 자리 강조 · 「문장」 복사도 바뀐 문장). 아이디어는 React Bits 의 데모 옆 조절 패널에서 가져왔고, 우리는 코드 대신 문장을 바꾼다.
- 정본: menu.json 의 `knobs`(k·label·min·max·step·v·unit)와 `askT`(문장 틀, `{k}` · 한글 수는 `{k:ko}`). 빌드가 막는 것: 처음 값으로 채운 틀 ≠ `ask` · 틀에 없는 손잡이 · 손잡이 없는 자리 · 처음 값이 범위 밖.
- 데모 정본 `plugins/motion-menu/tools/knobs/engine.js`(`KN[id] = { still, F(c,w,h,t,V,k) }`), `gen.mjs` → `demos/m21-knobs.html`(생성물). 처음 값은 menu.json 에서 가져온다. 갤러리는 iframe 에 `{mok:{키:값}}` 을 보내고 데모는 처음부터 다시 돈다. iframe 이 늦게 뜨면 `load` 때 다시 보낸다.
- ⭐ **문장에 적힌 값이 그림에서도 그 값이어야 한다.** 오버슈트·팝인은 이즈 아웃 백의 최고점이 적힌 배율이 되는 계수를 풀어서 쓴다(`solveS`). 옛 데모 일부는 문장(0.1초 간격·110%)과 실제 움직임(0.12초·cubic-bezier)이 달랐다.
- 옛 데모 7개는 m3·m6 에서 지웠고, 팝인·리퀴드 모션은 `basics/gen.mjs` 가 손잡이 항목을 건너뛴다(영상은 그대로 `BS`). **데모 마커가 두 파일에 겹치면 빌드가 멈춘다**(전에는 뒤 파일이 조용히 덮어썼다).
- 데모 높이는 240(220 이면 캡션까지 넘쳐 iframe 안에 스크롤바가 생긴다).
- 남은 것: giting.kr/menu 스토어(menu-index)에는 아직 손잡이가 없다.

## 모션 메뉴판 0.20.0 · ⑱ 숫자 연출 16 (2026-10-25)

- 일본 쪽 「숫자 연출 48」 캐러셀에서 출발했다. 40개 중 절반쯤은 ⑫ 데이터 모션·글자·아이콘 코스에 이미 있었고, 없던 쪽(쇼핑·게임·계기)만 16개로 골랐다. ⛔ 그쪽 문구·그림·숫자는 쓰지 않는다.
- `group` SHOP 4 · GAME 6 · METER 6. **16개 전부 손잡이**(`knobs`·`askT`). 390항목, 18코스.
- 데모 정본 `plugins/motion-menu/tools/numbers/engine.js`(`KN`, 손잡이 엔진과 같은 계약). `tools/knobs/gen.mjs` 가 두 엔진을 읽어 코스별로 `demos/m21-knobs.html`(⑤) · `demos/m22-number-motion.html`(⑱)을 낸다. 코스→파일은 gen 의 `OUT`.
- 문장 틀 필터에 `{k:c}`(쉼표 금액)를 더했다. 손잡이 옆 숫자도 1,000 이상이면 쉼표.
- ⭐ **숫자 바로 뒤에 조사를 두지 않는다.** 값이 바뀌면 「2026을」이 「2022을」이 된다. 「값은 {val}.」·「최고 기록({best:c})을」처럼 조사가 숫자에 안 붙게 쓴다.
- 홍보 영상 `tools/numbers/render.mjs <폴더> video|sheet|covers` — 묶음 셋(SHOP 4 · GAME 6 · METER 6), 1080×1920 8초 무음. 데모는 400 폭 논리 크기로 그려 칸에 맞춰 늘린다(엔진 글자 크기가 그 기준). 줄마다 「하던 말 → 이름 · 손잡이 처음 값」. 이 맥은 ffmpeg 가 없어 `FFMPEG=insol-partner/오월의개발자/tools/owol-motion/ffmpeg-shim.sh`(AVFoundation 인코딩)로 굽는다. ⚠️ 데모 주기가 8초 배수가 아니라 영상 끝과 처음이 이어지지는 않는다.

## 캐러셀 메뉴판 0.1.0 · carousel-menu (2026-10-26)

- 인스타 캐러셀·카드뉴스를 「장마다 무슨 꼴로, 어떤 순서로」 시키는 사전. 4코스(표지 4 · 본문 장 11 · 끝 장 4 · 장치 5) 24항목 + 6장 레시피 4(큐레이션 · 꿀팁 · 비교 · 시리즈).
- 출발점은 외부 무료 자료(프롬프트로 캐러셀 6장 만들기, 노션 한 장). 그쪽 문구·디자인은 쓰지 않았고, 장 꼴에 이름을 붙이고 견본·요청 문장·레시피를 우리가 새로 짰다. 출처는 공개 글에 적지 않는다.
- 견본 정본 `plugins/carousel-menu/tools/gen.mjs`(장 그림 `S[id]`) → `demos/slides.html`(생성물). 1080×1350 을 360×450 으로 그린다. 색·글꼴은 예시, 장소·숫자는 「예시」 표시.
- 빌드가 막는 것: 데모 없는 항목 · 마커 중복 · 레시피가 없는 항목을 가리킴 · **레시피에 같은 꼴 연달아**.
- 견본 24장 넘침 0(헤드리스, 장 밖으로 나간 요소 검사). giting 사이트 페이지 `content/skills/carousel-menu.md` + 썸네일.

## 모션 메뉴판 0.21.0 · ⑲ 도식 모션 24 (2026-10-27)

- 오너가 가져온 남의 「図解アニメ48選」 캐러셀에서 출발했다. 48개 중 차트·숫자 쪽(막대·원·KPI·카운트업 등)은 ⑫·⑱에 이미 있었고, 도식 쪽(흐름·구조·비교·짚기)에서 24개를 골랐다. ⛔ 그쪽 문구·그림·숫자는 쓰지 않는다. 칸 안 글자는 전부 새로 정한 예시다.
- `group` FLOW · STRUCTURE · COMPARE · CALLOUT, 6개씩. 414항목, 19코스.
- 정본 `plugins/motion-menu/tools/diagram/engine.js`(`DG`, ⑰ 오프닝과 같은 계약 `(c,w,h,t,k)`, 8초 주기·7.2초부터 사라짐). `gen.mjs` → `demos/m23-diagram.html`. `render.mjs <폴더> video|sheet|covers|grid` 는 ⑰ 렌더러를 그대로 옮겼다.
- 넣기 전에 겹침을 봤다: 형광펜(⑨)·돋보기(⑩)·말풍선 톡(⑭)·전/후 라벨(⑭)·분해도·확대 인셋·레이어 넘기기(⑮)·크기 비교(⑫)는 이미 있어서 빼고, 가까운 것은 `vs` 로 갈랐다.
- `ask` 는 [대괄호] 자리에 실제 단계·이름을 넣게 썼다. 예시 값은 문장에 넣지 않는다(초와 개수만).

## 자막 싱크 0.1.0 · caption-sync (2026-10-28)

- 스레드 답글(「자막 싱크는 위치를 말로 설명하기 어렵다」)에서 나왔다. 메뉴판이 아니라 **재고 고치는 도구**로 만들었다: `plugins/caption-sync/scripts/capsync.mjs`(의존성 0) + SKILL.md(재료 → 재기 → 기계 교정 → 글 줄이기 → 다시 재기) + 말로 시킬 때 쓰는 이름 15.
- 기준은 넷플릭스 공개 문서 셋(Korean Timed Text Style Guide · General Requirements · Subtitle Timing Guidelines)의 숫자만. `shorts` 프로필(한 줄 14자·1줄·최대 4초·꼬리 0.3초)은 **우리가 정한 값**이라고 문서·코드 둘 다 적었다. 읽기 속도의 글자 셈(라틴·공백 0.5)도 우리 선택.
- 고치는 순서가 결과를 바꾼다: 전체 밀기 → 글 표기 → 줄 → 들어오는 점(말 먼저, 컷이 이긴다) → 나가는 점(꼬리·최소·읽기 속도·컷 앞) → 틈 → 가림 → 프레임 맞춤. **들어오는 점은 전부 먼저 고친 뒤 나가는 점**을 고친다(한 바퀴에 하면 다음 자막의 옛 시작으로 끝을 자른다).
- ⚠️ 컷 시각은 읽을 때 프레임에 놓는다. 소수 초 컷(22.057)을 그대로 두면 컷에 맞춘 자막을 「안 맞췄다」고 세고 컷 앞 2프레임이 1프레임 어긋난다(실측이 잡았다).
- ⚠️ 고친 파일은 모든 시각이 프레임 위에 있다. 바꾼 것만 맞추면 틈 셈이 반 프레임씩 어긋나 「붙일 틈」이 되살아난다. **다시 돌리면 바뀌는 것 0** 을 확인한다.
- 나눈 조각이 최소 노출보다 짧아지면 나누지 않는다(쇼츠에서 0.3초 자막이 쏟아졌다). 글을 줄일 자막이라 3단계로 넘긴다.
- ffmpeg 로 컷·말 구간 뽑는 두 줄은 이 맥에 ffmpeg 가 없어 **돌려 보지 못했다**고 SKILL.md 에 적었다.
- 실측 `plugins/caption-sync/eval/`: 가짜 녹음(대본에 단어 시각을 붙인 것)으로 Haiku·Sonnet 각 3번. 스킬 조건은 「caption-sync 스킬로 해줘」를 붙였다(안 붙이면 Haiku 가 안 꺼냈다). 채점 도구가 스킬 도구와 같다는 한계를 eval/README 에 적었다.
