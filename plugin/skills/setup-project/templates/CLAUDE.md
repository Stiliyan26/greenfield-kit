# <Product>

<One or two sentences: the product, who uses it, and whether data is real or
fake. Replace every line in angle brackets. Keep this file short and true;
agents read it at the start of every task.>

Skills come from the stistack plugin, named `stistack:<skill>`.
Read `write-code` before you write or change code. The stack is in
`.claude/stack.json`. Project-only skills live in `.claude/skills/`.

## Contents

- How to work here
- Workspace
- Commands
- Checks

## How to work here

- Load the `reply-format` skill before each reply. It sets the order,
  the templates, the sources and the evidence footer.
- Ask only when the answer changes the result a lot. Don't ask again for
  permission already given.
- Before you change anything, read what exists and who uses it. Stay within
  the request. Say what else needs changing instead of doing it. Remove what
  your own change left unused. After each edit, run `pnpm run check:fix`.
- Keep the app's existing look.
- Never open or show secrets (`.env`, key files). Do not edit generated files
  or installed packages.
- Ask before publishing, deleting data, sending messages or running a
  migration on a real database.
- For a screen or a flow, drive it in a real browser with Playwright, as a
  user would. Save the screenshots. Use the `verify-<app>` skill once it
  exists.
- Put screenshots and test output in `temp/verification/<task>/`. The skill
  or agent that reads them last deletes them, with `.playwright-mcp/`. If no
  skill reads them later, delete them after the report.
- The same fix fails twice: stop, show the evidence, question the idea.
- Before merging, run the `review` skill.
- Add a rule here only after a real mistake a tool can't catch. Prefer a
  check over a rule.

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
| Lint, format, types, dead code | `pnpm run check:fix` |
| <Unit tests> | `<command>` |
| <End-to-end tests, or "none yet"> | `<command>` |
| Open the design studio | `python3 studio/server.py --port 4173` |

## Checks

Run the ones that match what you changed.

1. `pnpm run check` and the unit tests.
2. The end-to-end suite, when the change could affect it. Say "none" only
   after looking for `test:e2e`, `e2e/`, `playwright.config.*` and
   `cypress.config.*`.
3. A screen or a flow: drive it with Playwright and save the screenshots in
   `temp/verification/<task>/`. <Name the `verify-<app>` skill here once it
   exists.>
4. UI files: `check_tokens.py` against `design/tokens.css` prints `0 problems`.
