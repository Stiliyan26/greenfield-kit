# greenfield-kit repository

This repo is the greenfield-kit Claude Code plugin and its marketplace. It is developed with its own workflow. `examples/partyfox/` is the test bed: a fake Bulgarian kids-party agency tool with fake data only.

## Layout

- `plugin/` is the plugin for Claude Code, Codex and Cursor: three manifests (`.claude-plugin/plugin.json`, `plugin.json`, `.cursor-plugin/plugin.json`), `skills/`, `agents/`. Edit skills and agents here.
- Three marketplaces point at it: `.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.json` (Codex), `.cursor-plugin/marketplace.json`.
- `.codex/agents/*.toml` are generated from `plugin/agents/` by `codex_agents.py`. Never edit them by hand.
- `.agents/skills/<name>` and `.agents/agents/<name>` are symlinks into `plugin/`, so Codex, Cursor and Claude Code in this repo use the same files. `.agents/skills/impeccable/` is a separately installed third-party skill, not part of the kit.
- `.agents/INSTRUCTIONS.md` is a symlink to the `setup-project` template. Editing it edits what new projects receive. `.agents/PROJECT.md` is this repo's own copy, not a template.
- How to write and place code is the `write-code` skill. Its ESLint preset lives in `plugin/skills/write-code/assets/eslint.config.mjs`; this repo has no JavaScript app of its own to run it on.
- The studio engine is `plugin/skills/greenfield-mode/assets/studio-engine/`. A project's `studio/` holds content only.
- `temp/verification/` keeps screenshots and test output until the user has seen them.

## The plugin stays project-agnostic

Everything in `plugin/` serves any project. PartyFox is only the test bed: a gap found on PartyFox gets a general fix in the plugin, and PartyFox's own names, roles, data, screen ids and rules stay in `examples/partyfox/`. Examples in skills, agents, scripts and the studio use a neutral domain (orders, customers, invoices). `python3 tools/check_agnostic.py` fails on PartyFox words in `plugin/`.

## Commands

All from the repo root. `G` is `plugin/skills/greenfield-mode`.

| Purpose | Command |
| --- | --- |
| Open the PartyFox studio | `cd examples/partyfox && python3 studio/server.py --port 4173` |
| Test the studio engine end to end | `node $G/scripts/test_studio.mjs` |
| Capture every candidate | `node $G/scripts/capture.mjs --url http://127.0.0.1:4173 --out temp/verification/<run> --studio` |
| Check candidates use only tokens | `python3 $G/scripts/check_tokens.py --project examples/partyfox/studio/project.json examples/partyfox/studio/candidates` |
| Check each model's variant (files, contrast, hue) | `python3 $G/scripts/check_variant.py examples/partyfox/studio` |
| Check each model's components list against its screens | `node $G/scripts/check_components.mjs --url http://127.0.0.1:4173` |
| Validate the plugin and marketplace | `claude plugin validate ./plugin --strict` and `claude plugin validate . --strict` |
| Check the three manifests agree, or bump the version | `python3 tools/check_manifests.py [--bump <version>]` |
| Check the plugin has no PartyFox words | `python3 tools/check_agnostic.py` |
| Regenerate the Codex agents in `.codex/agents/` | `python3 plugin/skills/setup-project/scripts/codex_agents.py --project .` |
| Design detector | `.agents/skills/impeccable/scripts/impeccable detect examples/partyfox/studio/candidates` |
| Compare the kit with ~/.agents (Codex, Cursor) | `python3 plugin/skills/setup-project/scripts/sync_global.py` |

## Checks

Run the ones that match what you changed. A check that is missing, skipped or failing is not a pass — say which.

### Studio engine or greenfield-mode scripts

1. Check the syntax of every changed Python and JavaScript file.
2. Run the end-to-end studio test. It must print `0 failed`.
3. Start the PartyFox studio, capture it with `--studio`, and look at the captures at 1440, 1024 and 390.
4. Ask the `design-critic` agent to score changed studio UI. Under 70 means revise first.

### Studio content in examples/partyfox

1. The token check prints `0 problems`.
2. Capture every candidate and read `capture.md`: no sideways scroll, no console errors, fonts loaded.

### Skills, agents and the plugin

1. Read each changed skill as a future agent would: links, commands, paths and stage order must exist.
2. Both `claude plugin validate` commands pass with `--strict`, `python3 tools/check_manifests.py` prints `Manifests agree.`, and `python3 tools/check_agnostic.py` prints `No project-specific words in plugin/.`
3. After changing an agent, regenerate `.codex/agents/` with `codex_agents.py --project .`.
4. After changing a skill or agent, bump the version with `tools/check_manifests.py --bump <version>` so installed copies update.
5. After changing the ESLint preset, run it against a throwaway project before claiming it works: `node --check` only proves it parses.
6. To test Codex without touching your setup: `CODEX_HOME=<temp> codex plugin marketplace add .` then `codex plugin add greenfield-kit@greenfield-kit`.

Keep screenshots and test output in `temp/verification/` until the user has seen them.

## PartyFox rules

Owner approves leave and marks a deposit received. Animators see only their own parties and pay, and the missing-deposit warning. Only a missing deposit may be solid red; a clash, an unassigned party or leave that needs cover uses the warning amber. Money figures stay unset until supplied. PartyFox's studio was rebuilt from its brief: Claude Opus 5.5, Sonnet 5 and Fable 5.1 each designed every screen and a look (`studio/candidates/opus`, `sonnet`, `fable`). The earlier Roster, Board and Agenda studio is archived in `temp/archive/partyfox-studio-v1/`.
