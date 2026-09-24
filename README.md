# greenfield-kit

A Claude Code plugin that takes a product from a rough brief to a distinctive, approved design, and then keeps that design intact through planning and delivery.

It ships a local design studio: you compare real candidate screens, browse a library of color palettes applied live to those screens, pin comments on exact elements, and approve one look. Approval writes `DESIGN.md` and `design/tokens.css`. The planning and delivery skills build only from those files, so the look doesn't drift into generic UI.

## Install

The repo is a plugin marketplace for Claude Code, Codex and Cursor. Push it to GitHub first; the repo is private, so each tool clones it with your own git login.

**Claude Code**

```
/plugin marketplace add Stiliyan26/greenfield-kit
/plugin install greenfield-kit@greenfield-kit
```

Skills are then named `greenfield-kit:<skill>`, for example `/greenfield-kit:greenfield-mode`. Agents (`design-critic`, `reviewer`) come with the plugin.

**Codex**

```
codex plugin marketplace add Stiliyan26/greenfield-kit
codex plugin add greenfield-kit@greenfield-kit
```

Codex plugins carry skills but not agents. Add the two agents once, for every project or for one:

```
python3 <plugin>/skills/setup-project/scripts/codex_agents.py --global
python3 <plugin>/skills/setup-project/scripts/codex_agents.py --project .
```

`<plugin>` is the installed plugin folder, for example `~/.codex/plugins/cache/greenfield-kit/greenfield-kit/<version>`, or `plugin/` in a clone of this repo.

**Cursor**

```
cursor-agent plugin marketplace add https://github.com/Stiliyan26/greenfield-kit
```

Then enable the plugin in Cursor's Customize page. The Cursor manifest carries the skills and both agents.

**Without plugins.** Codex and Cursor also read `~/.agents/skills/`. To copy the kit there instead:

```
python3 <plugin>/skills/setup-project/scripts/sync_global.py --push
```

**For a team.** Run the `setup-project` skill in the project. It adds the working rules and a `.claude/settings.json` that enables the plugin for everyone who trusts the folder.

## What's inside

| Skill or agent | What it does |
| --- | --- |
| `greenfield-mode` | Runs a new product end to end: brief, studio rounds, approval, plan, delivery. Owns the studio engine and its scripts. |
| `design-interface` | The design process: two-pass Mobbin research, a layout round, an identity round, and the quality gate. |
| `plan-feature` | Plans data, roles, API and screens. Links the approved `DESIGN.md` instead of re-deciding the look. |
| `deliver-feature` | Builds in thin, checked slices, using only `design/tokens.css` for colors, fonts and radius. |
| `design-animations` | Purposeful motion: transitions, gestures, performance, reduced motion. |
| `refactor` | Structure changes that provably keep behavior. |
| `create-verification-skill`, `maintain-verification-skill` | Write and keep up a project skill that drives the real app and saves proof. |
| `reflect`, `bro` | Improve the setup after a bad task; restate the last answer plainly. |
| `shadcn` | Work with shadcn/ui components and registries. |
| `setup-project` | Copies the working rules into a project and enables the plugin for the team. |
| `design-critic` agent | Read-only. Scores screenshots on originality (40), design quality (25), craft (20) and function (15). The agent that built a design may not grade it. |
| `reviewer` agent | Read-only review of a change or plan, sorted by what to act on. |

`impeccable` is not bundled. The kit works with it when it's installed separately.

## The design studio

Start it in a project with `python3 studio/server.py` (the `greenfield-mode` skill creates `studio/`). The page has:

- **Layouts and worlds.** A layout is one arrangement of a screen. A world is a complete look: a real Google Fonts pair, radius, a signature detail, and colors. The canvas shows one frame at 1440, 1024 or 390 px, or an overview of every pairing.
- **Palettes.** 54 curated palettes, each four seeds (primary, secondary, tertiary, neutral) with 11-step tonal scales. Picking one recolors every frame live. Browse with the arrow keys, star a shortlist, filter by mood, generate five harmonies from one color, or save your own.
- **Checks.** Every palette and tuning is checked for WCAG contrast, for staying clear of the product's danger and warning colors, and for font coverage of the product's script (for example Cyrillic). Approve stays off while a check fails, and the server checks again before writing anything.
- **Comments.** Press `C`, click any element in a frame, and pin a note, like or reject. Likes and rejects go to `studio/taste.md`, which every later round reads.
- **Specimen.** Each world gets a board with its color roles, type, controls, status colors, and the product's own parts.

## How it works, and why

- **One engine, many projects.** The engine lives in the plugin. A project's `studio/` holds only content: `project.json`, candidate pages, references, and the files the page writes. The stub `studio/server.py` finds the engine in the plugin cache, `~/.agents/skills/`, or a parent folder.
- **Two rounds.** Layout first, in a neutral grey world, so only the arrangement is judged. Then identity on the chosen layout. Mixing the two lets a nice color hide a weak arrangement.
- **Tokens, not values.** Candidates use only `var(--color-…)`, `var(--font-…)` and `var(--radius-…)`. A token check fails on raw hex, rgb, hsl, oklch or font names.
- **Status colors are locked.** Danger, warning and ok are set once per product and can't be tuned, so "only a missing deposit is red" survives any palette.
- **Separate judgment.** Before the user sees a round, the agent captures every candidate with Playwright, fixes what the capture report finds, and gets a score from the `design-critic` agent. Under 70 means revise first.
- **Approval is the handoff.** Only the Approve button writes `DESIGN.md`, in the google-labs-code DESIGN.md format, and `design/tokens.css`, including the tonal scales. A later tune marks them outdated.

## Develop this repo

- `plugin/` is the plugin, with one manifest per tool: `.claude-plugin/plugin.json` (Claude Code), `plugin.json` (the Agent Plugins standard, read by Codex and Cursor) and `.cursor-plugin/plugin.json` (Cursor, adds the agents).
- The repo is its own marketplace three times: `.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.json` (Codex) and `.cursor-plugin/marketplace.json`.
- After a change, bump the version everywhere with `python3 tools/check_manifests.py --bump <version>`.
- `.agents/` links into `plugin/`, so this repo uses its own kit while you work on it.
- `examples/partyfox/` is the test bed. Run `cd examples/partyfox && python3 studio/server.py --port 4173`.
- Checks are in `.agents/guides/verification.md`. The main ones:

```
node plugin/skills/greenfield-mode/scripts/test_studio.mjs
claude plugin validate ./plugin --strict
claude plugin validate . --strict
python3 tools/check_manifests.py
```

`capture.mjs` and `test_studio.mjs` need Playwright with Chromium, found through `STUDIO_PLAYWRIGHT`, a normal import, or the npx cache.
