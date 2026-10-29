# grid-menu · 그리드 메뉴판

포스터·표지 한 장을 **「세련되게」 대신 그리드 이름으로** 시키게 해 주는 사전.

- **3갈래 24항목**: ①그리드 종류 10(원고 · 단 · 모듈 · 계층 · 기준선 · 겹친 · 3분할 · 사선 · 방사 · 동심원) ②놓는 법 8(칸 묶기 · 가장자리 붙이기 · 초점 고립 · 긴장 배치 · 그리드 깨기 · 크기 대비 · 여백 남기기 · 축 정렬) ③글자 놓기 6(세로 제목 · 사선 제목 · 쌓은 제목 · 쪼갠 제목 · 정보 블록 · 잘린 큰 글자)
- **포스터 레시피 넷**: 전시 · 공연·파티 · 강연·모임 · 공지·오픈
- 견본은 4:5 캔버스(자가완결 HTML). 8초마다 그리드 선이 그려지고 요소가 칸에 앉은 뒤 선이 걷힌다. 「그리드 선」 단추로 자동·켬·끔.
- 갤러리: https://giting.kr/skills/grid-menu

```
/plugin marketplace add hanmariyang/giting-skills
/plugin install grid-menu@giting
```

## 고치는 법

- 사전 정본은 `menu.json`, 그림 정본은 `tools/engine.js`(`GP[id](c,w,h,t,{grid})`, 8초 주기).
- `node plugins/grid-menu/tools/gen.mjs` → `demos/posters.html`(생성물) → 루트에서 `node build.mjs` → `components/`(생성물).
- 홍보 영상(GRID RACK, 24칸)도 같은 `GP` 로 그린다.
