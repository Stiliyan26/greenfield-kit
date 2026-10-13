# <Product>

<One or two sentences: the product, who uses it, and whether data is real or
fake. Replace every line in angle brackets. Keep this file short and true;
agents read it at the start of every task.>

Skills come from the greenfield-kit plugin, named `greenfield-kit:<skill>`.
Read `write-code` before writing or changing TypeScript. Project-only skills
live in `.claude/skills/`.

## How to work here

- Plain words. Answer first, then detail. Short. Bullets, one per line.
- Ask only when the answer changes the result a lot. Don't ask again for
  permission already given.
- Say where each fact came from: `file:line`, a link with a short quote, or
  the command and what it printed. Mark a guess as a guess.
- Before changing anything, read what exists and who uses it. Stay within
  the request; say what else needs changing instead of doing it. Remove what
  your own change left unused. Run `bun run check:fix` after every edit.
- Keep the app's existing look. Never open or show secrets (`.env`, key
  files). Don't edit generated files or installed packages.
- Ask before publishing, deleting data, sending messages or running a
  migration on a real database.
- A check that was skipped, failed or couldn't run is not a pass. Say which.
- For a screen or a flow, drive it in a real browser with Playwright the way
  a user would and save the screenshots. Use the `verify-<app>` skill once
  it exists.
- Put screenshots and test output in `temp/verification/<task>/`. The
  skill or agent that reads them last deletes them, with `.playwright-mcp/`,
  when it is done. No skill reads them later: delete after the report.
- The same fix fails twice: stop, show the evidence, question the idea.
- Before merging, run the `review` skill.
- After changing files, finish with the card in "Final reply".
- Add a rule here only after a real mistake a tool can't catch. Prefer a
  check over a rule.

## Final reply

The last reply of a task (files changed, or research done) follows this
card. A short answer to a question stays plain. One idea per sentence,
present tense, simple words. Picture under 10 lines, text under 12.

```
**<task>** · done | partial | blocked

<picture: Before → After, side by side, same style on both sides>

**Before:** one line. **Now:** one line.

**Changed**
- 3 bullets max, each with its file path.

**Proof**
| Check | Result | Evidence |
| tsc | ✓ | `bun run check` → 0 errors |
| e2e | 8/8 | ![](temp/verification/<task>/run.png) |
| pixel | ✗ not run | studio was off |

**Guess:** only when a fact is not verified. Otherwise omit.
**Skills:** the skills used, or none
**Next:** the one decision or question for the user.
```

- The picture: ASCII boxes in a code block when the change is simple.
  When it needs more than ~8 boxes, write an `.excalidraw` file in
  `temp/verification/<task>/`, export it with the `design-interface`
  skill's `scripts/export_excalidraw.mjs <file> <out-prefix>` and show
  the PNG with `![](path.png)`. No Mermaid.
- Research: the picture is a map of what was found; Before/Now becomes
  Question/Answer.
- A screenshot that proves a check goes in its Proof row as an image.

## Workspace

- <Where the app code lives, and its stack.>
- `studio/` holds design content only. Start it with `python3 studio/server.py`.
- Plans and feature files: `docs/plans/<project>/`.
- Config for the kit: `.claude/review/config.json` (written on the first
  review) and `.claude/explain.config.json`.
- <Anything missing on purpose, so agents don't invent it.>

## Commands

| Purpose | Command |
| --- | --- |
| <Run the app> | `<command>` |
| Lint, format, types, dead code | `bun run check:fix` |
| <Unit tests> | `<command>` |
| <End-to-end tests, or "none yet"> | `<command>` |
| Open the design studio | `python3 studio/server.py --port 4173` |

## Checks

Run the ones that match what you changed.

1. `bun run check` and the unit tests.
2. The end-to-end suite, when the change could affect it. Say "none" only
   after looking for `test:e2e`, `e2e/`, `playwright.config.*` and
   `cypress.config.*`.
3. A screen or a flow: drive it with Playwright and save the screenshots in
   `temp/verification/<task>/`. <Name the `verify-<app>` skill here once it
   exists.>
4. UI files: `check_tokens.py` against `design/tokens.css` prints `0 problems`.
