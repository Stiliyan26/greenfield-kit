# Brief for a model that builds one variant

The lead agent fills in every `{placeholder}` and sends the same text to each
model. Only `{variant}`, `{model}` and `{port}` differ between models. Paths
are absolute. `{skill-root}` is the `design-interface` folder.

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
- `{skill-root}/references/visual-quality.md`.

## Deliver, only in `{studio}/candidates/{variant}/`

1. `variant.json` with your model name, a one-line summary of your design
   idea, and your own look (`world`): a real Google Fonts pair that covers
   `{scripts}`, all required tokens with colors in `oklch()`, a radius scale,
   and one signature detail. Design a dark look too, in `world.dark`: the same
   color roles for a dark screen, as considered as the light one, not an
   inverted copy. The format is in `studio.md`.
2. In the same `variant.json`, a `components` list: every part your screens
   are built from, one entry per part. Mark each with the shadcn/ui component
   it should be built from (`button`, `input`, `select`, `dialog`, `popover`,
   `tabs`, `toggle-group`, `table`, `badge`, `card`, `sonner`, …), or `null`
   when shadcn has nothing like it and it must be built by hand. A developer
   builds the product in React from this list, so split your screens the way
   `{skill-root}/../write-code/references/react.md`, section "Splitting a
   screen into components", says:
   - A list and its item are two parts: the customer list and the customer
     row in it, the step list and one step.
   - When two screens show the same thing (a person, an order, an invoice),
     use one part with its looks, not two drawings.
   - The page shell and the page header are parts when every screen has them.
   - Include the dialogs, menus and pickers your actions open, even if the
     screen only shows the button.
   Something drawn more than once that is truly not a part (a plain layout
   row) goes in `notComponents` with a reason. The format is in `studio.md`,
   section "Variant folder".
3. One `<screen id>.html` for every screen in `project.json`.

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
- Every screen works in both looks: the studio's `D` key switches it. Use
  only tokens, so dark comes from the tokens alone; `color-mix()` with a token,
  never with white or black.
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
5. `node {skill-root}/scripts/check_components.mjs --url http://127.0.0.1:{port} --variant {variant}`
   must print `0 problems`. It finds each listed part in your screens and
   lists what you drew more than once but didn't list. Open the studio's
   **Components** view (`T`) to see your screens as trees of parts.
6. Stop your server.

## Report back, briefly

- Your look in one line, and its signature detail.
- Your components: how many, and which ones are custom.
- One line per screen: what it shows, the main design decision, and which
  reference it borrows from (or why none fits).
- The output of each check, and what you couldn't check.
- Anything missing or inconsistent in the data.
