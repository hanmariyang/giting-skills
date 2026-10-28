AI 가 만든 듯한 자막 한 벌과 재료 셋. 30fps 영상이라고 가정한 예시다(진짜 영상은 없다).

- `ai.srt`: 받아쓰기 시각을 그대로 쓴 자막. 전체가 0.22초 늦고, 한 줄에 서른 자가 넘고, 틈이 1~5프레임, 「3 / 분」으로 나뉜 줄, 점 세 개, 줄 끝 마침표, 「-그게」처럼 붙은 겹친 말 표기.
- `cuts.txt`: 컷 시각 넷
- `speech.txt`: 말 구간 「시작 끝」
- `onscreen.txt`: 화면 아래 이름표가 떠 있는 구간
- `fixed.srt`: 아래 명령으로 고친 결과

```sh
node ../scripts/capsync.mjs ai.srt --fps 30 --cuts cuts.txt --speech speech.txt --avoid onscreen.txt              # 41건 · 끝 코드 1
node ../scripts/capsync.mjs ai.srt --fps 30 --cuts cuts.txt --speech speech.txt --avoid onscreen.txt -o fixed.srt # 남은 것 4건
node ../scripts/capsync.mjs fixed.srt --fps 30 --cuts cuts.txt --speech speech.txt --avoid onscreen.txt -o again.srt # 바꾼 것 0건
```

남은 4건(읽기 속도 3 · 최소 노출 1)은 글이 시간보다 길다는 뜻이라 기계가 고치지 않는다. SKILL.md 3단계(글 줄이기·짧은 말 붙이기)의 몫이다.
