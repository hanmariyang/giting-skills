| 도구 | 쓰는 곳 | 꼭 필요? | 없으면 |
|---|---|---|---|
| Node 22 이상 + 크롬 계열 브라우저 | `scripts/site_tokens.mjs` 로 좋아하는 사이트를 재서 DESIGN.md 초안 만들기 | 아니오 | 캡처를 받아 `extract_palette.py` 로 색만 뽑고, 글꼴 · 둥글기 · 간격은 「재지 않았다」고 적는다 |
| Python 3 + Pillow | `scripts/extract_palette.py` 로 이미지에서 색 뽑기 | 아니오 | 사용자가 준 hex 나 스타일 카탈로그로 팔레트를 정하고, 「이미지에서 뽑지 않았다」고 적는다 |
| 레퍼런스(사이트 주소나 이미지) | 팔레트와 글자의 씨앗 | 아니오 | 스타일 카탈로그에서 방향을 고른다 |

**도구 위치.** 위 `scripts/…` 는 사용자 작업 폴더가 아니라 이 플러그인 폴더에 있다. 이 스킬의 기본 폴더 경로 끝에서 `skills/design-brief` 를 떼고 `scripts/` 를 붙이면 된다. 예: 기본 폴더가 `…/design-brief/skills/design-brief` 이면 도구는 `…/design-brief/scripts/` 안에 있다. 이 절대 경로로 부른다. 그래도 못 찾으면 다른 방법으로 넘어가기 전에 「도구를 못 찾았다」고 결과 맨 위에 적는다.
