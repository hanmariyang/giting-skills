# Giting Skills — 마켓플레이스 repo 가이드

Giting 이 검수한 Claude Code 스킬 모음. repo 자체가 마켓플레이스다 (`.claude-plugin/marketplace.json`).

## 구조

```
.claude-plugin/marketplace.json      # 마켓 정의 — 스킬 추가 시 plugins 배열에 등록
plugins/ui-menu/
├── .claude-plugin/plugin.json       # 플러그인 메타
├── menu.json                        # 사전 SSOT (별칭·정의·요청 문장)
├── components/*.html                # 실물 레퍼런스 20종 (자가완결·의존성 0)
└── skills/ui-menu/SKILL.md          # 스킬 본체
build.mjs                            # docs/ 갤러리 + llms.txt 생성 (의존성 0)
docs/                                # GitHub Pages (생성물 — 직접 수정 금지)
```

## 규약

- **SSOT는 menu.json + components/**. `docs/` 는 전부 생성물이므로 `node build.mjs` 로만 갱신하고 직접 수정하지 않는다.
- 컴포넌트 수정·추가 후 반드시 `node build.mjs` 실행 → docs/ 를 같은 커밋에 포함 (Pages 는 docs/ 를 그대로 서빙).
- 컴포넌트 원칙: 자가완결 단일 HTML, 외부 의존성 0, 시맨틱 요소 우선, 접근성 최소선(aria·focus-visible·prefers-reduced-motion).
- 새 스킬 추가: `plugins/<name>/` 생성 + marketplace.json 등재 + README 목록 갱신. 이름은 `기능-명사` 소문자 케밥 (제품형 이름 금지).
- 등재는 실측 검수를 통과한 것만 (Giting 정체성). 외부 접수 없음.
- 브랜치: main 직접 푸시 금지, develop → PR.

## 검증

- 갤러리: headless Chrome 스크린샷으로 실측 확인 (iframe srcdoc 데모가 실제 렌더되는지)
- JSON: `node -e "JSON.parse(...)"` 3파일 (menu / marketplace / plugin)
