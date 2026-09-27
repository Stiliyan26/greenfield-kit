# Pipeline test: gaps found in the kit

Run: PartyFox, brief → studio → approval (Opus, revision 247) → plan → build.
Started 2026-09-27. One line per gap: where it showed up, what's missing, evidence.

## G1. No component definition between approval and build

- Approval writes a `## Components` section that only says "Extract components from the approved screens above" (`plugin/skills/greenfield-mode/assets/studio-engine/studio_export.py:357-358`). The frontmatter lists three fixed roles (button-primary, surface, alert-danger) for every product (`studio_export.py:292-296`).
- `design-interface` step 7 says "List the components to extract" but names no file or format (`plugin/skills/design-interface/SKILL.md:81`).
- The variant brief never asks the model to name its components (`plugin/skills/greenfield-mode/references/variant-brief.md`).
- Nothing says to use the `shadcn` skill. `deliver-feature/SKILL.md:19-20` and `write-code/references/react.md:231` say "don't add a component kit's theme", which reads as "no shadcn".
- Nothing maps `design/tokens.css` to shadcn's theme variables, so every agent would do it by hand.
- Found when: planning PartyFox. The plan had no component section until the user asked.

## G2. The plan template lets a plan miss screen actions and leak data

From the `reviewer` agent on the PartyFox plan, 2026-09-27:

- The template has no step "list every action on each approved screen and the endpoint behind it". The reviewer found 6 screen actions with no endpoint.
- The template asks for "what goes in and out" but not the response shape per role, so a plan can return raw rows (password hash) or give an animator owner-only fields.
- Nothing asks where a local day, month or whole-day leave starts and ends when times are stored in UTC.
- Nothing asks for a "not logged in" Done-when line.

## G3. The font import is dropped in any Tailwind app

- `design/tokens.css` started with the Google Fonts `@import url(...)`. Imported after `@import "tailwindcss"`, it is no longer first, so the build drops it: "@import rules must precede all rules" (Vite 8.3.1 build warning, throwaway app). The fonts never load, silently.
- Found when: testing the shadcn bridge in `/tmp/shadcn-bridge/app2`.

## G4. The token check missed Tailwind's own colors

- `check_tokens.py` flagged raw values only. `bg-red-500` or `text-white` skip the tokens and passed. shadcn's own dialog uses `bg-black/10`.

## Status (2026-09-27)

- G1 fixed: models list `components` in `variant.json`; approval refuses a variant without it and writes the Components table into `DESIGN.md`, plus `design/shadcn.css`; `deliver-feature/references/ui-setup.md` sets up shadcn from them. Bridge proven in a throwaway app: `shadcn-bridge.png`.
- G2 fixed in `plan-feature` (screen actions, responses per role, time boundaries, not-logged-in line).
- G3 fixed: approval writes the import alone to `design/fonts.css`, imported first.
- G4 fixed: `check_tokens.py` flags Tailwind palette and `font-serif`/`font-mono` classes.
- G5 (found 2026-09-27, fixed): a change to the approved model's `variant.json` after approval left the studio "approved" with a stale `DESIGN.md`, and Approve stayed disabled, so the user couldn't approve again. The studio now returns to draft when `project.json` or the approved model's folder is newer than the approval.
- Reviewer pass on the kit change: no must-fix. Fixed: radius names in `ui-setup.md`, fonts for apps set up earlier, the page shows a missing components list, tests for the refusal and the Tailwind check, Tailwind 4.3's mauve/olive/mist/taupe and inset/drop/text shadows, one-line component fields, the DESIGN.md "Do" rule allows shadcn class names, `shadcn init --force`/`apply` warning.
- Left as is: DESIGN.md front matter still lists three fixed component roles (the DESIGN.md spec wants token maps per component, and the list has none); "components are required" is checked in three places.
- G6 (open, not fixed): the variant brief doesn't require a visible control for every action the requirements imply. Sonnet's screens have no "change animator" or "report pay error" control, so its components list attached those dialogs to the party block (`.g-block[data-booking]`) and the pay row (`.row[data-pay-item]`). Opus's approved design has both controls.
- G7 (user, 2026-09-27, fixed): the shadcn step belongs right after approval, as its own stage, not inside the first build task. `greenfield-mode` now runs: approve → build the components (`references/components.md`: shadcn with the approved theme, custom parts, a `/_components` gallery the user accepts) → plan → deliver.
- G8 (user, 2026-09-27, added): the user could not see how screens are built from parts or where parts are reused. The studio now has a **Components** view (`T` or the button, again to hide): the screen beside its part tree read from the model's `components` list, hover links both ways, reuse per part and a reuse grid. It started as `examples/partyfox/studio/lab/component-map.html`.
- G9 (user, 2026-09-27, fixed): component lists were shallow (no animator row, no page header, no step item), and nothing flagged it. The kit now has React splitting rules (`write-code/references/react.md`, "Splitting a screen into components", from react.dev "Thinking in React"), the brief points to them, and `scripts/check_components.mjs` (same reader as the view, `web/component-scan.js`) fails on a structure drawn more than once that no part covers. `notComponents` excuses one with a reason. First run: 22 gaps across the three models.
- G10 (user, 2026-09-27, fixed): the Components view was hard to read and a pick couldn't be cleared visibly. Rebuilt: Screen / Parts / Reuse modes, spotlight with `‹ n of m ›`, Zoom, ×; folding "screen" card (folded by default) and Composition (open); tree with level guides and shape per kind; amber "not listed" rows; Parts catalog with live crops. Bugs found on the way: screen CSS (`.pick`) styled the overlay (now prefixed and reset); a class clash hid the view's toolbar; a focus inside a screen scrolled the studio.
- G11 (user, 2026-09-27, fixed): no dark mode. The studio has a dark chrome and a D / moon switch; each model designs `world.dark`; `project.json` may set `statusDark`; checks and approval cover both looks; approval writes dark blocks into `tokens.css` and `shadcn.css` and a dark table into `DESIGN.md`. PartyFox has `statusDark`; the three models are adding their dark looks.
- G12 (found by Fable, 2026-09-27, fixed): text on a solid danger fill had no token and no contrast check; white on a dark-mode red is 2.88:1. The engine now derives `color-on-status` per look and checks it (PartyFox: 6.08:1 light, 6.78:1 dark).
- G13 (user, 2026-09-27, fixed): the skills had picked up PartyFox examples (PartyTicket, animator lane, missing deposit, ops-day). Rewritten with a neutral orders/customers/invoices domain; `.agents/PROJECT.md` now says the plugin stays project-agnostic, and `tools/check_agnostic.py` fails on PartyFox words in `plugin/`.
- G14 (user, 2026-09-27, fixed): in the Components view, Arena changed only the tab. Arena and "one screen alone" now close the view; model tabs and rail screens switch what it shows. The screen card was removed as too complicated; the focus bar shows the pick's reuse.
- G15 (found by Sonnet, fixed): a screen's own `:root { color-scheme: light }` beat the studio's dark setting, because the studio's token style loads first. frame.js now sets `color-scheme` inline.
- G16 (user, 2026-09-27, fixed): zoom and pan lagged. Every wheel event set `--zoom`, which ~20 board rules size themselves from, so each tick re-laid out the whole board. Now each frame only moves the world as one layer; `--zoom`, labels and frame loading update once the gesture stops. Buttons and keys zoom in one step.
- G17 (user, 2026-09-27, fixed): comments didn't work with the Components view open: its screen frame lacked the data comments look for, and the view swallowed clicks. The frame now carries them, the view steps aside in comment mode, and Esc leaves comment mode before it closes the view.
- G18 (user, 2026-09-27, fixed): the studio opened in dark when the computer was set to dark. It now always starts light, the models' main look; D switches and is remembered. The tree's `<Name>` / `<Name />` style is back by default.
- G19 (found testing, fixed): the components reader counted the studio's own comment pins as buttons, and couldn't nest parts under a page shell that is the `<body>`.
- G20 (user, 2026-09-27, fixed): a review of a ~72k-line app planned ~55 agents, because the review skill ran every lens as its own agent on every chunk (lenses × chunks). The skill now starts at most 5 agents: up to 4 area reviewers, each checking its own files through every lens they need (blind spot last), and a judge. `triage.mjs` collects the target itself (`--base`, `--uncommitted`, `--range`, `--app` for the whole app), fills areas by risk, and lists what doesn't fit under "Not reviewed" for a later `--only` run. The skill shows the plan and waits for the user's OK; CI goes ahead and puts the plan above the report. Mode names are unchanged, so `deliver-feature`, `greenfield-mode` (plan mode) and the INSTRUCTIONS template still work. Evidence: `temp/verification/review-5-agents/triage-test.txt`.
