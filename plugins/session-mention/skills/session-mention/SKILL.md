---
name: session-mention
description: "Diagnose and fix Claude Code cross-session messaging: sending a message from one live session to another with @<session-name> on the same machine. Use when the user says the @mention isn't working, doesn't autocomplete, or the message went to the wrong session, or asks how to name sessions so they can be addressed, hand work between sessions, or list/attach/stop sessions. Covers naming (--name, /rename), the unique-name rule, spaces and quoting, resume vs fork, and the command set (claude agents, --bg, attach, logs, stop)."
---

# session-mention — address the right Claude Code session, every time

Claude Code can message another **live session on the same machine**: type `@` in your
prompt, pick the target from the typeahead, and your message is delivered there. The
whole difficulty is one thing: **the target has to have a name you can address, and
that name has to be unique.** Everything below is the failure modes and the fixes.

All facts here are checked against the official docs
(code.claude.com/docs/en/cross-session-messaging). A few field observations that the
docs do not state are marked **[관찰]** so you know they are not guaranteed behavior.

## The one prerequisite: a name

You address a session by the name you gave it, set either at launch or live:

```sh
claude -n mail          # launch a session named "mail"  (--name)
/rename mail            # rename the CURRENT session (run inside the session)
```

An unnamed session still gets a **default display name** like `my-app-3f`
(`<folder>-<suffix>`). That default is a label, **not a resume handle** (passing it to
`--resume` / `/resume` won't find the session). So for reliable addressing, give
sessions real names.

## Symptom → cause → fix

**`@` doesn't send / doesn't find the session**
- The session has no addressable name, or you're trying the label on your terminal tab. **[관찰]** a name you typed into the terminal tab title is not the CLI's session name; check the real one. → Name it: `/rename <name>` inside it, or relaunch with `-n <name>`. List names with `claude agents`.

**The name has a space and won't match**
- A spaced name must be quoted. The typeahead inserts the quotes for you; typing it by hand does not. → Use `@"release notes"`, or pick from the typeahead so the quotes are added. Simplest: **name sessions without spaces** (`release-notes`).

**`@name` goes to the WRONG session (a stale one), no error**
- Names are unique per machine. When you launch OR `/rename` into a name another live session already holds, **the existing session keeps the name and yours is renamed to a two-word-suffix variant** (e.g. `auth-refactor-graceful-unicorn`). So `@name` still resolves to that older session, which may be one you forgot. → Address the variant instead, or `claude stop <id>` the old holder first, then take the name. When unsure which is which, use the short id shown in `claude agents` rather than the name.

**Resuming a conversation, but the resumed session isn't reachable by its name**
- `-r <id>` does not close the original. If you resume with `-r <id> -n <name>` while the original (which holds `<name>`) is still alive, the dedup rule renames your resumed one to a variant. → Stop the original first, or address the variant, or fork instead (below).

**I only want to rename it / branch it**
- Rename a live session in place with `/rename <name>` (same unique-name rule applies). To keep the old one and make an independently-named copy, use `--fork-session` on resume: it creates a new session (fresh name allowed) while the original stays untouched.

**Opening an old/large session warns before resuming**
- Sessions past a size/idle threshold (roughly 100k tokens or an hour idle) offer "resume from a summary" vs the full session, because the full resume spends more of your usage. → Summary keeps the working context and costs far less; pick it unless you need the whole transcript.

## Command reference (verified)

| Command | What it does |
| --- | --- |
| `claude -n <name>` | launch a named session (the precondition for `@`) |
| `@<name>` | message that session (`@"two words"` if the name has a space) |
| `/rename <name>` | rename the current live session (unique-name rule applies) |
| `claude agents` | list live sessions (needs a terminal) |
| `claude agents --json` | same list for scripts (no terminal needed) |
| `claude agents --json --all` | also include completed background sessions |
| `claude --bg` | start in the background and return (your next prompt is the task) |
| `claude attach <id>` | pull a background session into this terminal |
| `claude logs <id>` | see what a session did |
| `claude stop <id>` (`kill`) | end a session (frees its name) |
| `claude -r <id>` | resume a past conversation |
| `claude -r <id> --fork-session` | resume into a new copy, original kept |

`claude agents` needs a TTY; in scripts use `--json`. Example, name + status of each:

```sh
claude agents --json | python3 -c "import json,sys;[print(a.get('name')) for a in json.load(sys.stdin)]"
```

## Naming rules that keep `@` working

1. **Name every session you want to address** (`-n` at launch, `/rename` live). No name, no `@`.
2. **No spaces** (or always quote). `release-notes`, not `release notes`.
3. **Unique on the machine.** If the name is taken, yours becomes a variant and `@name` hits the other one. Free the name (`claude stop <id>`) before reusing it.
4. Keep names short and distinct so the typeahead is easy.

## Platform and version (verified, and corrects a common myth)

- The `@`-mention syntax needs **Claude Code v2.1.232+**.
- Same-machine session messaging is broad: **macOS, Linux, and native Windows** (Windows v2.1.234+), and it works on cloud providers **including Bedrock, Vertex, and Foundry** (v2.1.248+). Cross-machine/remote sessions are a separate feature (Remote Control) with narrower support.
- Myth to drop: "macOS/Linux only, not on cloud providers." That was true of earlier builds; current docs support Windows and same-machine on those providers. Check `claude --version` and update if `@` is missing.

## Inbound handling

A session receiving a message applies its inbound control (accept / hold / refuse) and its permission-mode default, so a delivered message is not necessarily acted on immediately. If a handoff seems ignored, check the receiving session's inbound setting. **[관찰]** the receiving session tends to re-read the handoff against its own current task, so sending work to a session busy with something else can derail it, pick the right target.

## Field observations not in the docs ([관찰], treat as hints)

- A label typed into your terminal's tab title is not the CLI session name; the two are independent.
- Non-ASCII names (e.g. Hangul) may not surface in `@` autocomplete even when addressable; typing the full name can still work.
- `claude agents` rows may show live status (busy / idle / blocked / done); `done` typically needs `--all`.
- A short bracketed id (e.g. `[f655ff]`) can appear per row to disambiguate same-named sessions.

## One line

Cross-session messaging isn't a feature you learn, it's a name you keep: **name the
session, no spaces, and make sure nothing else already holds that name.** When it
misroutes it does so silently, so verify the target with `claude agents`, not the tab title.
