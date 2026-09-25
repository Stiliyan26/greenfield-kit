# Brief for a model that builds one variant

The lead agent fills in every `{placeholder}` and sends the same text to each
model. Only `{variant}`, `{model}` and `{port}` differ between models. Paths
are absolute. `{skill-root}` is the `greenfield-mode` folder.

---

You are one of up to three models designing the same product on your own. The
user compares how different models design it, so give your own best answer.
Don't open the other variants' folders.

Your variant id is `{variant}` and you are `{model}`.

## Read first

- The brief: `{brief}`.
- `{studio}/project.json`: the screens (each with its role and the requirement
  it answers), the language, the font scripts, the three status colors and
  what each one means, and the specimen sample text.
- The shared fake data: `{data}`. Use only this data, so every variant shows
  the same content. You may compute values from it in the page. Don't edit it;
  report what's missing.
- `{studio}/taste.md`: what the user liked and rejected. Never repeat a reject.
- The references: open every image in `{studio}/references/` and read its
  note in `project.json`. The notes alone are not enough.
- `{skill-root}/references/studio.md`, sections "Variant folder" and
  "Candidate files".
- `{skill-root}/../design-interface/references/visual-quality.md`.

## Deliver, only in `{studio}/candidates/{variant}/`

1. `variant.json` with your model name, a one-line summary of your design
   idea, and your own look (`world`): a real Google Fonts pair that covers
   `{scripts}`, all required tokens with colors in `oklch()`, a radius scale,
   and one signature detail. The format is in `studio.md`.
2. One `<screen id>.html` for every screen in `project.json`.

## Rules for every screen

- Load `/_studio/frame.js` first, then the data file.
- Use only tokens: `var(--color-…)`, `var(--status-danger|warning|ok)`,
  `var(--font-display)`, `var(--font-body)`, `var(--radius-…)`. No raw colors
  or font names. Mix tints with `color-mix(in oklab, …)`.
- Visible text is in `{language}`.
- Every screen works at 1920×1080, 1440×900 and 390×844. The studio shows
  exactly that first screenful, so the screen's main job must be visible
  without scrolling at each size. Design the phone as its own arrangement,
  not a squeezed desktop. No sideways scroll, no text under 11 px.
- Status colors keep the meanings in `statusMeaning`, on every screen. Keep
  your primary, secondary and accent colors at least 30° of hue away from the
  danger color and 20° away from the warning color.
- Product rules: {rules}
- Put `data-*` attributes on meaningful elements, so comment pins survive
  edits.
- Show the difficult states the data holds; don't hide them.
- Give keyboard focus a visible style. Buttons may be mock-ups but must look
  real.

## Check your work before you report

1. Start your own studio on port `{port}`: from `{project}`, run
   `python3 studio/server.py --port {port}` in the background. Open a screen
   alone at `http://127.0.0.1:{port}/candidates/{variant}/<screen>.html?world={variant}`.
2. `python3 {skill-root}/scripts/check_variant.py {studio} --variant {variant}`
   must print `0 problems`.
3. `node {skill-root}/scripts/capture.mjs --url http://127.0.0.1:{port} --out {evidence}/{variant} --variants {variant}`.
   Read `capture.md` and fix sideways scroll, clipped text and console
   errors. Look at the screenshots of every screen at all three sizes and fix
   what looks broken, crowded or empty.
4. `python3 {skill-root}/scripts/check_tokens.py --project {studio}/project.json {studio}/candidates/{variant}`
   must print `0 problems`.
5. Stop your server.

## Report back, briefly

- Your look in one line, and its signature detail.
- One line per screen: what it shows, the main design decision, and which
  reference it borrows from (or why none fits).
- The output of each check, and what you couldn't check.
- Anything missing or inconsistent in the data.
