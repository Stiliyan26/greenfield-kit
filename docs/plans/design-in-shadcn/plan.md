# Design in shadcn plan

Status: Draft
Design: no approved design; this changes the kit's design and components stages

## What it does

Today a model draws every screen as token-only HTML, and after approval an agent
rebuilds every part in React + shadcn. The second build repeats the first and
can drift from what was approved. After this change the model designs the
screens directly in React with the shadcn components, inside the studio. The
approved screens are already the app's code: the components stage becomes
"promote the approved variant into the app and prove it renders the same", not
"rebuild everything".

Found on a real run (Call OS, one model): 10 approved HTML screens were rebuilt
as 89 React parts in about an hour of agent time, plus a critic pass, with seven
places where the rebuild had to guess.

## Who can do what

- User: picks how many models design (one is normal), tunes colors, comments,
  approves. Accepts the promoted app.
- Lead agent: writes project facts and data, sets up the studio app, starts the
  model(s), runs the checks, promotes after approval. Never picks a variant.
- Designing model: writes only its own variant folder. Never runs
  `shadcn add`, `npm install` or edits shared files.

## Done when

- D1: the lead runs `init_studio.py` → `studio/` has project.json and a
  ready `studio/app/` (Vite, React, Tailwind 4, every shadcn component
  installed once), and `npm run build` in it passes with no variants.
- D2: a model writes `studio/app/src/variants/<id>/` (screens + custom parts)
  and `studio/candidates/<id>/variant.json` → `npm run build` writes
  `candidates/<id>/<screen>.html` for every screen, and the studio shows them
  exactly as it shows hand-written HTML today (canvas, arena, one screen alone,
  three sizes, comments, captures).
- D3: the user picks a palette, tunes a color or presses `D` → shadcn parts
  (buttons, inputs, tabs, dialogs) and custom parts both change live, with no
  rebuild.
- D4: the Components view and `check_components.mjs` find shadcn parts by their
  `data-slot` attribute without the model listing them, and find custom parts
  by the list in variant.json. A repeated structure no part covers still shows
  as "not listed".
- D5: a screen uses a raw color, a Tailwind palette class (`bg-red-500`) or a
  font name in a variant's TSX → `check_tokens.py` names the file and line.
- D6: a model edits `src/components/ui/*`, `package.json` or another variant's
  folder → `check_variant.py` reports it (files changed outside the variant).
- D7: the user presses Approve → DESIGN.md, fonts.css, tokens.css and
  shadcn.css are written as today, and the Components table lists the shadcn
  parts used (from the scan) and the custom parts (from the list).
- D8: after approval the lead runs `promote_variant.py` → `web/` is the app:
  `design/*.css` replaces the live studio theme, the approved variant's custom
  parts land under `src/` in write-code's folders, each approved screen is a
  route, and the other variants are not copied.
- D9: `promote_variant.py --check` captures every promoted route at 1920, 1440
  and 390, light and dark, next to the studio capture of the same screen and
  reports the pixel difference → under a set threshold passes; above it names
  the screen and size.
- D10: an existing studio with hand-written HTML candidates (PartyFox) still
  opens, captures and approves as before.
- D11: `test_studio.mjs` covers D1–D10 and prints `0 failed`; `check_agnostic.py`
  and the manifest checks pass.

## Changes

- Engine (`assets/studio-engine/`):
  - `studio_server.py`: no change to serving; built screens are HTML in
    `candidates/<id>/` plus an `assets/` folder. Report a variant whose build is
    missing or older than its source.
  - `web/component-scan.js`: add parts found by `data-slot` (shadcn), grouped by
    their shadcn name, alongside the listed custom parts.
  - `studio_export.py`: Components table from scan + list; everything else the
    same.
  - New `web/studio-theme.css` (served at `/_studio/`): maps shadcn's variables to
    the live tokens (`--primary: var(--color-primary)`, `--radius: var(--radius-md)`,
    `--font-sans: var(--font-body)` …) using the same mapping `shadcn_css()`
    already writes, but as references, so frame.js's live tokens drive shadcn.
- Scripts (`scripts/`):
  - `init_studio.py`: also creates `studio/app/` with
    `npx shadcn@latest init -t vite …` and `npx shadcn@latest add --all`, removes
    shadcn's theme and imports `/_studio/studio-theme.css`, and writes a Vite
    multi-page config: one HTML entry per screen per variant, output to
    `candidates/<id>/`, each page loading `/_studio/frame.js` first.
  - `check_tokens.py`: already reads TSX; confirm it covers Tailwind arbitrary
    color values (`bg-[#fff]`) and add a test.
  - `check_variant.py`: build present and current; nothing edited outside the
    variant's folders.
  - New `promote_variant.py`: D8 and D9.
  - `test_studio.mjs`: a fixture variant written in TSX, built, and checked
    through D2–D9. The npm install is slow, so reuse one cached install.
- Docs:
  - `greenfield-mode/SKILL.md`: stage 2 designs in the studio app; stage 3
    becomes "promote and prove"; stages 4–5 unchanged.
  - `references/studio.md`: "Variant folder" and "Candidate files" rewritten for
    TSX + build; HTML candidates kept as the older path.
  - `references/variant-brief.md`: write TSX with the installed shadcn parts;
    build custom parts only where shadcn has nothing; spend originality on
    type, layout, density and the custom parts (the critic's risk: a
    shadcn-built design reads as a template); never touch shared files.
  - `references/components.md`: rewritten as "promote and prove".
  - `references/new-project.md`, `design-interface/SKILL.md`,
    `design-interface/references/greenfield.md`: the new order.
  - `.agents/PROJECT.md` and `README.md`: where the pipeline stands.
- Manifests: version bump (0.9.0), all three agree.

## Decisions

- Where the design code lives: one shared app in `studio/app/`, one folder per
  variant. Why: one install, the same shadcn parts for every variant, and
  promotion copies one folder. With one model (the normal case) it is one app
  and one folder. Decided by: agreed.
- Shared data: the studio's data file becomes `studio/app/src/data.ts` (typed,
  imported by screens) instead of `window.DATA`. Why: real props and types in
  the promoted code. Decided by: proposed.
- The components gallery: replaced by D9's screen-by-screen comparison plus the
  studio's existing Components view (Parts tab). Why: the promoted screens are
  the approved screens; a separate gallery rebuilt them. Decided by: user.
- HTML candidates: still supported for existing studios, no longer taught for
  new ones. Decided by: proposed.
- Branch: build on greenfield-kit `main`, as the user asked; also merge
  `fix/studio-pan-dots` into `main` first. Decided by: user.

## Build order

1. Merge `fix/studio-pan-dots` into `main`.
2. `studio-theme.css` + `init_studio.py` app setup + multi-page build (D1, D2, D3).
3. `data-slot` scan and export table (D4, D7).
4. Token and variant checks (D5, D6).
5. `promote_variant.py` with `--check` (D8, D9).
6. Docs, brief, PROJECT.md, README, version bump; `test_studio.mjs` (D10, D11).
7. Call OS (Business-Freedom-OS, branch `call-os`): no redesign. Build its
   front end from the approved Timecode design: the 10 approved screens as
   React routes in `call-os/web/`, made from shadcn and the parts already
   built there, then checked screen by screen against the studio with D9's
   pixel comparison.

## Answered

- No separate components gallery after promotion: D9's pixel check and the
  studio's Components view are enough. The Call OS `/_components` page goes.
  Decided by: user.
- Call OS: the user wants the front end built from the approved design, not a
  gallery and not a new design. Decided by: user.
