# greenfield-kit repository

This repo is the greenfield-kit Claude Code / Codex / Cursor plugin and its marketplace. It is developed with its own workflow.

## Goal and where we are

- The goal is one pipeline from a rough brief to a proven app: evidence, frame, studio design in React + shadcn, approval, then the plan with the user while the approved front end is promoted, foundation, features built in parallel by agents in their own worktrees, proof. `plugin/skills/greenfield-mode/SKILL.md` is the pipeline; each stage has its skill.
- Where it stands (2026-09-29, version 0.10.4): the design stage, promotion and the pixel check are built and tested end to end (`test_app.mjs`). The plan, feature-file, coordination and verify stages are written as skills and not yet run on a real project. The first real run is Call OS (in Business-Freedom-OS); gaps it exposes get a general fix here.
- Later direction, not started: `DIRECTION.md`, a desktop app over Claude Code, Codex and Cursor that shows the pipeline, its agents and their traces.

## Layout

- `plugin/` is the plugin: three manifests (`.claude-plugin/plugin.json`, `plugin.json`, `.cursor-plugin/plugin.json`), `skills/`, `agents/`. Edit skills and agents here.
- Three marketplaces point at it: `.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.json` (Codex), `.cursor-plugin/marketplace.json`.
- `.codex/agents/*.toml` are generated from `plugin/agents/` by `codex_agents.py`. Never edit them by hand.
- `.agents/skills/<name>` and `.agents/agents/<name>` are symlinks into `plugin/`, so Codex, Cursor and Claude Code in this repo use the same files.
- `.agents/INSTRUCTIONS.md` is a symlink to the `setup-project` template. Editing it edits what new projects receive. `.agents/PROJECT.md` is this repo's own copy, not a template.
- How to write and place code is the `write-code` skill. Its ESLint preset lives in `plugin/skills/write-code/assets/eslint.config.mjs`; this repo has no JavaScript app of its own to run it on.
- The studio is the `design-interface` skill: engine `assets/studio-engine/`, app template `assets/studio-app/`, content template `assets/studio-content/`, scripts `scripts/`. A project's `studio/` holds content and its own `app/`.
- `examples/partyfox/` is a studio with three hand-written HTML variants from before the app flow. It still opens; it is not the current test bed.
- `docs/plans/` holds this repo's own plans. `STATUS.md` tracks the current rebuild.
- `temp/verification/` keeps screenshots and test output until the user has seen them.

## The plugin stays project-agnostic

Everything in `plugin/` serves any project. Examples in skills, agents, scripts and the studio use a neutral domain (orders, customers, invoices). `python3 tools/check_agnostic.py` fails on project words in `plugin/`.

## Commands

All from the repo root. `D` is `plugin/skills/design-interface`.

| Purpose | Command |
| --- | --- |
| Test the studio engine end to end (HTML candidates, ~1 min) | `node $D/scripts/test_studio.mjs` |
| Test the app flow end to end (init, React variant, build, checks, approve, promote, compare; ~5 min) | `node $D/scripts/test_app.mjs [--keep]` |
| Open the PartyFox studio | `cd examples/partyfox && python3 studio/server.py --port 4173` |
| Capture every candidate | `node $D/scripts/capture.mjs --url http://127.0.0.1:4173 --out temp/verification/<run> --studio` |
| Check a studio's variants (files, contrast, hue) | `python3 $D/scripts/check_variant.py <project>/studio` |
| Check each model's parts against its screens | `node $D/scripts/check_components.mjs --url <studio url>` |
| Check screens use only tokens | `python3 $D/scripts/check_tokens.py --project <project>/studio/project.json <project>/studio/app/src/variants` |
| Promote an approved variant and pixel-check it | `python3 $D/scripts/promote_variant.py <project> --check --studio-url <studio url>` |
| Validate the plugin and marketplace | `claude plugin validate ./plugin --strict` and `claude plugin validate . --strict` |
| Check the three manifests agree, or bump the version | `python3 tools/check_manifests.py [--bump <version>]` |
| Check the plugin has no project words | `python3 tools/check_agnostic.py` |
| Regenerate the Codex agents in `.codex/agents/` | `python3 plugin/skills/setup-project/scripts/codex_agents.py --project .` |
| Compare the kit with ~/.agents (Codex, Cursor) | `python3 plugin/skills/setup-project/scripts/sync_global.py` |

## Checks

Run the ones that match what you changed. A check that is missing, skipped or failing is not a pass; say which.

### Studio engine, app template or design-interface scripts

1. Check the syntax of every changed Python and JavaScript file.
2. `test_studio.mjs` must print `0 failed`. After a change to the app template, `init_studio.py`, `studio-build.ts`, `promote_variant.py` or `compare_screens.mjs`, `test_app.mjs` must too.
3. For a change to the studio page, start the PartyFox studio, capture it with `--studio`, look at the captures at 1440, 1024 and 390, and ask the `design-critic` agent to score them. Under 70 means revise first.

### Skills, agents, manifests

1. `claude plugin validate ./plugin --strict` and `claude plugin validate . --strict`.
2. `python3 tools/check_manifests.py` and `python3 tools/check_agnostic.py`.
3. A skill that names a file or script: the path exists. A skill that was removed or renamed: no other file names it, the `.agents/skills/` symlink follows, and the README table follows.
