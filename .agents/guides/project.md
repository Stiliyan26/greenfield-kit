# greenfield-kit repository

This repo is the greenfield-kit Claude Code plugin and its marketplace. It is developed with its own workflow. `examples/partyfox/` is the test bed: a fake Bulgarian kids-party agency tool with fake data only.

## Layout

- `plugin/` is the plugin for Claude Code, Codex and Cursor: three manifests (`.claude-plugin/plugin.json`, `plugin.json`, `.cursor-plugin/plugin.json`), `skills/`, `agents/`. Edit skills and agents here.
- Three marketplaces point at it: `.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.json` (Codex), `.cursor-plugin/marketplace.json`.
- `.codex/agents/*.toml` are generated from `plugin/agents/` by `codex_agents.py`. Never edit them by hand.
- `.agents/skills/<name>` and `.agents/agents/<name>` are symlinks into `plugin/`, so Codex, Cursor and Claude Code in this repo use the same files. `.agents/skills/impeccable/` is a separately installed third-party skill, not part of the kit.
- `.agents/INSTRUCTIONS.md` and `guides/conventions.md`, `guides/pagination.md` are symlinks to the `setup-project` templates. Editing them edits what new projects receive.
- The studio engine is `plugin/skills/greenfield-mode/assets/studio-engine/`. A project's `studio/` holds content only.
- `temp/verification/` keeps screenshots and test output until the user has seen them.

## Commands

All from the repo root. `G` is `plugin/skills/greenfield-mode`.

| Purpose | Command |
| --- | --- |
| Open the PartyFox studio | `cd examples/partyfox && python3 studio/server.py --port 4173` |
| Test the studio engine end to end | `node $G/scripts/test_studio.mjs` |
| Capture every candidate | `node $G/scripts/capture.mjs --url http://127.0.0.1:4173 --out temp/verification/<run> --studio` |
| Check candidates use only tokens | `python3 $G/scripts/check_tokens.py --project examples/partyfox/studio/project.json examples/partyfox/studio/candidates` |
| Validate the plugin and marketplace | `claude plugin validate ./plugin --strict` and `claude plugin validate . --strict` |
| Check the three manifests agree, or bump the version | `python3 tools/check_manifests.py [--bump <version>]` |
| Regenerate the Codex agents in `.codex/agents/` | `python3 plugin/skills/setup-project/scripts/codex_agents.py --project .` |
| Design detector | `.agents/skills/impeccable/scripts/impeccable detect examples/partyfox/studio/candidates` |
| Compare the kit with ~/.agents (Codex, Cursor) | `python3 plugin/skills/setup-project/scripts/sync_global.py` |

## PartyFox rules

Owner approves leave and marks a deposit received. Animators see only their own parties and pay, and the missing-deposit warning. Only a missing deposit may be solid red; a clash, an unassigned party or leave that needs cover uses the warning amber. Money figures stay unset until supplied. The user chose the Roster layout; PartyFox is in the identity round with the Rota, Ledger and Playroom worlds.
