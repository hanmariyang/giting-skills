| 도구 | 쓰는 곳 | 꼭 필요? | 없으면 |
|---|---|---|---|
| Python 3 (표준 라이브러리) | `scripts/sheet.py` inspect · get · append | 예 | 파일을 직접 열어 앞부분만 읽고, 타입 보존 검사는 못 했다고 적는다 |
| 공개 Google Sheet 링크 | 구글 시트 읽기 | 아니오 | 로컬 CSV 로 진행한다. 비공개면 CSV 로 내려받아 달라고 한다 |
| openpyxl | `.xlsx` 읽기 | 아니오 | CSV 로 다시 저장해 달라고 한다 |
| gspread + 서비스계정 | 비공개 시트에 쓰기 | 아니오 | CSV 로 내려 append 한 뒤 다시 올리는 길을 안내한다 |
