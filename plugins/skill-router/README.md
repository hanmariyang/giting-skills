# skill-router

Giting Skills 의 입구. 「어떤 스킬 써야 해?」를 받아 맞는 스킬 많아야 둘로 안내하고, 안 깔려 있으면 설치 명령을 준다.

```
/plugin install skill-router@giting
```

스킬 목록은 손으로 쓰지 않는다. `shared/router.json` 과 마켓 파일에서 `node sync-shared.mjs` 가 만든다. 마켓에 새 스킬이 들어왔는데 `router.json` 에 없으면 빌드가 멈춘다.
