---
name: sheet-io
description: "Use a spreadsheet as a data source or sink from Claude Code without wrecking it or blowing the token budget. Works on a local CSV or a PUBLIC Google Sheet (via its CSV export URL, no credentials). Use when the user points at a spreadsheet, a Google Sheets link, or a .csv and wants to read, filter, summarize, or append rows, or asks to 'connect the sheet', '시트 연동', '이 데이터 정리해줘'. Provides a stdlib-only tool (scripts/sheet.py) that inspects schema+sample+stats cheaply, reads only the rows you need, and appends while preserving types (leading zeros, phone numbers), encoding, and existing content."
---

# sheet-io — read and write a spreadsheet without breaking it

A spreadsheet plus an AI fails in three specific ways. This skill is the discipline
plus a stdlib-only tool (`scripts/sheet.py`, no pandas/openpyxl/gspread) that prevents
each. It reads a **local CSV** or a **public Google Sheet** (through its CSV export URL,
so there are no credentials to set up).

## The three disasters, and the rule for each

1. **Token blowup** — pasting a 10,000-row sheet into the model. → **Inspect first**: get columns, row count, per-column type, a small sample, and stats. Never load the whole sheet into context to "understand" it.
2. **Type and encoding corruption** — leading zeros dropped (`007` becomes `7`), phone numbers turned to scientific notation, dates reformatted, Korean `cp949/euc-kr` turned to mojibake, and worst of all **formulas overwritten by their computed values on write**. → Treat identifier-like columns as **text**, decode with an encoding fallback, and never round-trip a formula as a value.
3. **Blind overwrite** — rewriting the whole sheet to change one thing, wiping other columns, formatting, and formulas. → **Append or targeted update only**, by key, never a full rewrite.

## The tool

```sh
# 1) understand it cheaply (do this before anything else)
python3 scripts/sheet.py inspect data.csv
python3 scripts/sheet.py inspect "https://docs.google.com/spreadsheets/d/<id>/edit#gid=0"

# 2) read only what you need
python3 scripts/sheet.py get data.csv --where status=active --cols name,email --limit 20

# 3) append safely (local CSV), types preserved
python3 scripts/sheet.py append data.csv --row "name=Kim,code=007,phone=01012345678"
```

`inspect` infers each column's type and, crucially, marks columns like `007` or a phone
number as **text(id)** so they are never treated as numbers. A single leading-zero value
forces the whole column to text. It prints a sample and per-column stats, not the whole
sheet, so you spend a handful of tokens instead of thousands.

## Connecting a Google Sheet (no credentials)

Paste any Google Sheets URL (`.../spreadsheets/d/<id>/edit#gid=<gid>`); the tool rewrites
it to the CSV export URL and fetches it. The one requirement: the sheet must be shared
**Anyone with the link, Viewer** (File > Share). If it isn't, you get an HTML login page
instead of CSV and the tool tells you exactly that. This is read-only, and needs nothing
installed.

## Workflow the agent should follow

1. `inspect` the source. Read the schema and sample; confirm which columns are identifiers (text), which are numbers/dates.
2. `get` only the rows and columns the task needs. Work from that, not the full dump.
3. To add data, `append` to a local CSV (types preserved). To change existing cells, do a targeted update, never a full rewrite.
4. Report what you read/wrote in the user's terms (rows added, filter used), not raw dumps.

## Honest limits and the optional paths

- **Google Sheets is read-only in the core.** Writing back to a Google Sheet needs auth. The dependency-0 path: export the sheet to CSV, `append`, re-upload. The auth path (optional, not in this tool): a user-provided **service account** + `gspread` (`pip install gspread google-auth`), share the sheet with the service-account email, then write. Set that up yourself; this skill does not ship credentials.
- **XLSX is not in the core** (stdlib can't read it). Optional: `pip install openpyxl`, or just Save As CSV first. Most "연동" tasks only need CSV/Google.
- The tool reads pixels of data, it does not open Excel formulas or charts. If a cell holds a formula, a CSV export gives you its computed value; do not write that back into a formula cell.
- Encoding fallback covers utf-8 (with BOM), cp949, euc-kr. Odd encodings may still need a manual re-save as utf-8.

## QA checklist

- Ran `inspect` before reading the whole thing (token-cheap).
- Identifier columns (codes, phones, zip) stayed **text**, leading zeros intact.
- Wrote by append/targeted update, not a full rewrite; no formula clobbered.
- Google Sheet was shared link-viewer; otherwise fixed the sharing, not forced it.
- Reported rows/filters in plain terms, no raw sheet dump into the reply.
