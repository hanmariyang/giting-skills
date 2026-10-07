# hangul-wrap

한글이 어절 중간에서 꺾이는 자리를 **실제 브라우저로 재서** 찾고, 자리별로 고친 뒤 다시 잰다.

```
/plugin marketplace add hanmariyang/giting-skills
/plugin install hangul-wrap@giting
```

검사기만 따로 써도 된다. 의존성 없음, Node 22 이상과 크롬 계열 브라우저만 있으면 된다.

```sh
node plugins/hangul-wrap/scripts/wrapcheck.mjs index.html            # 390 · 768 · 1280
node plugins/hangul-wrap/scripts/wrapcheck.mjs https://example.com 360,390 --json
```

| 표시 | 뜻 |
|---|---|
| ✂ 쪼개짐 | 어절이 띄어쓰기 없이 두 줄로 갈림 (`간단/한`) |
| ⛔ 넘침 | 글자가 상자를 뚫음 · 페이지가 옆으로 밀림 |
| · 외톨이 | 마지막 줄에 한두 글자만 남음 (알리기만) |

쪼개짐이나 넘침이 있으면 끝 코드 1 이라 배포 앞 검사에 걸 수 있다.

## 실측

`examples/` 의 같은 페이지, 360·390px.

| | 쪼개짐 | 넘침 |
|---|---|---|
| `before.html` (규칙 없음 + 카드에 `break-all`) | 11 | 2 |
| `after.html` (자리별 처방) | 0 | 0 |

giting.kr 에도 걸었다. 매거진 1호 34 → 0, 2호 52 → 0, 다른 화면에 새 넘침 0.

처방 표와 하지 말 것은 [SKILL.md](skills/hangul-wrap/SKILL.md).
