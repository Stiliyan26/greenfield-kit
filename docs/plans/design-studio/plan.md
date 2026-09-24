# Design studio v2 plan

Status: Approved (2026-09-24, by the user: "continue building based on the plan"). Built the same day; see Build notes.

## What it does

A local page where an agent shows real candidate screens for any product and the user compares them, tunes one complete look safely, pins comments on the screen, and approves. Approval writes `DESIGN.md` and `tokens.css`, and the later skills must build with those files. The same page works in every project; product content stays in that project.

## Who can do what

- User: picks a layout and a world, tunes color inside safe limits, comments, marks likes and rejects, approves. Only the user approves.
- Agent: adds layouts, worlds, references and screens; reads the selection and the comments; marks comments done. Can't approve; can't change an approved candidate without a new draft.
- `design-critic` agent: reads screenshots and scores them. Can't edit files.

## Words used here

- **Layout**: one arrangement of a screen (today: Roster, Board, Agenda). Was called "concept".
- **World**: one complete look: colors, two typefaces, surfaces, radius, one signature detail. Replaces the hue slider.
- **Engine**: the studio's own files (`server.py`, `app.js`, `index.html`, `styles.css`, specimen page). Product-agnostic.
- **Content**: what a project adds: `project.json`, `data.js`, `candidates/`, `references/`, `selection.json`, `comments.json`, `taste.md`.

## Done when

- D1: an agent runs `init_studio.py` in an empty folder and opens the page → it shows an empty state that says what to add. No PartyFox text anywhere in the engine.
- D2: `project.json` names 2 layouts and 2 worlds → the page shows a 2 × 2 grid of real renders; clicking a cell opens it at 1440 px and 390 px, unscaled, with Google Fonts loaded.
- D3: the user drags the primary color's lightness until text on it fails 4.5:1 → the contrast line turns red and "Approve" is disabled. Status colors (danger, warning, ok) have no controls.
- D4: the user clicks an element inside a frame and types a note → `comments.json` stores layout, world, screen, width, CSS selector, text and time; after a reload the pin sits on the same element.
- D5: the user presses Approve → the server writes `DESIGN.md` at the project root and `design/tokens.css`; both match the selected world; a later tune returns the status to draft and the files keep an "outdated" note in `selection.json`.
- D6: `check_tokens.py` fails on a candidate that uses a raw `#hex` or a `font-family` not in `tokens.css`, and passes on a candidate that uses only tokens.
- D7: `sync_skills.py --check` reports the four files that differ today between `.agents/skills/` and `~/.agents/skills/`; after `--push` it reports none.
- D8: `design-critic` returns a filled rubric for `temp/verification/candidates/roster-desktop-r2.png` with a line of evidence per score, and flags the clash label covering Ivan's bookings.
- D9 (proof run, after the tool is done): PartyFox layout round on the three existing layouts, then an identity round with three worlds on the chosen layout, approval, and `plan-feature` reads `DESIGN.md` without asking for colors or fonts again.

## Changes

### Engine (in `.agents/skills/greenfield-mode/assets/studio-engine/`)

- `server.py`: serves the page; `GET/POST /api/selection`, `GET/POST /api/comments`, `POST /api/approve` (writes the two export files), `GET /specimen?world=<id>`. Still Python standard library only. Refuses unknown ids and oversized bodies as today.
- `app.js`: the grid (layouts × worlds), the real-size frames (1440, 1024, 390), world switching by setting CSS variables and the font link in each frame, the OKLCH tuner with live contrast, pinned comments, likes and rejects.
- `specimen.html`: generated per world: type scale, color roles with contrast, button, input, table row, pill, alert, and the three status colors.
- `oklch.js`: OKLCH to sRGB and WCAG 2 contrast, about 60 lines, no dependency.
- `index.html`, `styles.css`: the page's own look stays plain and neutral so it never competes with the candidates.
- `init_studio.py`: copies the engine and an empty `project.json`, as today. Adds an `--update` flag that replaces only engine files in an existing studio and keeps content files.

### Content format (`studio/project.json`)

```json
{
  "name": "Product",
  "screens": [{ "id": "ops-day", "label": "..." }],
  "layouts": [{ "id": "roster", "name": "...", "summary": "...", "previews": { "ops-day": "/candidates/roster.html" } }],
  "worlds": [{
    "id": "paper", "name": "...", "summary": "...", "signature": "...",
    "fonts": { "display": "Manrope", "body": "Literata", "googleFonts": "family=Manrope:wght@500;700&family=Literata:wght@400;600" },
    "tokens": { "color-bg": "oklch(...)", "color-surface": "...", "color-ink": "...", "color-muted": "...", "color-line": "...", "color-primary": "...", "color-on-primary": "...", "color-accent": "...", "radius-sm": "4px", "radius-md": "8px", "shadow-1": "..." }
  }],
  "status": { "danger": "oklch(...)", "warning": "oklch(...)", "ok": "oklch(...)" },
  "references": [{ "title": "Deputy roster", "app": "Deputy", "url": "https://mobbin.com/screens/...", "image": "/references/deputy.webp", "note": "row per person, now line" }]
}
```

Candidates use only `var(--color-…)`, `var(--font-…)`, `var(--radius-…)`, `var(--status-…)` and `color-mix()` for tints. The `--gf-*` names go away.

### Exports

- `DESIGN.md` at the project root, in the DESIGN.md format: YAML frontmatter with `colors`, `typography`, `rounded`, `spacing`, `components`, then the eight sections. `impeccable` reads this file too.
- `design/tokens.css`: `:root { --color-primary: …; }` for the same values, plus the locked status colors.

### Scripts (in `.agents/scripts/`)

- `check_tokens.py <files…>`: fails on raw colors and font names outside `tokens.css`. Allows `transparent`, `currentColor`, `inherit`.
- `sync_skills.py [--check|--push|--pull]`: compares `.agents/skills/` and `.agents/agents/` with `~/.agents/skills/` and `~/.agents/agents/`. Default `--check` only reports.
- `capture.mjs`: uses the installed Playwright to screenshot every layout × world × width into `temp/verification/<run>/`. Agent-side tool, not a studio dependency.

### Agent

- `.agents/agents/design-critic.md`: read-only (`Read`, `Glob`, `Grep`). Input: screenshot paths, the direction contract, the reference notes. Output: a rubric with four scores from 1 to 5, weighted originality 40, design quality 25, craft 20, functionality 15, one line of evidence each, and a verdict: show the user, or revise first. Never edits.

### Skills

- `design-interface`: two rounds. Round 1, layouts in one neutral grey world, user picks. Round 2, two or three worlds on the chosen layout; each contract names the type pair, the signature detail and the tokens; no "provisional" palette. Mobbin research in two passes: task pattern, then polished apps from other categories. Retry a failed search once, then report. Download reference images into `studio/references/` before they expire. Run `capture.mjs` and `design-critic` before showing the user. Read `taste.md` first in every round.
- `greenfield-mode` and `references/new-project.md`: drop hue and harmony; name `layouts`, `worlds`, `--update`, and the token names.
- `deliver-feature`: reads `DESIGN.md` and `design/tokens.css`; `check_tokens.py` is part of the checks.
- `plan-feature`: the plan links the approved studio revision and `DESIGN.md`.
- `.agents/README.md`, `guides/project.md`, `guides/verification.md`: updated commands and paths; remove the `designs.js` check, which names a file that does not exist.

### Impeccable hook

Turn it on with `.agents/skills/impeccable/scripts/impeccable hooks on`. It writes to the gitignored `.claude/settings.local.json`, so it is machine-local.

## Decisions

- Where the engine lives: **project `studio/` keeps content only plus a small `server.py` stub that loads the engine from `.agents/skills/greenfield-mode/assets/studio-engine/`**, falling back to `~/.agents/skills/…`. Why: one engine for all projects, updates reach every project, no second copy to drift. Evidence: the old `studio/` was a copy of the template; only `project.json` and `selection.json` differed (`diff -rq`). Decided by: user accepted the recommendation, 2026-09-24.
- Skill source of truth: **the project copy is the working version; `sync_skills.py --push` updates the global copy, and `--check` runs in verification**. Why: the project files are newer (edited 16:22 vs 15:55 today) and are in git. Symlinks from the repo to `~/.agents` would break on another machine. Decided by: user accepted the recommendation, 2026-09-24.
- Contrast rule: **WCAG 2 ratios, 4.5:1 for text and 3:1 for large text and controls**. Why: no dependency, widely accepted, easy to explain. APCA is better for dark surfaces but is not a standard yet. Decided by: proposed.
- Status colors: **locked per project in `project.json`, never tunable, and the tuner warns when the primary hue comes within 30° of the danger hue**. Why: the PartyFox rule "only a missing deposit is red" must survive tuning. Decided by: proposed.
- Fonts: **Google Fonts online**. Decided by: user, 2026-09-24.
- Reference images: **`studio/references/`, committed with the demo**. Why: the Mobbin links expire after 30 days. Decided by: proposed.
- Grid limit: at most 3 layouts × 3 worlds. Why: 9 live frames is the most a page can hold at once without lag. Decided by: proposed.
- Comment selector: id, then `data-*` attributes, then an nth-child path. Why: candidates are static HTML, so paths are stable between reloads. Decided by: proposed.

## Build order

1. Engine relocation, `init_studio.py --update`, `sync_skills.py`, push the drifted skills (D1, D7).
2. Layouts × worlds grid, token names, Google Fonts, real-size frames (D2).
3. Specimen page, OKLCH tuner, contrast check, locked status colors (D3).
4. Reference board, pinned comments, likes and rejects into `taste.md` (D4).
5. Approval export, `check_tokens.py` (D5, D6).
6. `capture.mjs`, `design-critic`, skill and guide edits, impeccable hook on (D8).
7. Move PartyFox to the new format: three layouts in one grey world, roster clash label fixed, references copied. Then the proof run (D9), when the user says so.

Each step ends with the checks in `.agents/guides/verification.md` and screenshots in `temp/verification/`.

## Open questions

- Should the studio page itself stay English, or follow the product language? Default: English, because the agent and the studio are the tool; the candidates carry the product language.

## Build notes (2026-09-24)

Built as planned, with these differences:

- `capture.mjs`, `check_tokens.py` and a new `test_studio.mjs` live in `.agents/skills/greenfield-mode/scripts/`, not `.agents/scripts/`. Why: they must travel with the skill to other projects. Only `sync_skills.py` stays in `.agents/scripts/`.
- `sync_skills.py` has no `--check` flag: running it with no flag is the check. `--pull` requires names, because it replaces project files.
- Only the studio's Approve button writes `DESIGN.md`. After an approval in chat, the agent asks the user to press it.
- The server refuses POSTs from other origins and without a JSON content type. It keeps only the page's font results for the world's own families, and refuses an approval they report as missing a script.
- `init_studio.py --update` was not built. The engine is no longer copied into projects, so there is nothing to update.
- The danger-hue guard blocks approval instead of only warning. Why: a primary that reads as red breaks the one-meaning rule for status colors.
- Status colors must reach 4.5:1 on the surface, because the candidates use them as text.
- Added a Fit / 100% preview toggle. At 1440 px the preview is wider than the space beside the sidebar; Fit shows the true layout scaled down.
- Tints must use `color-mix(in oklab, …)`. In oklch a white or grey has hue 0, so a 12% amber tint came out pink.
- `design-critic` loads as an agent type only in a new session. In this session its instructions were run through a general-purpose agent.
- Codex has no `design-critic.toml`: the workspace has no `agents:sync` script, and those files must not be written by hand.
- PartyFox's `temp/` folder (old captures, `RESEARCH.md`, `DIRECTIONS.md`) and `workflow.excalidraw` were deleted outside this build around 17:27. Reference images were fetched again from Mobbin into `studio/references/`.

## Palette library and studio redesign (2026-09-24, from the user's goal)

The user asked for a professional, easy studio and a Stitch-style color system: a library of primary, secondary, tertiary and neutral palettes that apply directly to the viewed designs, so they can browse several and approve one. Built:

- A new studio layout: top bar, left rail, canvas (frame or overview), and an inspector with Colors, Tune, Checks and Comments. Warm neutral chrome with Instrument Sans and JetBrains Mono, drawn SVG icons, themed focus, selection and scrollbars. `P` hides the side panels.
- 42 curated palettes in `web/palettes.json`. Each maps to tokens: neutral makes the surfaces and text, each role gets its color, an on-color and a soft tint, darkened only as far as contrast needs. Tonal scales run from 0 to 100.
- Browsing with arrow keys, a shortlist, mood filters, search, a "hide failing" switch, per-palette check badges, role editing, five-harmony generation from one color, and saving palettes to `studio/palettes.json`.
- `GET /api/tokens` gives every frame the same finished tokens the checks see. The derived palette tokens (secondary, tertiary, soft tints, surface-2) exist for every world.
- The specimen became a Stitch-style board: role cards with tonal scales, Aa cards per type role, button variants, field, bars, nav, icon buttons, status alerts, table and soft fills.
- PartyFox moved to the identity round with three worlds on the user's chosen Roster layout. The candidates now use secondary and tertiary, and lost two banned side stripes.
- Not done: dark-mode palettes and a font-pair library. Both are open questions for the user.

## Sources

- Code: `studio/app.js:13-18` (hue to `hsl()`), `studio/project.json:26-30` (system fonts), `studio/server.py:60-80` (validation).
- Code: `.agents/skills/greenfield-mode/scripts/init_studio.py` (copies `assets/studio-template`, refuses to overwrite).
- Code: `.agents/skills/impeccable/reference/document.md:1-20` (DESIGN.md format and root location).
- Docs: https://raw.githubusercontent.com/google-labs-code/design.md/main/docs/spec.md, "DESIGN.md is a self-contained, plain-text representation of a design system."
- Ran it: `diff -rq .agents/skills/greenfield-mode/assets/studio-template studio` printed only `project.json` and `selection.json` as differing.
- Ran it: `diff -rq .agents/skills/<skill> ~/.agents/skills/<skill>`: four files differ in `design-interface` and `greenfield-mode`; none in `plan-feature` and `deliver-feature`.
- Ran it: `npx --no-install playwright --version` printed `Version 1.63.0`; `~/Library/Caches/ms-playwright` holds `chromium-1243`.
- Ran it: `curl -sL` on a Mobbin `image_url` printed `http 200 type image/webp`; the tool schema says links expire after 30 days.
- Ran it: `ls studio/` shows no `designs.js`, although `.agents/guides/project.md` lists a check for it.
