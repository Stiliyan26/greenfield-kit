# <Product> project

Replace every line in angle brackets. Keep this file short and true; agents read it at the start of every task.

## What it is

<One or two sentences: the product, who uses it, and whether data is real or fake.>

Read `PRODUCT.md` before designing screens. <Say whether a visual direction is approved; point to `DESIGN.md` once it is.>

## Workspace

- <Where the app code lives, and its stack.>
- `studio/` holds design content only. Start it with `python3 studio/server.py`.
- <Anything that is missing on purpose, so agents don't invent it.>

## Commands

All from the project root.

| Purpose | Command |
| --- | --- |
| <Run the app> | `<command>` |
| <Type check> | `<command>` |
| <Lint the files you touched> | `npx eslint --fix <files>` |
| <Unit tests> | `<command>` |
| <End-to-end tests, or "none yet"> | `<command>` |
| Open the design studio | `python3 studio/server.py --port 4173` |

## Checks

Run the ones that match what you changed. A check that is missing, skipped or failing is not a pass — say which.

1. The type check, lint and unit tests above.
2. The end-to-end suite, when the change could affect it. Say "none in this repo" only after looking for `test:e2e`, `e2e/`, `playwright.config.*` and `cypress.config.*`.
3. For a screen or a flow: drive it in a real browser with Playwright, the way a user would, and save the screenshots in `temp/verification/<task>/`. <Name the `verify-<app>` skill here once it exists.>
4. For UI files: the greenfield-mode token check against `design/tokens.css` must print `0 problems`.
5. For a new design round: capture every candidate, read `capture.md`, and have the `design-critic` agent score it before the user sees it.

Keep screenshots and test output in `temp/verification/` until the user has seen them. Visual approval is the user's decision.

## Product rules

<Roles and who may do what. Status colors and their one meaning each. Numbers that are still unknown.>
