# Giting Skills — 마켓플레이스 repo 가이드

Giting 이 검수한 Claude Code 스킬 모음. repo 자체가 마켓플레이스다 (`.claude-plugin/marketplace.json`).

## 구조

```
.claude-plugin/marketplace.json      # 마켓 정의 — 스킬 추가 시 plugins 배열에 등록
plugins/ui-menu/
├── .claude-plugin/plugin.json       # 플러그인 메타
├── menu.json                        # 사전 SSOT (8코스 105항목 — 별칭·정의·요청 문장·formula)
├── demos/*.html                     # 데모 프래그먼트 SSOT (<!-- @id h=NNN [full] --> 마커 구분)
├── components/*.html                # 생성물 — 스킬용 자가완결 105종 (빌드가 만들지만 커밋한다: 설치 시 빌드 없음)
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
