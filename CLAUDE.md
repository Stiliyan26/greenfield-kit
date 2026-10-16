# stistack

A Claude Code plugin that takes a product from a brief to a proven app. This
repo is the plugin and its marketplace, and it uses its own kit while you
work on it.

## How to work here

- Ask only when the answer changes the result a lot. Don't ask again for
  permission already given.
- Before changing anything, read what exists and who uses it. Stay within
  the request; say what else needs changing instead of doing it. Remove what
  your own change left unused.
- Never open or show secrets (`.env`, key files). Don't edit generated files
  or installed packages.
- Ask before publishing, deleting data, sending messages or running a
  migration on a real database.
- The same fix fails twice: stop, show the evidence, question the idea.
- Put screenshots and test output in `temp/verification/<task>/`. The
  skill or agent that reads them last deletes them when it is done. No
  skill reads them later: delete after the report.
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
- `plugin/skills/start-product/SKILL.md`: the pipeline. Each stage names
  its skill.
- `plugin/skills/setup-project/templates/`: what a new project receives
  (`CLAUDE.md`, `.claude/settings.json`, `.claude/stack.json`,
  `.claude/explain.config.json`).
- `plugin/skills/design-interface/`: the studio. Engine
  `assets/studio-engine/`, app template `assets/studio-app/`, content
  template `assets/studio-content/`, scripts `scripts/`.
- `.claude/check_refs.json`: who may name whom. `improve-skill`'s
  `check_refs.py` reads it; it fails on a skill name, link or README row
  that points at nothing, and warns where a skill names more than its
  handoff.
- `examples/partyfox/`: a showcase studio with three hand-written HTML
  variants. Not the test bed.
- `temp/verification/`: evidence for the task in progress; deleted when
  it's done. Ignored by git, like `.playwright-mcp/`.

## Where it stands

- The design stage, the design pack export and its pixel check work end to end
  (`test_app.mjs`). The rest of the pipeline is written into the skills and
  has not run on a real project yet.
- The studio's code never goes into the app: `export_pack.mjs` writes
  `design/screens/` (rendered HTML, CSS, PNGs) and the builders read it.

## Rules of the plugin

- Everything in `plugin/` serves any project. Examples use a neutral
  domain: orders, customers, invoices. No project names.
- A skill is steps in plain English, each ending with "Done when". It names
  only the skill it hands off to. Reference goes behind a link.
- Read the `write-code` skill before writing code. Skills talk in roles
  (screen, server function, table, the check command); the stack lives in
  the project's `.claude/stack.json` and in `write-code/stacks/<name>/`.

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
| Export the design pack and check it | `node $D/scripts/export_pack.mjs --url <studio url> --project <project> --check` |
| Compare the built app with the pack | `node $D/scripts/compare_screens.mjs --app-url <app url> --pack design/screens --map <screen>=<route>,…` |
| Export a diagram to PNG and SVG | `node $D/scripts/export_excalidraw.mjs <file.excalidraw> <out-prefix>` |
| Validate | `claude plugin validate ./plugin --strict` and `claude plugin validate . --strict` |
| Check skill names and links | `python3 plugin/skills/improve-skill/scripts/check_refs.py plugin --handoffs .claude/check_refs.json --readme README.md --also CLAUDE.md` |
| Bump the version | `version` in `plugin/.claude-plugin/plugin.json` |
| Publish locally | `claude plugin marketplace update stistack && claude plugin update stistack@stistack` |

## Checks

- Studio engine, app template or `design-interface` scripts: the syntax of
  every changed file; `test_studio.mjs` prints `0 failed`. After a change to
  the app template, `init_studio.py`, `studio-build.ts`,
  `export_pack.mjs` or `compare_screens.mjs`: `test_app.mjs` too. A
  studio page change: capture at 1440, 1024 and 390 and have
  `design-critic` score it; under 70 means revise.
- Skills, agents, manifest: both validate commands, and the "Check skill
  names and links" command prints `0 errors`. Its coupling warnings
  are the skill names to remove when you next edit that skill.
