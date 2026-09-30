# greenfield-kit

A plugin for Claude Code, Codex and Cursor that takes a product from a brief to a proven app: a studio where a model designs every screen in React + shadcn, your approval, a plan made with you while the approved front end is promoted, then features built in parallel by agents in their own worktrees, and proof on the merged app.

The look never drifts: the code you approve in the studio is the front end, and every later screen is built from its parts and tokens.

Version 0.10.4.

## Contents

- [The pipeline](#the-pipeline)
- [Install](#install)
- [What's inside](#whats-inside)
- [The studio](#the-studio)
- [Building](#building)
- [Develop this repo](#develop-this-repo)

## The pipeline

```
0 Evidence   calls, notes, your words ──► BRIEF.md (confirmed lines cite their source)
1 Frame      roles · screens · data shapes · sample data          (you + the lead, short)
2 Design     one model (or up to three) designs every screen in React + shadcn, in the studio
             3 sizes · light and dark · checks + design critic ──► you tune, comment, APPROVE
             ══ approve = the fork ══
3A Promote   background: the approved variant becomes web/, one route per screen,
             pixel-checked against the studio, motion added
3B Plan      with you, one decision at a time ──► plan.md + API contract + features/*.md
             join: plan approved and web/ accepted
4 Foundation the lead alone: schema, auth, API skeleton, shared/ + INDEX.md
5 Features   waves of agents, one per feature file, each in its own worktree
             scenarios fail first ──► tests + code ──► green ──► review ──► the lead merges one at a time
6 Prove      the verification skill drives every feature's scenarios on the merged app ──► demo
7 Loop       new evidence ──► a new feature file ──► back to 3 (or 2 for a screen change)
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

**For a team.** Run the `setup-project` skill in the project. It copies the working rules (`AGENTS.md`, `.agents/INSTRUCTIONS.md`, `.agents/PROJECT.md`) and adds a `.claude/settings.json` that enables the plugin for everyone who trusts the folder. It never overwrites a file that exists. For a Node project it can also install the `write-code` ESLint preset.

## What's inside

| Skill or agent | What it does |
| --- | --- |
| `greenfield-mode` | The pipeline: brief, frame, studio design, approval, then the plan with you while the front end is promoted, foundation, features in parallel, proof. Owns the feature-file and coordination rules. |
| `design-interface` | The design process and its tool: two-pass research, the product facts, one React + shadcn design per model in the studio, the quality gate, your choice, and promotion of the approved code into `web/` with a pixel check. Owns the studio engine, the app template and the scripts. |
| `plan-feature` | Plans data, roles, the API contract, each screen's behaviour and the feature files with you, one decision at a time. Links `DESIGN.md` instead of deciding the look again. |
| `deliver-feature` | One feature agent: scenarios first, own files only, shared parts reused or requested, tests, a browser proof and a review. |
| `design-animations` | Purposeful motion on the promoted screens: transitions, gestures, performance, reduced motion. |
| `write-code` | Where code goes and how it's written: folder layers, TypeScript style, React, NestJS. Ships an ESLint preset so the mechanical rules are checked, not remembered. |
| `refactor` | Structure changes that provably keep behavior. |
| `create-verification-skill` | Only on `/create-verification-skill`. Writes the project's verify skill once (launch, doctor, drive, evidence, cleanup) and a feature map, then proves it on one feature. Adapted from pstack. |
| `maintain-verification-skill` | Only on `/maintain-verification-skill`. The upkeep pass: one source reader per feature, one live run driving every feature, then one set of proven corrections. Adapted from pstack. |
| `shadcn` | shadcn/ui in React: composition, forms, styling, icons, base vs radix, the CLI. |
| `setup-project` | Copies the working rules into a project, enables the plugin for the team, or installs the kit globally for Codex and Cursor. |
| `reflect` | Only on `/reflect`. Three parallel reviewers (judgment, tooling, divergent) read the session transcripts, a synthesizer sorts findings into Accepted / Rejected / Backlog, and nothing is applied to a skill until you approve. Ask it a focus question such as why a build was slow. Adapted from pstack. |
| `bro` | Restates the last message in plain human language, with no jargon. |
| `design-critic` agent | Read-only. Scores screenshots on originality (40), design quality (25), craft (20) and function (15). Under 70, or any score of 1, means "revise first". The agent that built a design may not grade it. |
| `review` | Reviews a PR, a branch, uncommitted changes, a commit range, the whole app or a plan. Runs the project's gates, asks what worries you, then proposes one reviewer per feature (with its model) and waits for your OK. Reviewers may run code (tests, curl, e2e, Playwright) to prove a finding, never edit. Writes `reviews/<date>-<target>/`: a README with a summary table and a suggested order, and one file per feature with every problem in full. You tick fix now / later / not a problem; fix agents then work from the ticks, and the reviewer re-proves each fix. |
| `code-reviewer` agent | Read-only apart from running proof commands. The `review` skill starts one per feature; not for use on its own. |

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

- Coordination is files and git, so it works in every CLI: one feature file per feature (what it owns, what it uses from `shared/`, its scenarios), `shared/INDEX.md`, a `requests/` folder for what a feature needs added to shared, and the lead merging one feature at a time. Details: `plugin/skills/greenfield-mode/references/coordination.md`.
- The runtime is a choice at fan-out: Claude Code agent teams, Codex multi-agent, Cursor Projects, or plain worktrees. Defaults: agent teams in Claude Code, worktrees elsewhere.
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
