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

## 검증

- 갤러리: headless Chrome 스크린샷으로 실측 확인 (iframe srcdoc 데모가 실제 렌더되는지)
- JSON: `node -e "JSON.parse(...)"` 3파일 (menu / marketplace / plugin)
