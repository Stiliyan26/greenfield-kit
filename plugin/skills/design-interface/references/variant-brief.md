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
- The shared sample data: `{studio}/app/src/data.ts`. Import it as `@/data`
  and use only this data, so every variant shows the same content. You may
  compute values from it. Don't edit it; report what's missing.
- `{studio}/taste.md`: what the user liked and rejected. Never repeat a reject.
- The references: open every image in `{studio}/references/` and read its
  note in `project.json`. The notes alone are not enough.
- `{skill-root}/references/studio.md`, sections "The studio app",
  "variant.json" and "Screens".
- `{skill-root}/references/visual-quality.md` and
  `{skill-root}/references/choose-a-look.md`.
- The `shadcn` skill's rules for composition, forms and styling, and the parts
  in `{studio}/app/src/components/ui/`. Every shadcn part is installed; never
  run `shadcn add`, `npm install`, or edit anything outside your folder.

## Deliver, only in `{studio}/app/src/variants/{variant}/`

1. `variant.json` with your model name, a one-line summary of your design
   idea, and your own look (`world`): a real Google Fonts pair that covers
   `{scripts}`, all required tokens with colors in `oklch()`, a radius scale,
   and one signature detail. Design a dark look too, in `world.dark`: the
   same color roles for a dark screen, as considered as the light one, not an
   inverted copy. The format is in `studio.md`.
2. `screens/<screen id>.tsx` for every screen in `project.json`: a React
   component, default export, no props, built from the shadcn parts in
   `@/components/ui/*` and your own parts in `parts/`. This code is the
   product's front end after approval, so split it the way
   `{skill-root}/../write-code/references/react.md`, section "Splitting a
   screen into components", says:
   - A list and its item are two parts.
   - When two screens show the same thing (a person, an order, an invoice),
     use one part with its looks, not two drawings.
   - The page shell and the page header are parts when every screen has them.
   - Use a shadcn part wherever one fits (button, input, select, dialog,
     tabs, table, badge, card, …). Build a part by hand only for what shadcn
     doesn't have, and put `data-part="<name>"` on its root.
3. In `variant.json`, a `components` list of your **custom** parts, one entry
   per part, with `shadcn: null` and a `[data-part=…]` selector. Add a shadcn
   overlay a screen only shows the trigger for (a dialog, a menu) with
   `shadcn` set and a selector on its trigger. The build lists every other
   shadcn part from your imports. A structure drawn more than once that is
   truly not a part goes in `notComponents` with a reason.

## Rules for every screen

- Colors only through shadcn's names (`bg-primary`, `text-muted-foreground`,
  `border-border`, `bg-destructive` for danger only) or `var(--color-…)`,
  `var(--status-…)`, `var(--radius-…)`. Fonts only `font-sans` and
  `font-heading`. No Tailwind palette classes, no raw colors, no font names.
  Mix tints with `color-mix(in oklab, …)`, never with white or black.
- Visible text is in `{language}`.
- Every screen works at 1920×1080, 1440×900 and 390×844. The studio shows
  exactly that first screenful, so the screen's main job must be visible
  without scrolling at each size. Design the phone as its own arrangement,
  not a squeezed desktop. No sideways scroll, no text under 11 px.
- Every screen works in both looks: the studio's `D` key switches it. shadcn's
  variables follow the tokens, so dark comes from the tokens alone.
- Status colors keep the meanings in `statusMeaning`, on every screen. Keep
  your primary, secondary and accent colors at least 30° of hue away from the
  danger color and 20° away from the warning color.
- Product rules: {rules}
- Show the difficult states the data holds; don't hide them. A dialog or menu
  the design needs is rendered open on a screen, or listed with its trigger.
- Give keyboard focus a visible style. Buttons may be mock-ups but must look
  real.
- Spend your originality on layout, density, type and your custom parts. A
  design that is only shadcn's defaults reads as a template; change sizes,
  spacing and structure, never a shadcn part's colors.

## Check your work before you report

1. Start your own studio on port `{port}`: from `{project}`, run
   `python3 studio/server.py --port {port}` in the background.
2. From `{studio}/app`, `npm run build` must pass: it type-checks and writes
   `{studio}/candidates/{variant}/`. Open a screen alone at
   `http://127.0.0.1:{port}/candidates/{variant}/<screen>.html?world={variant}`.
3. `python3 {skill-root}/scripts/check_variant.py {studio} --variant {variant}`
   must print `0 problems`.
4. `node {skill-root}/scripts/capture.mjs --url http://127.0.0.1:{port} --out {evidence}/{variant} --variants {variant}`.
   Read `capture.md` and fix sideways scroll, clipped text and console
   errors. Look at the screenshots of every screen at all three sizes and fix
   what looks broken, crowded or empty.
5. `python3 {skill-root}/scripts/check_tokens.py --project {studio}/project.json {studio}/app/src/variants/{variant}`
   must print `0 problems`.
6. `node {skill-root}/scripts/check_components.mjs --url http://127.0.0.1:{port} --variant {variant}`
   must print `0 problems`. Open the studio's **Components** view (`T`) to see
   your screens as trees of parts.
7. Stop your server.

## Report back, briefly

- Your look in one line, and its signature detail.
- Your parts: how many custom, which shadcn parts the build listed.
- One line per screen: what it shows, the main design decision, and which
  reference it borrows from (or why none fits).
- The output of each check, and what you couldn't check.
- Anything missing or inconsistent in the data.
