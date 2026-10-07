같은 내용, CSS 만 다른 두 장.

- `before.html`: 줄바꿈 규칙 없음. 카드 본문엔 AI 가 넘침을 고치겠다며 넣은 `word-break: break-all`.
- `after.html`: SKILL.md 의 자리별 처방.

```sh
node ../scripts/wrapcheck.mjs before.html 360,390   # 쪼개짐 11 · 넘침 2 · 끝 코드 1
node ../scripts/wrapcheck.mjs after.html 360,390    # 쪼개짐 0 · 넘침 0 · 끝 코드 0
```
