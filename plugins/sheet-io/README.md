# sheet-io

Use a spreadsheet (local CSV or a **public Google Sheet**) as a data source/sink from
Claude Code, without wrecking it or blowing the token budget. Part of
[Giting Skills](https://github.com/hanmariyang/giting-skills). MIT. Standard library only.

A spreadsheet + AI fails in three ways; this skill prevents each:

1. **Token blowup** — pasting the whole sheet into the model → `inspect` gives schema + sample + stats instead.
2. **Type/encoding corruption** — `007` → `7`, phone → scientific notation, cp949 mojibake, formulas overwritten → identifier columns stay **text**, encoding fallback, no formula round-trip.
3. **Blind overwrite** — rewriting the whole sheet → **append/targeted only**.

## Use it

```sh
python3 scripts/sheet.py inspect data.csv
python3 scripts/sheet.py inspect "https://docs.google.com/spreadsheets/d/<id>/edit#gid=0"
python3 scripts/sheet.py get data.csv --where status=active --cols name,email --limit 20
python3 scripts/sheet.py append data.csv --row "name=Kim,code=007,phone=01012345678"
```

A **public Google Sheet** (File > Share > Anyone with the link, Viewer) is read through its
CSV export URL, so there are no credentials to set up. XLSX and private-Sheet writeback are
optional paths (openpyxl / gspread + a service account), documented in `SKILL.md` but not
required by the core.

## Install

```
/plugin marketplace add hanmariyang/giting-skills
/plugin install sheet-io@giting
```
