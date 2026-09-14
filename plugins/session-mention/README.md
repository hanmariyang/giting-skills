# session-mention

Diagnose and fix Claude Code **cross-session messaging** — sending a message from one
live session to another with `@<session-name>` on the same machine. Part of
[Giting Skills](https://github.com/hanmariyang/giting-skills). MIT.

The whole difficulty is one thing: the target needs an addressable name, and that name
must be unique. This skill is the failure modes and the fixes.

## What it covers

- Why `@` doesn't fire (no name / terminal-tab label isn't the CLI name)
- Spaces in names (`@"two words"`), and why no-spaces is easier
- The unique-name rule: a taken name makes yours a two-word-suffix variant, so `@name` hits the *other* session (silent misroute)
- `-n` vs `/rename` vs `-r` vs `--fork-session`
- The command set: `claude agents [--json --all]`, `--bg`, `attach`, `logs`, `stop`
- Correct platform/version facts (Windows IS supported v2.1.234+; same-machine works on Bedrock/Vertex/Foundry v2.1.248+; `@` needs v2.1.232+)

## Verified, not copied

Every fact is checked against the official docs
(code.claude.com/docs/en/cross-session-messaging). It corrects claims that float around
in field notes but contradict current docs (e.g. "macOS/Linux only", "`/rename` allows
duplicate names"). Field observations the docs don't state are marked **[관찰]** as hints,
not guarantees.

## Install

```
/plugin marketplace add hanmariyang/giting-skills
/plugin install session-mention@giting
```
