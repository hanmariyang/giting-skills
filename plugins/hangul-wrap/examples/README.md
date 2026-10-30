같은 내용, CSS 만 다른 두 장.

- `before.html`: 줄바꿈 규칙 없음. 카드 본문엔 AI 가 넘침을 고치겠다며 넣은 `word-break: break-all`.
- `after.html`: SKILL.md 의 자리별 처방.

```sh
node ../scripts/wrapcheck.mjs before.html 360,390   # 쪼개짐 11 · 넘침 2 · 끝 코드 1
node ../scripts/wrapcheck.mjs after.html 360,390    # 쪼개짐 0 · 넘침 0 · 끝 코드 0
```

- `textsize.html`: 글자 키운 상태 시험용. 200% 에서 「장바구니 담기」 버튼 글자가 잘리고, 맨 아래 「약관 전체 보기」는 고정 바에 덮인다(100% 에서도).

```sh
node ../scripts/wrapcheck.mjs textsize.html 390 --text 150,200 --zoom 200   # 버튼 글자 잘림 1 · 안 눌림 4 · 끝 코드 1
```
