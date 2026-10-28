# caption-sync

AI·자동 받아쓰기로 만든 자막(SRT·VTT)을 **넷플릭스 공개 자막 기준으로 재고**, 기계로 되는 것은 고치고,
못 읽을 만큼 빠른 자막은 뜻을 지키며 줄인 뒤 다시 잰다.

```
/plugin marketplace add hanmariyang/giting-skills
/plugin install caption-sync@giting
```

도구만 따로 써도 된다. 의존성 없음, Node 22 이상.

```sh
node plugins/caption-sync/scripts/capsync.mjs 자막.srt --fps 30                                   # 재기만
node plugins/caption-sync/scripts/capsync.mjs 자막.srt --fps 30 --cuts cuts.txt --speech words.json -o 고친.srt
```

재는 것 18: 전체 밀림 · 인 점 · 꼬리 · 최소/최대 노출 · 2프레임 간격 · 붙일 틈 · 컷 맞춤(들어옴·나감) ·
읽기 속도 · 한 줄 길이 · 줄 수 · 줄 나눔 · 줄 끝 문장부호 · 말줄임표 · 겹친 말 표기 · 화면 글자 가림 · 빈 자막.
남은 문제가 있으면 끝 코드 1 이라 올리기 전 검사에 걸 수 있다. 고친 파일을 다시 돌리면 바뀌는 것이 0 이다.

## 실측

같은 받아쓰기 결과로 「자막 만들어줘」, 모델마다 3번. 자세한 조건과 한계는 [eval/README.md](eval/README.md).

| | 공개 기준 어긴 곳 |
|---|---|
| Haiku · 스킬 없이 | 21 · 19 · 25 |
| Haiku · 스킬로 | 1 · 1 · 0 |
| Sonnet · 스킬 없이 | 27 · 29 · 26 |
| Sonnet · 스킬로 | 0 · 0 · 0 |

예시 자막 한 벌(`examples/`)은 41건 → 기계가 고쳐 4건 → 남은 4건은 글을 줄여야 하는 자리.

기준표·고치는 순서·말로 시킬 때 쓰는 이름 15개는 [SKILL.md](skills/caption-sync/SKILL.md).
