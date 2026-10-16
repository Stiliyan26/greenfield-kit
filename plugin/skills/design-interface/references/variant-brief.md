# Brief for a model that builds one variant

## Contents

- Read first
- Deliver
- Rules for every screen
- Check your work
- Report back

The lead agent fills in every `{placeholder}` and sends the same text to each
model. Only `{variant}`, `{model}` and `{port}` differ. Paths are absolute.
`{skill-root}` is the `design-interface` folder.

---

You are one of up to three models that design the same product on your own.
The user compares how different models design it. Give your own best answer.
Do not open the other variants' folders.

Your variant id is `{variant}`. You are `{model}`.

## Read first

- The brief: `{brief}`.
- `{studio}/project.json`: the screens (each with its role and requirement),
  the language, the font scripts, the status colors with their meanings, and
  the specimen text.
- The shared sample data: `{studio}/app/src/data.ts`. Import it as `@/data`.
  Use only this data, so every variant shows the same content. You may
  compute values from it. Do not edit it. Report what is missing.
- `{studio}/taste.md`: what the user liked and rejected. Never repeat a
  reject.
- The references: open every image in `{studio}/references/` and read its
  note in `project.json`. The notes alone are not enough.
- `{skill-root}/references/studio.md`, sections "The studio app",
  "variant.json" and "Screens".
- `{skill-root}/references/visual-quality.md` and
  `{skill-root}/references/choose-a-look.md`.
- The `shadcn` skill's rules for composition, forms and styling, and the
  parts in `{studio}/app/src/components/ui/`. Every shadcn part is
  installed. Never run `shadcn add` or `npm install`. Never edit anything
  outside your folder.

## Deliver

Write only in `{studio}/app/src/variants/{variant}/`.

1. `variant.json`: your model name, a one-line summary of your idea, and your
   look (`world`).
   - Fonts: a real Google Fonts pair that covers `{scripts}`.
   - Tokens: all required tokens, colors in `oklch()`, a radius scale, and
     one signature detail.
   - Dark look (`world.dark`): the same color roles, as considered as the
     light look. Not an inverted copy.
   - The format is in `studio.md`.
2. `screens/<screen id>.tsx` for every screen in `project.json`: a React
   component, default export, no props. Build it from the shadcn parts in
   `@/components/ui/*` and your own parts in `parts/`. This code is the
   product's front end after approval. Split it into parts:
   - A list and its item are two parts.
   - When two screens show the same thing (a person, an order, an invoice),
     use one part with its looks. Do not draw it twice.
   - The page shell and the page header are parts when every screen has them.
   - Use a shadcn part wherever one fits (button, input, select, dialog,
     tabs, table, badge, card). Build a part by hand only when shadcn has
     none. Put `data-part="<name>"` on its root.
3. In `variant.json`, a `components` list of your **custom** parts: one entry
   per part, `shadcn: null`, and a `[data-part=…]` selector.
   - Add a shadcn overlay that a screen shows only as a trigger (a dialog, a
     menu): set `shadcn` and a selector on its trigger.
   - The build lists every other shadcn part from your imports.
   - A structure drawn more than once that is not a part goes in
     `notComponents` with a reason.

## Rules for every screen

- Color only through shadcn's names (`bg-primary`, `text-muted-foreground`,
  `border-border`, and `bg-destructive` for danger only) or `var(--color-…)`,
  `var(--status-…)`, `var(--radius-…)`.
- Use only the fonts `font-sans` and `font-heading`.
- Use no Tailwind palette class, no raw color and no font name.
- Mix tints with `color-mix(in oklab, …)`. Never mix with white or black.
- Write all visible text in `{language}`.
- Make every screen work at 1920×1080, 1440×900 and 390×844. The studio
  shows the first screenful. The main job must be visible without scrolling
  at each size.
- Design the phone as its own arrangement. No sideways scroll. No text under
  11 px.
- Make every screen work in both looks. The studio's `D` key switches them.
  shadcn's variables follow the tokens, so dark comes from the tokens alone.
- Keep the status meanings in `statusMeaning` on every screen.
- Keep primary, secondary and accent at least 30° of hue from the danger
  color, and 20° from the warning color.
- Product rules: {rules}
- Show the difficult states the data holds. Render a needed dialog or menu
  open on a screen, or list it with its trigger.
- Give keyboard focus a visible style. Buttons may be mock-ups but must look
  real.
- Spend your originality on layout, density, type and custom parts. A design
  of only shadcn defaults reads as a template. Change sizes, spacing and
  structure. Never change a shadcn part's colors.

## Check your work

Report each check's real output.

1. Start your studio on port `{port}`. From `{project}`, run
   `python3 studio/server.py --port {port}` in the background.
2. From `{studio}/app`, run `npm run build`. It type-checks and writes
   `{studio}/candidates/{variant}/`. Open one screen at
   `http://127.0.0.1:{port}/candidates/{variant}/<screen>.html?world={variant}`.
3. Run `python3 {skill-root}/scripts/check_variant.py {studio} --variant {variant}`.
   Done when it prints `0 problems`.
4. Run `node {skill-root}/scripts/capture.mjs --url http://127.0.0.1:{port} --out {evidence}/{variant} --variants {variant}`.
   Read `capture.md`. Fix sideways scroll, clipped text and console errors.
   Look at every screen at all three sizes. Fix what looks broken, crowded or
   empty.
5. Run `python3 {skill-root}/scripts/check_tokens.py --project {studio}/project.json {studio}/app/src/variants/{variant}`.
   Done when it prints `0 problems`.
6. Run `node {skill-root}/scripts/check_components.mjs --url http://127.0.0.1:{port} --variant {variant}`.
   Done when it prints `0 problems`. The studio's **Components** view (`T`)
   shows your screens as trees of parts.
7. Stop your server.

## Report back

Be brief.

- Your look in one line, and its signature detail.
- Your parts: how many custom, and which shadcn parts the build listed.
- One line per screen: what it shows, the main design decision, and which
  reference it borrows from (or why none fits).
- The output of each check, and what you could not check.
- Anything missing or inconsistent in the data.
