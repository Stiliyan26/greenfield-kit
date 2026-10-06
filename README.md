# greenfield-kit

A Claude Code plugin that takes a product from a brief to a proven app: a studio where a model designs every screen in React + shadcn while the domain is planned with you, your approval, one feature file per feature you approve in full, then one feature at a time built by a backend and a frontend agent in one checkout, each landing as a PR with an explainer page and videos you approve.

The look never drifts: the code you approve in the studio is the front end, and every later screen is built from its parts and tokens.

Version 0.16.0.

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
8 Later      add a feature: new screen? studio or straight into the app ──► 4 ──► 6 ──► 7
```

What you are asked at each stage, and the fixed rules, are in `plugin/skills/greenfield-mode/SKILL.md`.

## Install

The repo is a Claude Code plugin marketplace. It is private, so Claude Code clones it with your own git login.

```
/plugin marketplace add Stiliyan26/greenfield-kit
/plugin install greenfield-kit@greenfield-kit
```

Skills are then named `greenfield-kit:<skill>`, for example `/greenfield-kit:greenfield-mode`. The `design-critic` agent comes with the plugin.

**For a team.** Run the `setup-project` skill in the project. It copies the working rules (`AGENTS.md`, `.agents/INSTRUCTIONS.md`, `.agents/PROJECT.md`) and adds a `.claude/settings.json` that enables the plugin for everyone who trusts the folder. It never overwrites a file that exists. For a Bun or Node project it also installs the `write-code` checks (`bun run check`).

## What's inside

| Skill or agent | What it does |
| --- | --- |
| `greenfield-mode` | The pipeline: a short brief, frame, studio design while the domain is planned with you, approval, one feature file per feature you approve in full, the foundation, then one feature at a time built by a backend and a frontend agent in one checkout, each landing as a PR with an explainer. Owns the feature-file and coordination rules.. Also adds one feature later to a product that has a design and a plan. |
| `design-interface` | The design process and its tool: two-pass research, the product facts, one React + shadcn design per model in the studio, the quality gate, your choice, and promotion of the approved code into `web/` with a pixel check. Owns the studio engine, the app template and the scripts. |
| `plan-feature` | Plans the domain (entities, roles, server functions, what can go wrong) while the screens are designed, the screen wiring after approval, and one feature file per feature with exact scenarios and every test, one decision at a time, answers saved as given. Links `DESIGN.md` instead of deciding the look again. |
| `deliver-feature` | The backend agent or the frontend agent of one feature, in one checkout: scenarios into failing tests first, contract first, own folders only, `bun run check` after every edit, the journeys driven in a real browser, the feature file filled in for verify. |
| `interactive-explanation` | Shows a change as a local page with a narrated journey video and an architecture video, and writes the PR description from the same script. Every feature and the foundation land through it. Adapted from Peter's skill. |
| `design-animations` | Purposeful motion on the promoted screens: transitions, gestures, performance, reduced motion. |
| `write-code` | Where code goes and how it's written: FSD folders for a TanStack Start app on Bun, server functions, drizzle, TypeScript style, React, tests. Ships `bun run check` (oxlint, oxfmt, tsc, knip, a four-rule ESLint config) so the mechanical rules are checked, not remembered. |
| `verify` | Only on `/verify`. Writes the project's own verify skill into `.claude/skills/verify-<app>/` (launch, doctor, drive, evidence, stop) when there is none, else audits it: one source reader per feature file, one live pass driving every feature, one set of proven corrections. |
| `shadcn` | shadcn/ui in React: composition, forms, styling, icons, base vs radix, the CLI. |
| `setup-project` | Copies the working rules into a project, enables the plugin for the team, and installs the `write-code` checks. |
| `reflect` | Only on `/reflect`. Three parallel reviewers (judgment, tooling, divergent) read the session transcripts, a synthesizer sorts findings into Accepted / Rejected / Backlog, and nothing is applied to a skill until you approve. Ask it a focus question such as why a build was slow. Adapted from pstack. |
| `bro` | Restates the last message in plain human language, with no jargon. |
| `design-critic` agent | Read-only. Scores screenshots on originality (40), design quality (25), craft (20) and function (15). Under 70, or any score of 1, means "revise first". The agent that built a design may not grade it. |
| `review` | Reviews a PR, a branch, a commit range, the whole app, uncommitted work (after you commit it) or a plan. One reviewer per feature proves each problem by running code, fixes it in a commit, and re-proves it; the lead runs the gates and tests once, and `interactive-explanation` writes the PR page. Only hard-to-undo choices and what is still open come to you. A plan, or "report only", gets report mode: `reviews/<date>-<target>/` for you to tick. |

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
- The runtime: Claude Code agent teams, or `claude -p` per agent as the fallback.
- The stack the skills assume: Bun, TanStack Start (file routes, server functions), React Query, Table and Form, shadcn + Tailwind, zod, drizzle on Postgres, Playwright, `bun test`, oxlint, oxfmt, knip. `write-code` says where every file goes.
- Every agent keeps `STATUS.md` current and leaves a trace of what it ran, so you follow the run without reading transcripts.

## Develop this repo

- `plugin/` is the plugin: `.claude-plugin/plugin.json`, `skills/`, `agents/`. Edit skills and agents here.
- `.claude-plugin/marketplace.json` makes the repo its own marketplace.
- After a change, bump `version` in `plugin/.claude-plugin/plugin.json`.
- `.agents/skills/` and `.agents/agents/` link into `plugin/`, so this repo uses its own kit while you work on it.
- `examples/partyfox/` is a studio with three hand-written HTML variants from before the app flow; it still opens and is the engine test's shape. Run `cd examples/partyfox && python3 studio/server.py --port 4173`.
- Checks are in `.agents/PROJECT.md`. The main ones:

```
node plugin/skills/design-interface/scripts/test_studio.mjs   # the engine, ~1 min
node plugin/skills/design-interface/scripts/test_app.mjs      # the app flow end to end, ~5 min
claude plugin validate ./plugin --strict
claude plugin validate . --strict
python3 tools/check_agnostic.py
```
