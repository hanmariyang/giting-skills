# flow-menu · 흐름 메뉴판

「결제 화면 만들어줘」를 **장 단위 계획으로** 바꿔 주는 사전.

- 고객이 한 가지 일을 끝내기까지 넘기는 화면을 장마다 이름 붙이고, 장마다 쓰는 부품을 [app-menu](../app-menu) 이름 그대로 적는다.
- 여러 장에 걸친 규칙(「장을 넘겨도 지킬 것」)은 따로 둔다.
- **흐름 셋**: 결제 5장(배송지 · 할인 · 결제 수단 · 확인·동의 · 완료, 퀸잇) · 가입 5장(가입 방법 · 닉네임 · 동네 · 관심사 · 권한, 열품타) · 예약 5장(시간 · 장소 · 고르기 · 옵션 · 확인·결제, 쏘카). 실제 앱 화면에서 순서와 부품을 확인했다.
- 견본은 흐름마다 다섯 화면을 나란히 놓은 자가완결 HTML. 부품마다 `data-menu="<app-menu id>"` 가 붙어 있고 `?show` 를 붙이면 부품 테두리가 보인다.
- 갤러리: https://giting.kr/skills/flow-menu

```
/plugin marketplace add hanmariyang/giting-skills
/plugin install flow-menu@giting
```

## 고치는 법

- 사전 정본은 `menu.json`(`flows[]`: 장 · 부품 id · 한 줄 · 요청 문장 · 장을 넘겨도 지킬 것), 견본 정본은 `demos/<흐름 id>.html`.
- 부품 id 는 `plugins/app-menu/menu.json` 에 있어야 한다. 없으면 빌드가 멈춘다.
- 루트에서 `node build.mjs` → `components/`(생성물).
