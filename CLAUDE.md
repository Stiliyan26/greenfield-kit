# greenfield-kit

A Claude Code plugin that takes a product from a brief to a proven app. This
repo is the plugin and its marketplace, and it uses its own kit while you
work on it.

## How to work here

- Plain words. Answer first, then detail. Short. Bullets, one per line.
- Ask only when the answer changes the result a lot. Don't ask again for
  permission already given.
- Say where each fact came from: `file:line`, a link with a short quote, or
  the command and what it printed. Mark a guess as a guess.
- Before changing anything, read what exists and who uses it. Stay within
  the request; say what else needs changing instead of doing it. Remove what
  your own change left unused.
- Never open or show secrets (`.env`, key files). Don't edit generated files
  or installed packages.
- Ask before publishing, deleting data, sending messages or running a
  migration on a real database.
- A check that was skipped, failed or couldn't run is not a pass. Say which.
- The same fix fails twice: stop, show the evidence, question the idea.
- Keep screenshots and test output in `temp/verification/` until the user
  has seen them.
- After changing files, finish with: what it does now, files touched,
  impact, the checks that ran, sources. Readable in under a minute.
- Add a rule here only after a real mistake a tool can't catch. Prefer a
  check over a rule.

## Layout

- `plugin/`: the plugin. `.claude-plugin/plugin.json`, `skills/`, `agents/`.
  Edit here.
- `.claude-plugin/marketplace.json`: makes this repo its own marketplace.
- `.claude/skills` and `.claude/agents`: links into `plugin/`, so this repo
  runs the live files.
- `.claude/review/config.json` and `.claude/explain.config.json`: this
  repo's config for `review` and `interactive-explanation`.
- `plugin/skills/greenfield-mode/SKILL.md`: the pipeline. Each stage names
  its skill.
- `plugin/skills/setup-project/templates/`: what a new project receives
  (`CLAUDE.md`, `.claude/settings.json`, `.claude/explain.config.json`).
- `plugin/skills/design-interface/`: the studio. Engine
  `assets/studio-engine/`, app template `assets/studio-app/`, content
  template `assets/studio-content/`, scripts `scripts/`.
- `examples/partyfox/`: a showcase studio with three hand-written HTML
  variants. Not the test bed.
- `temp/verification/`: evidence until the user has seen it.

## Where it stands

- The design stage, promotion and the pixel check work end to end
  (`test_app.mjs`). The rest of the pipeline is written into the skills and
  has not run on a real project yet.
- Known gap: `promote_variant.py` writes a Vite `web/`; it must write
  `src/routes/` and `src/views/` for TanStack Start.

## Rules of the plugin

- Everything in `plugin/` serves any project. Examples use a neutral
  domain: orders, customers, invoices. No project names.
- A skill is steps in plain English, each ending with "Done when". It names
  only the skill it hands off to. Reference goes behind a link.
- Read the `write-code` skill before writing TypeScript.

## Commands

`D` is `plugin/skills/design-interface`.

| Purpose | Command |
| --- | --- |
| Studio engine test, ~1 min | `node $D/scripts/test_studio.mjs` |
| App flow test, ~5 min | `node $D/scripts/test_app.mjs [--keep]` |
| Open the PartyFox studio | `cd examples/partyfox && python3 studio/server.py --port 4173` |
| Capture every candidate | `node $D/scripts/capture.mjs --url http://127.0.0.1:4173 --out temp/verification/<run> --studio` |
| Check a studio's variants | `python3 $D/scripts/check_variant.py <project>/studio` |
| Check parts against screens | `node $D/scripts/check_components.mjs --url <studio url>` |
| Check screens use only tokens | `python3 $D/scripts/check_tokens.py --project <project>/studio/project.json <project>/studio/app/src/variants` |
| Promote and pixel-check | `python3 $D/scripts/promote_variant.py <project> --check --studio-url <studio url>` |
| Validate | `claude plugin validate ./plugin --strict` and `claude plugin validate . --strict` |
| Bump the version | `version` in `plugin/.claude-plugin/plugin.json` |
| Publish locally | `claude plugin marketplace update greenfield-kit && claude plugin update greenfield-kit@greenfield-kit` |

## Checks

- Studio engine, app template or `design-interface` scripts: the syntax of
  every changed file; `test_studio.mjs` prints `0 failed`. After a change to
  the app template, `init_studio.py`, `studio-build.ts`,
  `promote_variant.py` or `compare_screens.mjs`: `test_app.mjs` too. A
  studio page change: capture at 1440, 1024 and 390 and have
  `design-critic` score it; under 70 means revise.
- Skills, agents, manifest: both validate commands; every path a skill
  names exists; a removed or renamed skill is named nowhere else and the
  README table follows.
