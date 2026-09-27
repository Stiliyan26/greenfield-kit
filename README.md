# greenfield-kit

A plugin for Claude Code, Codex and Cursor that takes a product from a rough brief to an approved design, and then keeps that design intact through planning and delivery.

It ships a local design studio. Up to three models each design the whole product from the same brief. You compare their screens side by side at three sizes, try palettes on them, pin comments on exact elements, and approve one model's design. Approval writes `DESIGN.md`, with a table of the components to build, and the `design/` files: tokens, fonts and a shadcn/ui theme taken from the tokens. The planning and delivery skills build only from those files, so the look doesn't drift into generic UI.

Version 0.7.2.

## Contents

- [The flow](#the-flow)
- [Install](#install)
- [What's inside](#whats-inside)
- [How a new product runs](#how-a-new-product-runs)
- [The studio](#the-studio)
  - [One engine, one content folder per project](#one-engine-one-content-folder-per-project)
  - [Models and variants](#models-and-variants)
  - [Three fixed sizes](#three-fixed-sizes)
  - [Views](#views)
  - [Keyboard shortcuts](#keyboard-shortcuts)
  - [Colors](#colors)
  - [Checks](#checks)
  - [Comments and taste](#comments-and-taste)
  - [Fonts and colors (specimen)](#fonts-and-colors-specimen)
  - [Approve](#approve)
- [Quality gate](#quality-gate)
- [What the agent reads back](#what-the-agent-reads-back)
- [Develop this repo](#develop-this-repo)

## The flow

```
brief ──► studio/ (project.json, shared data, references)
      ──► up to 3 models, same brief ──► candidates/<model>/ (variant.json + one HTML per screen)
      ──► quality gate (check_variant, check_components, capture, check_tokens, design-critic)
      ──► you compare, tune colors, comment ──► Approve
      ──► DESIGN.md (with components) + design/{fonts,tokens,shadcn}.css
      ──► components: shadcn + custom parts on a gallery page ──► you accept
      ──► plan-feature ──► deliver-feature
```

## Install

The repo is a plugin marketplace for Claude Code, Codex and Cursor. The repo is private, so each tool clones it with your own git login.

**Claude Code**

```
/plugin marketplace add Stiliyan26/greenfield-kit
/plugin install greenfield-kit@greenfield-kit
```

Skills are then named `greenfield-kit:<skill>`, for example `/greenfield-kit:greenfield-mode`. The agents (`design-critic`, `review-lens`) come with the plugin.

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
| `greenfield-mode` | Runs a new product end to end: brief, studio, approval, components, plan, delivery. Owns the studio engine and its scripts. |
| `design-interface` | The design process: two-pass research, the product facts, one design per model, the quality gate, and the user's choice in the studio. Small changes in an approved design reuse its tokens. |
| `plan-feature` | Plans data, roles, API and screens with the user. Links the approved `DESIGN.md` instead of deciding the look again. |
| `deliver-feature` | Builds from the plan in small, checked steps, with the components built after approval. Colors, fonts and radius come only from `design/tokens.css` and `design/shadcn.css`. |
| `design-animations` | Purposeful motion: transitions, gestures, performance, reduced motion. |
| `write-code` | Where code goes and how it's written: folder layers, TypeScript style, React, NestJS. Ships an ESLint preset so the mechanical rules are checked, not remembered. |
| `refactor` | Structure changes that provably keep behavior. |
| `create-verification-skill`, `maintain-verification-skill` | Write and keep up a project skill that drives the real app and saves proof. |
| `reflect`, `bro` | Improve the setup after a bad task; restate the last answer plainly. You start both by typing them. |
| `shadcn` | Work with shadcn/ui components and registries. |
| `setup-project` | Copies the working rules into a project, enables the plugin for the team, or installs the kit globally for Codex and Cursor. |
| `design-critic` agent | Read-only. Scores screenshots on originality (40), design quality (25), craft (20) and function (15). Under 70, or any score of 1, means "revise first". The agent that built a design may not grade it. |
| `review` | Reviews a branch or PR: tool checks first, then read-only specialist agents picked by what changed (correctness, access, contract, data, fit, tests, UI, scope), a blind-spot pass and a judge. One report, sorted by what to act on. Quick mode for small changes, plan mode before code exists. Sets up the tool checks and a CI workflow that comments on every PR. |
| `review-lens` agent | Read-only. The `review` skill starts it once per lens (`skills/review/lenses/`); not for use on its own. |

`impeccable` and `frontend-design` are not bundled. The skills use them when they are installed.

## How a new product runs

The `greenfield-mode` skill drives these steps:

1. **Ground the work.** The agent reads the brief and lists every view the confirmed requirements name. Each view becomes a screen in the studio.
2. **Create the studio.** `init_studio.py` creates a `studio/` content folder in the project. It refuses to overwrite one.
3. **Write the facts.** The agent researches references (Mobbin when connected), then writes `studio/project.json` and one shared fake-data file such as `studio/data.js`. The agent designs nothing itself.
4. **Models design.** Up to three models each get the same brief, filled in from `references/variant-brief.md`. Only the variant id, the model name and the port differ. Each model designs every screen and its own look, freely. Nobody assigns structures or styles.
5. **Quality gate.** Before you see anything, the agent runs the checks and captures, fixes what they find, and asks the `design-critic` agent for a score. A failing variant goes back to the model that made it.
6. **You choose.** You compare the models in the studio, pick one, tune its colors, comment, and press **Approve**.
7. **Build the components.** Right after approval, the agent sets up shadcn/ui with the approved theme, adds every shadcn part the Components table names, and builds the custom parts from the approved screens. A gallery page shows every part in every state. You check it before any planning (`greenfield-mode/references/components.md`).
8. **Plan and deliver.** `plan-feature` plans the system on the approved design and its components. `deliver-feature` builds the screens from those components and uses only the tokens. A new requirement that changes the look goes back to the studio.

Only the **Approve** button counts as approval. If you approve in chat, the agent asks you to press it.

## The studio

### One engine, one content folder per project

- The engine lives once, in the skill: `plugin/skills/greenfield-mode/assets/studio-engine/`. It holds the server (`studio_server.py`), the checks and export (`studio_export.py`, `studio_color.py`) and the page (`web/`). It knows nothing about any one product.
- A project gets only `studio/`, from `python3 <skill>/scripts/init_studio.py <project-root> --name "<product>"`. It holds `project.json`, `candidates/`, `references/`, the shared data file, and the files the page writes.
- `studio/server.py` is a small stub that finds the engine. It looks in this order: the `STUDIO_ENGINE` variable, `studio/.engine-path` (written by `init_studio.py`, kept out of git), a `plugin/` or `.agents/` folder in any parent directory, `~/.agents/skills/`, then the Claude Code, Codex and Cursor plugin caches, newest first.
- Start it from the project root with `python3 studio/server.py`. It prints its URL. Add `--port 4173` for a fixed port.

### Models and variants

- One model gives one variant. Two or three models give two or three variants, never more. The page flags a fourth.
- Each model writes only its own folder, `studio/candidates/<id>/`, so models running in parallel never touch the same file.
- The folder holds `variant.json` and one `<screen id>.html` per screen. `variant.json` names the model that actually ran, a one-line design idea, and its look: a Google Fonts pair that covers the product's scripts, color and radius tokens, a type scale, and one signature detail.
- Every model uses the same shared data file, so every variant shows the same content.

### Three fixed sizes

Every screen is shown at 1920×1080 (desktop), 1440×900 (laptop) and 390×844 (phone). The engine fixes these sizes; projects don't choose them. Each screen must show its main job in the first screenful at each size.

### Views

The canvas shows exact-size frames, scaled down to fit. Drag or scroll to pan. Ctrl-scroll or pinch to zoom. Frames load only when they come near the view.

- **A model's tab.** One tab per model. It shows that model's screens: one boxed row per size, the screens left to right.
- **Arena.** One row per model. In each row the three size boxes sit side by side. It appears when there are two or more models.
- **A screen from the left rail.** That one screen from every model: models across, sizes down. The rail groups screens by role, shows "2/3" when a model hasn't built a screen yet, and lists the references for that screen.
- **One screen alone.** Double-click a frame, press its **Open** button, or press `Enter`. It shows one screen from one model at 1920, 1440 or 390, fitted or at real size. **Open in a tab** opens the raw page. **Back** returns to the canvas.
- **Components.** Press `T` or the **Components** button; press it again to hide. It shows how the selected model builds its screens from parts, in three modes:
  - **Screen:** the screen beside its tree of parts, like `OrdersPage → CustomerList → CustomerRow ×6`, each marked `custom` or with its shadcn name. Hover a line to outline it in the screen, or the screen to find the line. Click a part to spotlight it: the rest dims, `‹ 2 of 6 ›` steps through its instances, **Zoom in** brings one close, and the card lists its looks and every screen that reuses it. **×**, `Esc` or a click on empty space clears the pick.
  - **Parts:** a catalog with a live crop of every part, grouped into built by hand, from shadcn, and not listed yet. Click a card to see it on its screen.
  - **Reuse:** every part against every screen.
  Structures a model drew more than once but never listed show in amber as **not listed** in all three, so a shallow list is visible at a glance.

A link like `/?view=arena` (or `model`, `screen`, `frame`) opens that view directly. Otherwise the page reopens on the view you last used.

### Keyboard shortcuts

| Key | Does |
| --- | --- |
| `←` `→` | Previous or next palette |
| `S` | Star the current palette |
| `C` | Pin a comment |
| `T` | Show or hide the components view |
| `D` | Light or dark look, for the studio and every screen |
| `M` | Arena: every model |
| `A` | The selected model's screens |
| `J` `K` | Next or previous screen |
| `Enter` | Open the selected screen alone |
| `Esc` | Back from one screen to the canvas; in the components view, clear the pick, then hide it; close or cancel |
| `-` `+` `0` | Zoom out, in, or fit everything (canvas) |
| `1` `2` `3` | 1920, 1440 or 390 (one screen alone, or the components view) |
| `F` | Fit one screen, or real size |
| `[` `]` | Hide or show the left or right panel |
| `P` | Hide or show both panels |
| `?` | List every shortcut |

### Colors

The right panel has four tabs: Colors, Tune, Checks and Comments. Click a frame to select its model. Colors, Tune and Checks work on the selected model only.

- **Palette library.** 54 curated palettes ship with the engine. Each is four seeds (primary, secondary, tertiary, neutral) with an 11-step tonal scale per seed.
- **Apply to one model.** Picking a palette recolors only the selected model's frames, live. The model keeps its fonts and radius. `←` and `→` browse from anywhere on the page.
- **Filter.** By mood, by search, by the shortlist, or "hide palettes that fail this project's checks". Each palette row says whether it passes; "Clashes" means a role sits too close to the danger red.
- **Edit and generate.** Click a role card to change that seed. "Generate from one color" makes five harmonies: monochrome, analogous, complementary, split complementary and triadic.
- **Tune single tokens.** The Tune tab has lightness, chroma and hue sliders (OKLCH) for each color token. After a palette, the palette name then shows "tuned".
- **Original colors.** Lists every model's own colors. **Restore** resets one model; **Restore all** resets every model. The studio never changes a model's `variant.json`; palettes and tuning live per model in `studio/selection.json`.
- **Save to library.** Saves the current seeds as a named palette in the project's `studio/palettes.json`.
- **Shortlist.** Star palettes with `S` or the star, then filter to the shortlist.
- **Status colors are locked.** Danger, warning and ok are set once per product in `project.json`. Nobody can tune them, so a rule like "only a missing deposit is red" survives any palette.

### Checks

The Checks tab lists every check for the selected model's current colors. **Approve** stays off while any check fails.

- **Contrast** (WCAG 2): 4.5:1 for text pairs and every status color on the surface; 3:1 for primary, secondary and accent marks.
- **Danger hue guard.** Primary, secondary and accent must stay at least 30° of hue from the danger color, unless they are nearly grey. The warning color gets a 20° guard.
- **Font script coverage.** The page asks Google Fonts whether each font ships every script in `project.json` `scripts`, such as `cyrillic`. If Google Fonts can't be reached, the check shows "not checked" and doesn't block.

The server runs the contrast and hue checks again before it writes anything.

### Comments and taste

- Press `C` (or **Comment**), then click any element in any frame, on any view. Pick **Note**, **Like** or **Reject** and write the comment.
- The pin sticks to the element's CSS selector. Screens put `data-*` attributes on meaningful elements, so pins survive later edits.
- Comments go to `studio/comments.json`. The Comments tab can show, mark done, reopen or delete each one.
- Every like and reject is also added as one line to `studio/taste.md`. Every model reads it before it designs, and never repeats a reject.
- The Comments tab also has a box for general notes to the agent.

### Fonts and colors (specimen)

The rail's "Fonts and colors" entry is each model's specimen page. It shows the look's color roles with tonal scales, both typefaces, controls, the three status colors with their meanings, and a sample table. The sample text comes from `specimen` in `project.json`, in the product's language. `specimen.parts` can point to an HTML fragment in `studio/` with a few of the product's own parts, such as a booking card. The lead agent writes it with tokens only, so every model's look shows on it.

### Approve

**Approve** approves the selected model's design at the current revision. It writes four files in the project:

- `DESIGN.md`, in the google-labs-code DESIGN.md format: colors, both typefaces, the type scale, radius, contrast results, status meanings, the palette and its tonal scales, the approved screens, and the Components table. Each row is one part the model drew: what it is, the screens that show it, a selector to find it, and whether to build it from a shadcn/ui component or by hand.
- `design/fonts.css`: the Google Fonts import alone. A CSS `@import` is dropped unless it comes first, so an app imports this file before Tailwind.
- `design/tokens.css`: every token as a CSS variable, the font stacks, and `--primary-0` to `--neutral-100` when a palette was applied. The dark look follows under `.dark` and `[data-theme="dark"]`.
- `design/shadcn.css`: shadcn/ui's theme variables, filled in from the tokens. It replaces the theme `shadcn init` writes, so shadcn parts come out in the approved colors, fonts and radius.

Every model designs a light and a dark look (`world.dark`); `D` switches the studio and every screen between them, and approval checks both. Approval refuses a model's design whose `variant.json` has no `components` list or no dark look. A tune after approval, or a change on disk to `project.json` or the approved model's folder, returns the revision to draft, and the top bar marks `DESIGN.md` as outdated. Approval refuses to overwrite any of the four files that the studio didn't write.

## Quality gate

The agent runs these before you see a design. `G` is `plugin/skills/greenfield-mode` (or the installed skill folder).

| Check | What it does |
| --- | --- |
| `python3 $G/scripts/check_variant.py studio [--variant <id>]` | Lists problems in `project.json` and `variant.json` (including a missing or broken `components` list), screens without a file, and failing contrast and hue checks. |
| `node $G/scripts/check_components.mjs --url <studio url> [--variant <id>]` | Opens every screen at 1440 and 390 and reads it against the model's `components` list, the same way the Components view does. Fails on a listed part its selector can't find, and on a structure drawn more than once that no part covers and `notComponents` doesn't excuse. |
| `python3 $G/scripts/check_tokens.py --project studio/project.json studio/candidates` | Fails on raw hex, rgb, hsl, oklch or font names, Tailwind's own palette classes (`bg-red-500`, `text-white`, `font-mono`), and token names the project doesn't define. Delivery runs it with `--tokens design/tokens.css` on changed UI files. |
| `node $G/scripts/capture.mjs --url <studio url> --out temp/verification/<run>` | Screenshots every screen × model × size, plus each specimen. Writes `capture.md` with loaded fonts, sideways scroll, clipped text and console errors. `--studio` also captures the studio page and Arena. `--variants`, `--sizes`, `--screens` narrow it. |
| `node $G/scripts/test_studio.mjs` | End-to-end test of the engine in a throwaway project. Run it after changing the engine. |
| `design-critic` agent | Scores the captures. Under 70 means revise first. |

`capture.mjs` and `test_studio.mjs` need Playwright with Chromium. They find it through `STUDIO_PLAYWRIGHT`, a normal import, or the npx cache, and print how to install it if none works.

Screens use only tokens: `var(--color-…)`, `var(--status-…)`, `var(--font-display)`, `var(--font-body)` and `var(--radius-…)`. They mix tints with `color-mix(in oklab, …)`.

## What the agent reads back

- `studio/selection.json`: the selected model, screen and size, palettes and tuning per model, the shortlist, notes, `status` and `revision`. Only `status: "approved"` is an approval.
- `studio/comments.json`: each comment's kind, text, model, screen, size and element. The agent marks each one done after handling it.
- `studio/taste.md`: likes and rejects, read before every design pass.

## Develop this repo

- `plugin/` is the plugin, with one manifest per tool: `.claude-plugin/plugin.json` (Claude Code), `plugin.json` (the Agent Plugins standard, read by Codex and Cursor) and `.cursor-plugin/plugin.json` (Cursor).
- The repo is its own marketplace three times: `.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.json` (Codex) and `.cursor-plugin/marketplace.json`.
- After a change, bump the version everywhere with `python3 tools/check_manifests.py --bump <version>`. Without `--bump` it checks that the three manifests agree.
- `.agents/skills/` and `.agents/agents/` link into `plugin/`, so this repo uses its own kit while you work on it.
- `.codex/agents/*.toml` are generated from `plugin/agents/` by `codex_agents.py --project .`. Don't edit them by hand.
- `examples/partyfox/` is the test bed: a fake kids-party agency tool with fake data only. Its studio has three variants, `opus`, `sonnet` and `fable`. Run `cd examples/partyfox && python3 studio/server.py --port 4173`.
- Checks are in `.agents/PROJECT.md`. The main ones:

```
node plugin/skills/greenfield-mode/scripts/test_studio.mjs
claude plugin validate ./plugin --strict
claude plugin validate . --strict
python3 tools/check_manifests.py
```
