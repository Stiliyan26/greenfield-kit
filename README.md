# greenfield-kit

A plugin for Claude Code, Codex and Cursor that takes a product from a brief to a proven app: a studio where a model designs every screen in React + shadcn while the domain is planned with you, your approval, one feature file per feature you approve in full, then one feature at a time built by a backend and a frontend agent in one checkout, each landing as a PR with an explainer page and videos you approve.

The look never drifts: the code you approve in the studio is the front end, and every later screen is built from its parts and tokens.

Version 0.12.0.

## Contents

- [The pipeline](#the-pipeline)
- [Install](#install)
- [What's inside](#whats-inside)
- [The studio](#the-studio)
- [Building](#building)
- [Develop this repo](#develop-this-repo)

## The pipeline

```
0 Input      requirements, calls, notes, your words
1 Brief      short grill ──► BRIEF.md (confirmed lines cite their source, unknowns listed)
2 Frame      roles · screens · real records (= the draft data model)        ══ the fork ══
3A Design    the studio: one model designs every screen in React + shadcn, 3 sizes, light and dark,
             checks + design critic ──► you tune, comment, APPROVE ──► DESIGN.md, tokens, parts
3B Plan      with you while 3A runs: entities, roles, server functions, what can go wrong (misuse list)
4 Features   after APPROVE: screens wired to server functions ──► features/*.md, one per feature,
             Backend · Frontend · Scenarios with exact outcomes · Tests ──► you approve every file in full
5 Foundation one agent: routes + views promoted, drizzle schema, auth, shared/, bun run check,
             the verify skill ──► a PR with an explainer ──► you approve
6 Build      ONE feature: a backend agent and a frontend agent, same checkout, own folders,
             scenarios ──► failing tests ──► code ──► bun run check ──► e2e ──► the verify skill drives it
7 PR         interactive-explanation: page + journey video + architecture video ──► you approve ──► merge
             (while the next feature is already being built)
8 Later      add-feature: new screen? studio or straight into the app ──► 4 ──► 6 ──► 7
```

What you are asked at each stage, and the fixed rules, are in `plugin/skills/greenfield-mode/SKILL.md`.

## Install

The repo is a plugin marketplace for Claude Code, Codex and Cursor. The repo is private, so each tool clones it with your own git login.

**Claude Code**

```
/plugin marketplace add Stiliyan26/greenfield-kit
/plugin install greenfield-kit@greenfield-kit
```

Skills are then named `greenfield-kit:<skill>`, for example `/greenfield-kit:greenfield-mode`. The agents (`design-critic`, `code-reviewer`) come with the plugin.

**Codex**

```
codex plugin marketplace add Stiliyan26/greenfield-kit
codex plugin add greenfield-kit@greenfield-kit
```

Codex plugins carry skills but not agents. Add the agents once, for every project or for one:

```
python3 <plugin>/skills/setup-project/scripts/codex_agents.py --global
python3 <plugin>/skills/setup-project/scripts/codex_agents.py --project .
```

`<plugin>` is the installed plugin folder, for example `~/.codex/plugins/cache/greenfield-kit/greenfield-kit/<version>`, or `plugin/` in a clone of this repo.

**Cursor**

```
cursor-agent plugin marketplace add https://github.com/Stiliyan26/greenfield-kit
```

Then enable the plugin in Cursor's Customize page.

**Without plugins.** Codex and Cursor also read `~/.agents/skills/`. To copy the kit's skills and agents there instead:

```
python3 <plugin>/skills/setup-project/scripts/sync_global.py --push
```

Run it without `--push` to see what differs first.

**For a team.** Run the `setup-project` skill in the project. It copies the working rules (`AGENTS.md`, `.agents/INSTRUCTIONS.md`, `.agents/PROJECT.md`) and adds a `.claude/settings.json` that enables the plugin for everyone who trusts the folder. It never overwrites a file that exists. For a Bun or Node project it can also install the `write-code` checks (`bun run check`).

## What's inside

| Skill or agent | What it does |
| --- | --- |
| `greenfield-mode` | The pipeline: a short brief, frame, studio design while the domain is planned with you, approval, one feature file per feature you approve in full, the foundation, then one feature at a time built by a backend and a frontend agent in one checkout, each landing as a PR with an explainer. Owns the feature-file and coordination rules. |
| `add-feature` | The same pipeline for one feature in an existing product: new screen in the studio or straight into the app, one feature file you approve, build, verify, PR with an explainer. |
| `design-interface` | The design process and its tool: two-pass research, the product facts, one React + shadcn design per model in the studio, the quality gate, your choice, and promotion of the approved code into `web/` with a pixel check. Owns the studio engine, the app template and the scripts. |
| `plan-feature` | Plans the domain (entities, roles, server functions, what can go wrong) while the screens are designed, the screen wiring after approval, and one feature file per feature with exact scenarios and every test, one decision at a time, answers saved as given. Links `DESIGN.md` instead of deciding the look again. |
| `deliver-feature` | The backend agent or the frontend agent of one feature, in one checkout: scenarios into failing tests first, contract first, own folders only, `bun run check` after every edit, the journeys driven in a real browser, the feature file filled in for verify. |
| `interactive-explanation` | Shows a change as a local page with a narrated journey video and an architecture video, and writes the PR description from the same script. Every feature and the foundation land through it. Adapted from Peter's skill. |
| `design-animations` | Purposeful motion on the promoted screens: transitions, gestures, performance, reduced motion. |
| `write-code` | Where code goes and how it's written: FSD folders for a TanStack Start app on Bun, server functions, drizzle, TypeScript style, React, tests. Ships `bun run check` (oxlint, oxfmt, tsc, knip, a four-rule ESLint config) so the mechanical rules are checked, not remembered. |
| `create-verification-skill` | Only on `/create-verification-skill`. Writes the project's verify skill once into `.claude/skills/verify-<app>/` (launch, doctor, drive, record, evidence, stop), reading the plan's feature files as its map, then proves it on one feature. Adapted from pstack. |
| `maintain-verification-skill` | Only on `/maintain-verification-skill`. The upkeep pass: one source reader per feature file, one live run driving every feature, then one set of proven corrections to the skill and the Driving sections. Adapted from pstack. |
| `shadcn` | shadcn/ui in React: composition, forms, styling, icons, base vs radix, the CLI. |
| `setup-project` | Copies the working rules into a project, enables the plugin for the team, or installs the kit globally for Codex and Cursor. |
| `reflect` | Only on `/reflect`. Three parallel reviewers (judgment, tooling, divergent) read the session transcripts, a synthesizer sorts findings into Accepted / Rejected / Backlog, and nothing is applied to a skill until you approve. Ask it a focus question such as why a build was slow. Adapted from pstack. |
| `bro` | Restates the last message in plain human language, with no jargon. |
| `design-critic` agent | Read-only. Scores screenshots on originality (40), design quality (25), craft (20) and function (15). Under 70, or any score of 1, means "revise first". The agent that built a design may not grade it. |
| `review` | Reviews a PR, a branch, uncommitted changes, a commit range, the whole app or a plan. Runs the project's gates, then proposes one reviewer per feature (with its model) and waits for your OK. Reviewers run code (tests, curl, e2e, Playwright) to prove each finding. On a branch or PR (fix mode) the same reviewer fixes each problem in a commit, re-proves it, and stops after two rounds; no review files are written. The lead then runs the gates and tests once, and `interactive-explanation` writes the PR description from the fixed code; only hard-to-undo choices and what is still open come to you. On other targets (report mode) it writes `reviews/<date>-<target>/` with a README table and one file per feature; you tick fix now / later / not a problem, fix agents work from the ticks, and the reviewer re-proves each fix. |
| `code-reviewer` agent | The `review` skill starts one per feature; not for use on its own. In fix mode it edits and commits only its own feature's files; in report mode it only runs proof commands. |

Anthropic's `frontend-design` skill ships inside `design-interface` as `references/choose-a-look.md`. You don't need to install it separately.

## The studio

- The engine lives once, in the `design-interface` skill: `assets/studio-engine/` (server, checks, export, the page). It knows nothing about any one product.
- A project gets `studio/` (facts and the files the page writes) and `studio/app/` (one Vite + React + Tailwind 4 + shadcn app, every shadcn part installed) from `python3 <skill>/scripts/init_studio.py <project-root> --name "<product>"`.
- Each model writes only `studio/app/src/variants/<id>/`: `variant.json` (its look and custom parts), `screens/<screen>.tsx`, `parts/`. `npm run build` there type-checks and writes the studio's pages, listing the shadcn parts the screens import.
- The studio shows every screen of every model at 1920, 1440 and 390, light and dark. Palettes, tuning and the dark switch recolor shadcn parts and custom parts live, with no rebuild.
- You compare, pin comments, tune colors and press **Approve**. Approval writes `DESIGN.md` (with the Components table), `design/fonts.css`, `design/tokens.css` and `design/shadcn.css`. Only that button counts.
- `promote_variant.py --check` copies the approved variant into `web/` with the approved `design/` files, one route per screen, and reports the share of pixels that differ from the studio per screen, size and theme (under 1% passes).
- Views, shortcuts, palettes, checks and the file formats: `plugin/skills/design-interface/references/studio.md`.

Screens color only through shadcn's names (`bg-primary`, `text-muted-foreground`, `border-border`) or `var(--color-…)`, `var(--status-…)`, `var(--radius-…)`, and fonts through `font-sans` and `font-heading`. `check_tokens.py` fails on anything else.

## Building

- Coordination is files and git, so it works in every CLI: one feature file per feature (its Backend and Frontend owners, its scenarios, its tests), `shared/INDEX.md`, a `requests/` folder for what a feature needs added to the foundation, and the lead merging one PR at a time. No worktrees: the two agents of one feature share a checkout and own different folders. Details: `plugin/skills/greenfield-mode/references/coordination.md`.
- The runtime is a choice: Claude Code agent teams, Codex multi-agent, or plain CLIs per agent. Default: agent teams in Claude Code.
- The stack the skills assume: Bun, TanStack Start (file routes, server functions), React Query, Table and Form, shadcn + Tailwind, zod, drizzle on Postgres, Playwright, `bun test`, oxlint, oxfmt, knip. `write-code` says where every file goes.
- Every agent keeps `STATUS.md` current and leaves a trace of what it ran, so you follow the run without reading transcripts.

## Develop this repo

- `plugin/` is the plugin, with one manifest per tool: `.claude-plugin/plugin.json` (Claude Code), `plugin.json` (the Agent Plugins standard, read by Codex and Cursor) and `.cursor-plugin/plugin.json` (Cursor).
- The repo is its own marketplace three times: `.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.json` (Codex) and `.cursor-plugin/marketplace.json`.
- After a change, bump the version everywhere with `python3 tools/check_manifests.py --bump <version>`. Without `--bump` it checks that the three manifests agree.
- `.agents/skills/` and `.agents/agents/` link into `plugin/`, so this repo uses its own kit while you work on it.
- `.codex/agents/*.toml` are generated from `plugin/agents/` by `codex_agents.py --project .`. Don't edit them by hand.
- `examples/partyfox/` is a studio with three hand-written HTML variants from before the app flow; it still opens and is the engine test's shape. Run `cd examples/partyfox && python3 studio/server.py --port 4173`.
- Checks are in `.agents/PROJECT.md`. The main ones:

```
node plugin/skills/design-interface/scripts/test_studio.mjs   # the engine, ~1 min
node plugin/skills/design-interface/scripts/test_app.mjs      # the app flow end to end, ~5 min
claude plugin validate ./plugin --strict
claude plugin validate . --strict
python3 tools/check_manifests.py
python3 tools/check_agnostic.py
```
