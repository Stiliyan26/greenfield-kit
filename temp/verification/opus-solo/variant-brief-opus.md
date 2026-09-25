You are one of up to three models designing the same product on your own. The
user compares how different models design it, so give your own best answer.
Don't open the other variants' folders.

Your variant id is `opus` and you are `Claude Opus 5.5`.

(Test constraint added by the lead: do not read, list, grep or open anything under
`/Users/stiliyan26/projects/greenfield-kit/examples/` except
`/Users/stiliyan26/projects/greenfield-kit/examples/partyfox-opus-solo/`, and nothing
in `/Users/stiliyan26/projects/greenfield-kit/temp/archive/` or other folders of
`temp/verification/`. Don't edit the skills or the studio engine. Don't commit.)

## Read first

- The brief: `/Users/stiliyan26/projects/greenfield-kit/examples/partyfox-opus-solo/PRODUCT.md`.
- `/Users/stiliyan26/projects/greenfield-kit/examples/partyfox-opus-solo/studio/project.json`: the screens (each with its role and the requirement
  it answers), the language, the font scripts, the three status colors and
  what each one means, and the specimen sample text.
- The shared fake data: `/Users/stiliyan26/projects/greenfield-kit/examples/partyfox-opus-solo/studio/data.js`. Use only this data, so every variant shows
  the same content. You may compute values from it in the page. Don't edit it;
  report what's missing.
- `/Users/stiliyan26/projects/greenfield-kit/examples/partyfox-opus-solo/studio/taste.md`: what the user liked and rejected. Never repeat a reject.
- The references: open every image in `/Users/stiliyan26/projects/greenfield-kit/examples/partyfox-opus-solo/studio/references/` and read its
  note in `project.json`. The notes alone are not enough.
- `/Users/stiliyan26/projects/greenfield-kit/plugin/skills/greenfield-mode/references/studio.md`, sections "Variant folder" and
  "Candidate files".
- `/Users/stiliyan26/projects/greenfield-kit/plugin/skills/greenfield-mode/../design-interface/references/visual-quality.md`.

## Deliver, only in `/Users/stiliyan26/projects/greenfield-kit/examples/partyfox-opus-solo/studio/candidates/opus/`

1. `variant.json` with your model name, a one-line summary of your design
   idea, and your own look (`world`): a real Google Fonts pair that covers
   `cyrillic, latin`, all required tokens with colors in `oklch()`, a radius scale,
   and one signature detail. The format is in `studio.md`.
2. One `<screen id>.html` for every screen in `project.json`.

## Rules for every screen

- Load `/_studio/frame.js` first, then the data file.
- Use only tokens: `var(--color-…)`, `var(--status-danger|warning|ok)`,
  `var(--font-display)`, `var(--font-body)`, `var(--radius-…)`. No raw colors
  or font names. Mix tints with `color-mix(in oklab, …)`.
- Visible text is in Bulgarian (`bg`).
- Every screen works at 1920×1080, 1440×900 and 390×844. The studio shows
  exactly that first screenful, so the screen's main job must be visible
  without scrolling at each size. Design the phone as its own arrangement,
  not a squeezed desktop. No sideways scroll, no text under 11 px.
- Status colors keep the meanings in `statusMeaning`, on every screen. Keep
  your primary, secondary and accent colors at least 30° of hue away from the
  danger color and 20° away from the warning color.
- Product rules:
  - Only a missing deposit is red (`--status-danger`). A party without an animator, an animator booked twice at once, leave that overlaps booked parties, an address that isn't usable and an unanswered order use the warning amber.
  - The owner approves or rejects leave and marks a deposit received. Animator screens show only that animator's own parties, leave and pay, including the missing-deposit warning on their own parties.
  - Figures that are `null` in the data (program prices, deposit amount, animator cut, bonus, pay amounts and totals) are unknown: show them as unset, never as 0 and never invented.
  - Owner ideas are not confirmed and get no controls: automatic animator choice, one-click Viber sending, AI-drafted birthday messages, one-click subcontractor requests.
  - "Today" is `data.today` (Friday 25 September 2026). The animator screens are for `data.currentAnimator` (Ива Колева).
- Put `data-*` attributes on meaningful elements, so comment pins survive
  edits.
- Show the difficult states the data holds; don't hide them.
- Give keyboard focus a visible style. Buttons may be mock-ups but must look
  real.

## Check your work before you report

1. Start your own studio on port `4186`: from `/Users/stiliyan26/projects/greenfield-kit/examples/partyfox-opus-solo`, run
   `python3 studio/server.py --port 4186` in the background. Open a screen
   alone at `http://127.0.0.1:4186/candidates/opus/<screen>.html?world=opus`.
2. `python3 /Users/stiliyan26/projects/greenfield-kit/plugin/skills/greenfield-mode/scripts/check_variant.py /Users/stiliyan26/projects/greenfield-kit/examples/partyfox-opus-solo/studio --variant opus`
   must print `0 problems`.
3. `node /Users/stiliyan26/projects/greenfield-kit/plugin/skills/greenfield-mode/scripts/capture.mjs --url http://127.0.0.1:4186 --out /Users/stiliyan26/projects/greenfield-kit/temp/verification/opus-solo/opus --variants opus`.
   Read `capture.md` and fix sideways scroll, clipped text and console
   errors. Look at the screenshots of every screen at all three sizes and fix
   what looks broken, crowded or empty.
4. `python3 /Users/stiliyan26/projects/greenfield-kit/plugin/skills/greenfield-mode/scripts/check_tokens.py --project /Users/stiliyan26/projects/greenfield-kit/examples/partyfox-opus-solo/studio/project.json /Users/stiliyan26/projects/greenfield-kit/examples/partyfox-opus-solo/studio/candidates/opus`
   must print `0 problems`.
5. Stop your server.

## Report back, briefly

- Your look in one line, and its signature detail.
- One line per screen: what it shows, the main design decision, and which
  reference it borrows from (or why none fits).
- The output of each check, and what you couldn't check.
- Anything missing or inconsistent in the data.
