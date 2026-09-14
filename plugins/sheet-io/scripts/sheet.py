#!/usr/bin/env python3
"""
sheet.py — use a spreadsheet (local CSV or a PUBLIC Google Sheet) safely and cheaply.

The deterministic core of the `sheet-io` skill. Python standard library only:
no pandas, no openpyxl, no gspread, no network auth. A public Google Sheet is read
through its CSV export URL, so there are no credentials to set up.

Three jobs, matched to the three ways AI wrecks a spreadsheet:
  inspect  — columns, row count, per-column type, a small sample, and stats.
             Read THIS before touching the data; never paste a whole sheet into the model.
  get      — return only the rows/columns you need (--where, --cols, --limit).
  append   — add rows to a LOCAL CSV while preserving types (leading zeros stay text),
             encoding, and existing content (never a blind rewrite).

Source can be a local .csv path OR a Google Sheets URL (any /spreadsheets/d/<id>/... form);
the Google URL is auto-rewritten to its CSV export. Google is READ-ONLY here (public
sheets); writing back to Google needs auth (see SKILL.md, optional).

Usage:
  python3 sheet.py inspect data.csv [--sample 5]
  python3 sheet.py inspect "https://docs.google.com/spreadsheets/d/<id>/edit#gid=0"
  python3 sheet.py get data.csv --where status=active --cols name,email --limit 20
  python3 sheet.py append data.csv --row "name=Kim,phone=01012345678,code=007"
"""
import argparse
import csv
import io
import json
import re
import sys
import urllib.request

TEXTY = re.compile(r"^-?\d+$")


def resolve(src):
    """A Google Sheets URL -> its CSV export URL. Returns (url_or_path, is_url)."""
    m = re.search(r"docs\.google\.com/spreadsheets/d/([A-Za-z0-9_-]+)", src)
    if m:
        gid = re.search(r"[?&#]gid=(\d+)", src)
        gid = gid.group(1) if gid else "0"
        return f"https://docs.google.com/spreadsheets/d/{m.group(1)}/export?format=csv&gid={gid}", True
    return src, src.startswith("http://") or src.startswith("https://")


def decode(b):
    for enc in ("utf-8-sig", "utf-8", "cp949", "euc-kr"):  # cp949/euc-kr = 한글 시트
        try:
            return b.decode(enc)
        except UnicodeDecodeError:
            continue
    return b.decode("utf-8", "replace")


def load(src):
    url, is_url = resolve(src)
    if is_url:
        req = urllib.request.Request(url, headers={"User-Agent": "sheet-io"})
        raw = urllib.request.urlopen(req, timeout=30).read()
        if b"<html" in raw[:200].lower():
            sys.stderr.write("[FAIL] got an HTML page, not CSV. The Google Sheet is probably not public "
                             "(File > Share > Anyone with the link > Viewer), or it's the wrong gid.\n")
            sys.exit(1)
        text = decode(raw)
    else:
        with open(url, "rb") as f:
            text = decode(f.read())
    rows = list(csv.reader(io.StringIO(text)))
    if not rows:
        sys.stderr.write("[FAIL] empty sheet\n")
        sys.exit(1)
    header, body = rows[0], rows[1:]
    return header, body


def celltype(v):
    if v is None or v == "":
        return "null"
    if TEXTY.match(v):
        # a leading zero means it's an identifier (007, 01012345678), NOT a number.
        return "text(id)" if len(v) > 1 and v[0] == "0" else "int"
    if re.match(r"^-?\d*\.\d+$", v):
        return "float"
    if re.match(r"^\d{4}[-/]\d{1,2}[-/]\d{1,2}", v):
        return "date"
    if v.lower() in ("true", "false"):
        return "bool"
    return "text"


def col_type(values):
    """Dominant non-null type; a single text(id) forces the whole column to text(id)."""
    types = [celltype(v) for v in values if v != ""]
    if not types:
        return "empty"
    if "text(id)" in types:
        return "text(id)"          # protect leading zeros for the whole column
    counts = {}
    for t in types:
        counts[t] = counts.get(t, 0) + 1
    return max(counts, key=lambda k: counts[k])


def inspect(src, sample):
    header, body = load(src)
    print(f"source     : {src}")
    print(f"columns    : {len(header)}  |  rows: {len(body)}")
    print("schema (col : type : nulls : uniques):")
    for i, h in enumerate(header):
        vals = [r[i] if i < len(r) else "" for r in body]
        t = col_type(vals)
        nulls = sum(1 for v in vals if v == "")
        uniq = len(set(v for v in vals if v != ""))
        extra = ""
        if t in ("int", "float"):
            nums = [float(v) for v in vals if v not in ("",) and re.match(r"^-?\d*\.?\d+$", v)]
            if nums:
                extra = f"  range {min(nums):g}..{max(nums):g}"
        elif t.startswith("text") and uniq <= 12:
            tops = sorted(set(v for v in vals if v != ""))[:12]
            extra = "  values: " + ", ".join(tops)
        print(f"  {h!r} : {t} : {nulls} null : {uniq} uniq{extra}")
    print(f"sample (first {min(sample, len(body))} rows):")
    for r in body[:sample]:
        print("  " + json.dumps(dict(zip(header, r)), ensure_ascii=False))
    print("\n# read only what you need next: sheet.py get <src> --where col=val --cols a,b --limit N")


def get(src, where, cols, limit):
    header, body = load(src)
    idx = {h: i for i, h in enumerate(header)}
    want = [c for c in (cols.split(",") if cols else header)]
    conds = []
    if where:
        for pair in where.split(","):
            k, _, v = pair.partition("=")
            conds.append((k.strip(), v.strip()))
    out = []
    for r in body:
        if all(idx.get(k) is not None and (r[idx[k]] if idx[k] < len(r) else "") == v for k, v in conds):
            out.append({c: (r[idx[c]] if c in idx and idx[c] < len(r) else "") for c in want})
            if limit and len(out) >= limit:
                break
    print(json.dumps(out, ensure_ascii=False, indent=2))
    print(f"# {len(out)} row(s)", file=sys.stderr)


def append(src, row):
    url, is_url = resolve(src)
    if is_url:
        sys.stderr.write("[FAIL] append writes to a LOCAL CSV only. Google Sheets writeback needs auth "
                         "(see SKILL.md). Export the sheet to CSV, append, and re-upload, or use the auth path.\n")
        sys.exit(1)
    with open(url, "rb") as f:
        header = next(csv.reader(io.StringIO(decode(f.read()))))
    data = {}
    for pair in row.split(","):
        k, _, v = pair.partition("=")
        data[k.strip()] = v.strip()
    unknown = [k for k in data if k not in header]
    if unknown:
        sys.stderr.write(f"[FAIL] columns not in sheet: {unknown}. Header is {header}\n")
        sys.exit(1)
    # write as text: csv.writer quotes as needed, so leading zeros / commas survive intact.
    line = [data.get(h, "") for h in header]
    with open(url, "a", newline="", encoding="utf-8") as f:
        csv.writer(f).writerow(line)
    print(f"appended 1 row to {url}: {json.dumps(dict(zip(header, line)), ensure_ascii=False)}")


def main():
    ap = argparse.ArgumentParser(description="Use a CSV or public Google Sheet safely and cheaply (stdlib only).")
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("inspect"); p.add_argument("src"); p.add_argument("--sample", type=int, default=5)
    p = sub.add_parser("get"); p.add_argument("src"); p.add_argument("--where"); p.add_argument("--cols"); p.add_argument("--limit", type=int, default=0)
    p = sub.add_parser("append"); p.add_argument("src"); p.add_argument("--row", required=True)
    a = ap.parse_args()
    if a.cmd == "inspect":
        inspect(a.src, a.sample)
    elif a.cmd == "get":
        get(a.src, a.where, a.cols, a.limit)
    elif a.cmd == "append":
        append(a.src, a.row)


if __name__ == "__main__":
    main()
