# The design studio

The studio is a local page where the user sees every screen the brief names,
as designed by up to three models, at three screen sizes. The user compares
the models, picks one, tunes its colors, pins comments, and approves. Approval
writes `DESIGN.md` (with its Components table), `design/fonts.css`, `design/tokens.css` and `design/shadcn.css`, which every later skill builds from.

`<skill-root>` below means the `design-interface` folder.

## Two parts

- **Engine**, shared by every project: `<skill-root>/assets/studio-engine/`.
  The server (`studio_server.py`), the checks and export (`studio_export.py`,
  `studio_color.py`), and the page (`web/`). It holds nothing about any one
  product. Never copy it into a project.
- **Content**, one per project: `studio/`. The lead agent writes
  `project.json`, the shared data in `app/src/data.ts` and `references/`.
  Each model writes its own `app/src/variants/<id>/` folder, and its build
  writes `candidates/<id>/`. The page writes `selection.json`,
  `comments.json` and `taste.md`.

`studio/server.py` is a small stub. It finds the engine in this order: the
`STUDIO_ENGINE` variable; `studio/.engine-path`, which `init_studio.py` writes
(and a `.gitignore` keeps out of git); a `plugin/` or `.agents/` folder in any
parent directory; `~/.agents/skills/`; then the Claude Code plugin cache,
newest first. Run it from the project root: `python3 studio/server.py`. It
prints its URL; add `--port 4173` for a fixed one.

## Words

- **Screen**: one view the brief names, such as an order inbox or a pay page.
  It records who uses it (`role`) and the requirement it answers.
- **Variant**: one model's design of the whole product: every screen plus its
  own look. One model gives one variant; two or three models give two or
  three, never more. Every model gets the same brief and designs freely.
- **Look** (`world` in the files): colors, a display and a body typeface,
  radius, and a signature detail. Each variant brings its own.
- **Sizes**: every screen is shown at 1920×1080 (desktop), 1440×900 (laptop)
  and 390×844 (phone). The engine fixes them; projects don't choose.
- **Status colors**: danger, warning and ok. They are set once per product in
  `project.json`, and nobody can tune them.

## The page

A top bar (revision, Approve), a left rail (screens by role, the specimen,
references), tabs above the canvas, and an inspector with four tabs: Colors,
Tune, Checks and Comments.

The tabs are one per model, named by the model, then **Arena**. The canvas
shows exact-size frames: a 1920×1080 frame keeps that shape, scaled down to
fit. Drag or scroll to pan; Ctrl-scroll or pinch to zoom; `-`, `+` and `0`
(fit) work too.

- **A model's tab**: that model's screens. One row per size, each row boxed
  and labelled with its size, the screens left to right.
- **Arena** (`M`): one row per model, labelled with the model. In each row the
  three size boxes sit side by side.
- **A screen from the rail**: that screen from every model. Models across,
  each frame named by its model; sizes down.
- **One screen alone**: double-click a frame, press **Open** or `Enter`. It
  shows one screen from one model at 1920, 1440 or 390, fitted or at real
  size, and scrolls. **Back** returns to the canvas.
- **Components** (`T` or the **Components** button, again to hide): how the
  selected model builds its screens from parts. **Screen** shows the screen
  beside its tree of parts (`OrdersPage → CustomerList → CustomerRow ×6`),
  each line `custom` or its shadcn name, "opens" for the dialogs and menus a
  part opens. Hover links the line and the screen both ways. A click
  spotlights a part: the rest dims, `‹ 2 of 6 ›` steps through its
  instances, **Zoom in** brings one close, and the card shows its looks and
  the screens that reuse it. **×**, `Esc` or a click on empty space clears
  it. **Parts** is a catalog with a live crop of every part. **Reuse** shows
  every part against every screen. Structures drawn more than once that no
  part covers show in amber as **not listed**. The view reads the screens
  with `web/component-scan.js`, the same reader `check_components.mjs` uses.

Click a frame to select it; the Colors, Tune and Checks tabs work on the
selected model's look. Comments work everywhere: press `C`, then click an
element in any frame. `J` and `K` step through screens. `A` returns to the
selected model's tab. `Esc` leaves one screen alone; `F` switches it between
fitted and real size. `[` and `]` hide one side panel, `P` both. `?` lists
every shortcut. `/?view=arena`, `model`, `screen` or `frame` opens a view directly;
otherwise the page reopens on the view you last used.

## Palettes

A palette is four seed colors: primary, secondary, tertiary and neutral. The
Colors tab shows the applied palette as four role cards, each with an 11-step
tonal scale (0 to 100), and a library below it.

- Each model's own colors stay in its `variant.json`; the studio never changes
  that file. Palettes and tuning live per model in `selection.json`.
  **Original colors** lists every model: **Restore** resets only that model,
  **Restore all** resets every model.
- The engine ships about 40 curated palettes in `web/palettes.json`. Saved
  palettes go to the project's `studio/palettes.json`.
- Picking a palette sets every color token of the selected model's look at
  once and recolors its frames live. The look keeps its fonts and radius.
- `←` and `→` step through the filtered library from anywhere on the page.
  `S` stars a palette into the shortlist. Filters: mood tags, shortlist,
  search, and "hide palettes that fail this project's checks".
- Each palette row says whether it passes this project's checks. "Clashes"
  means a role sits too close to the danger red.
- Click a role card to change that seed. "Generate from one color" makes five
  harmonies: monochrome, analogous, complementary, split complementary and
  triadic.
- The mapping: neutral gives bg, surface, surface-2, line, muted and ink. Each
  of primary, secondary and tertiary gives its role color, an `on-` color for
  text on it, and a `-soft` tint. A role darkens only as far as it must to
  reach 3:1 on the surface and 4.5:1 for its text. Accent is the tertiary.
- Tune still works after a palette: it edits single tokens, and the palette
  name then shows "tuned".
- On approval, `DESIGN.md` records the palette and its tonal scales, and
  `tokens.css` adds `--primary-0` to `--neutral-100`.

## project.json

The lead agent writes it. It holds product facts only, no designs:

```json
{
  "name": "Product",
  "language": "bg",
  "scripts": ["cyrillic"],
  "specimen": { "display": "...", "heading": "...", "body": "...", "label": "...", "search": "...",
                "rows": [["10:00", "item", "ok"]], "statusLabels": { "ok": "...", "warning": "...", "danger": "..." },
                "parts": "/specimen-parts.html" },
  "screens": [
    { "id": "orders", "label": "Orders", "role": "Staff", "requirement": "Staff see today's orders and which are late." },
    { "id": "my-invoices", "label": "My invoices", "role": "Customer", "requirement": "Customers see their own invoices." }
  ],
  "status": { "danger": "oklch(0.52 0.19 27)", "warning": "oklch(0.52 0.12 70)", "ok": "oklch(0.5 0.12 150)" },
  "statusMeaning": { "danger": "Only an overdue invoice", "warning": "...", "ok": "..." },
  "references": [{ "app": "Linear", "title": "...", "url": "https://mobbin.com/screens/...", "image": "/references/linear.webp", "note": "what to learn", "screens": ["orders"] }]
}
```

- `screens` lists every view the brief's confirmed requirements name, one
  screen per view. `role` groups screens in the rail; `requirement` quotes or
  closely restates the brief. Owner ideas and unknowns get no screen until
  they are confirmed.
- Studio text is in English: screen labels, summaries, signatures, status
  meanings and reference notes. The studio is the team's tool. Only the
  screens and the `specimen` sample text use the product's `language`.
- `scripts` names the Google Fonts subsets every font must have, such as
  `cyrillic`.
- `specimen` is the sample text on each model's "Fonts and colors" page.
  `rows` are table rows of time, item and status (`ok`, `warning` or
  `danger`); `statusLabels` names those statuses in the product's language.
  `parts` is optional: an HTML fragment in `studio/`, such as
  `/specimen-parts.html`, with a few of the product's own parts (an order
  card, a status tag). The lead agent writes it with tokens only, like a
  screen, so every model's look shows on it.
- The page lists anything missing or wrong in the red box: in `project.json`,
  in a `variant.json`, a screen without a file, or a fourth variant.
  `GET /api/project` returns the same list as `_problems`.

## The studio app

`studio/app/` is one Vite + React + Tailwind 4 + shadcn/ui app for every
model's design. `init_studio.py` creates it and installs every shadcn part into
`src/components/ui/`. The lead agent writes the shared sample data in
`src/data.ts`. Each model writes only its own folder, `src/variants/<id>/`, so
parallel models never touch the same file. Use short ids such as `opus`,
`sonnet` or `fable`.

```text
studio/app/src/
  data.ts                         # shared sample data, typed; the lead writes it
  components/ui/*.tsx             # every shadcn part, installed once; nobody edits
  studio-theme.css                # shadcn's variables → the studio's live tokens
  variants/<id>/
    variant.json                  # the look, the custom parts, notComponents
    screens/<screen id>.tsx       # one per screen in project.json; default export
    parts/*.tsx                   # the custom parts the screens are built from
```

`npm run build` in `studio/app` type-checks, then writes
`studio/candidates/<id>/<screen>.html` for every screen and variant, the
shared `studio/candidates/assets/`, and `studio/candidates/<id>/variant.json`:
the model's `variant.json` plus one entry for every shadcn part its screens
import (`Button`, `Card`, `Tabs`, …, found later by `data-slot`). The engine
reads only `candidates/`; nothing lists variants in `project.json`.

`npm run dev` serves the same pages at `/<id>/<screen>.html?world=<id>` with
the studio's tokens through a proxy; the studio server must be running
(`STUDIO_URL`, default `http://127.0.0.1:4173`).

A studio made with `--no-app` holds hand-written HTML candidates instead:
`studio/candidates/<id>/variant.json` and one `<screen id>.html` per screen,
each loading `/_studio/frame.js` first and using only `var(--…)` tokens.
Older studios work that way and still open.

## variant.json

```json
{
  "model": "Claude Opus 5.5",
  "summary": "One line on the design idea.",
  "world": {
    "name": "Paper", "summary": "...", "signature": "...",
    "fonts": { "display": "\"Unbounded\", sans-serif", "body": "\"Onest\", sans-serif",
               "google": "family=Unbounded:wght@600;700&family=Onest:wght@400;600" },
    "tokens": {
      "color-bg": "oklch(0.97 0.01 85)", "color-surface": "...", "color-ink": "...",
      "color-muted": "...", "color-line": "...", "color-primary": "...",
      "color-on-primary": "...", "color-accent": "...", "radius-sm": "3px", "radius-md": "6px"
    },
    "dark": { "color-bg": "oklch(0.18 0.01 260)", "...": "..." },
    "type": { "display": { "font": "display", "fontSize": "36px", "fontWeight": 700, "lineHeight": 1.05 } },
    "rules": ["Do ... / Don't ..."]
  },
  "components": [
    { "name": "Order card", "what": "One order: number, customer, note, one action.",
      "screens": ["orders", "returns"], "selector": "[data-part=order-card]", "shadcn": null },
    { "name": "Confirm dialog", "what": "Asks before an order is cancelled.",
      "screens": ["orders"], "selector": "[data-part=cancel]", "shadcn": "dialog" }
  ]
}
```

- `model` names the model that actually ran. `order` (a number) may set the
  tab order; otherwise the folder name does.
- The ten tokens shown are required. A look may add more `color-*`,
  `radius-*`, `space-*` or `shadow-*` tokens.
- Every look also gets `color-secondary`, `color-on-secondary`,
  `color-tertiary`, `color-on-tertiary`, `color-primary-soft`,
  `color-secondary-soft`, `color-tertiary-soft` and `color-surface-2`. A
  palette sets them; otherwise the engine derives them from the core tokens.
  Screens may use them. `color-on-status` is the text color on a solid
  danger fill, derived for each look; approval checks its contrast.
- Write colors as `oklch(L C H)` or `#rrggbb`. The tuner edits only `color-*`
  tokens.
- `components` lists the **custom** parts, one entry per part, not per use:
  what the screens are built from that shadcn doesn't have (an order card, a
  timeline, a page shell). `name` and `what` say what it is; `screens` are
  screen ids; `selector` finds it in the built page, best a `data-part`
  attribute the part sets on its root. `shadcn` is `null` for a custom part.
  A shadcn overlay the screen only shows the trigger for (a dialog, a menu)
  is listed too, with `shadcn` set and a selector on its trigger. The build
  adds every other shadcn part from the imports. List a list and its item as
  two parts, and use one part when two screens show the same thing.
  Approval refuses a variant without this list and writes it into `DESIGN.md`.
- `world.dark` holds the dark look: the same `color-*` roles as `tokens` (the
  eight core colors are required), for a dark screen. The world's radius and
  other tokens carry over. Tuning and palettes change the light look only.
  `project.json` may set `statusDark`: the status colors for dark surfaces,
  same hues, lighter. `"themes": ["light"]` in `project.json` turns dark off
  for a product.
- `notComponents` (optional) lists structures drawn more than once that are
  not parts, each `{ "selector": ".row", "why": "plain layout row" }`. The
  components check and the Components view skip them.
- Check a variant with `python3 <skill-root>/scripts/check_variant.py studio --variant <id>`,
  then its parts with `node <skill-root>/scripts/check_components.mjs --url <studio url> --variant <id>`.

## Screens

A screen is a React component that default-exports from
`src/variants/<id>/screens/<screen id>.tsx`, takes no props and reads what it
shows from `@/data`. It is built from the shadcn parts in `@/components/ui/*`
and the variant's own parts in `../parts/*`.

The built page loads `/_studio/frame.js` first. The frame asks
`GET /api/tokens?world=<variant>` for the finished tokens (the variant's look,
tuning, derived palette tokens and status colors), sets them as CSS variables
on `:root`, loads the look's Google Fonts, reports the page height, and
handles comment pins. `studio-theme.css` points shadcn's variables at those
tokens, so `bg-primary`, `text-muted-foreground`, `border-border` and
`rounded-lg` follow every palette, tune and the dark switch live. So a screen:

- Colors with shadcn's names (`bg-primary`, `text-muted-foreground`,
  `border-border`, `bg-destructive` only for danger) or `var(--color-…)`,
  `var(--status-…)`, `var(--radius-…)`. Fonts with `font-sans` (body) and
  `font-heading` (display). Never Tailwind's own palette (`bg-red-500`,
  `text-white`), raw hex, rgb, hsl, oklch or font names.
- Mixes tints with `color-mix(in oklab, var(--status-warning) 12%, var(--color-surface))`.
  Use oklab, not oklch. A grey or white has hue 0 in oklch, so an oklch mix
  drifts toward red.
- Works at 1920×1080, 1440×900 and 390×844, with its main job visible in the
  first screenful at each size, and in both looks (the studio's `D` key).
- Shows every state the data holds; a dialog or menu the design needs is
  rendered open on a screen or listed with its trigger.
- Opens alone at `/candidates/<variant>/<screen>.html?world=<variant>`. Add
  `&tuned=0` to ignore the user's tuning, `&theme=dark` for the dark look.
- Sets `data-part` on each custom part's root and `data-*` attributes on
  meaningful elements, like `data-order="o4"`. Comment pins and the
  components check use them, so they survive later edits.

Check screens with:

```
python3 <skill-root>/scripts/check_tokens.py --project studio/project.json studio/app/src/variants
```

## What the page enforces

- **Contrast** (WCAG 2): 4.5:1 for text pairs and every status color on the
  surface; 3:1 for primary and accent marks.
- **Danger hue guard**: primary, secondary or accent may not sit within 30° of
  the danger hue unless it is nearly grey; 20° for the warning hue.
- **Fonts**: each family must ship every script in `scripts`. The page asks
  Google Fonts. If it can't reach Google Fonts, it shows "not checked" and
  doesn't block.
- **Approve** approves the selected model's design. It stays disabled while
  any check fails. The server runs the contrast and hue checks again before it
  writes anything.
- A tune after approval returns the revision to draft. So does a change on
  disk to `project.json` or the approved model's folder. The top bar then marks
  the export as outdated, and the user approves again.
- Approval writes four files. `DESIGN.md` holds the rules, the approved
  screens and the Components table. `design/fonts.css` holds only the font
  import, because a CSS `@import` is dropped unless it comes first.
  `design/tokens.css` holds every token. `design/shadcn.css` fills shadcn/ui's
  theme variables from the tokens and replaces the theme `shadcn init` writes.
- `D` or the moon button switches the studio and every screen to the dark
  look. The Checks tab lists the contrast and hue checks for both looks, and
  approval runs both. Approval writes the dark look under `.dark` and
  `[data-theme="dark"]` in `tokens.css` and `shadcn.css`, and a dark table in
  `DESIGN.md`.
- Approval refuses a variant without a `components` list or a dark look, and refuses to
  overwrite any of the four files that the studio did not write. The page
  says when the chosen model's list is missing and keeps Approve disabled.
- A project approved before `design/fonts.css` existed has the font import in
  `tokens.css`. Re-approval moves it; an app then needs `design/fonts.css`
  imported first (`references/promote.md`).

## What the agent reads back

- `selection.json`: `variant` (the selected model's design), `screen`,
  `width`, `tuning` (color tokens per variant), `palette` (the applied palette
  per variant: id, name and seeds), `shortlist` (starred palette ids),
  `feedback`, `status`, `revision`, `exported`. Only `status: "approved"` is
  an approval.
- `comments.json`: each comment's `kind` (`note`, `like`, `reject`), `text`,
  `variant`, `screen`, `width`, CSS `selector` and `snippet`. Mark a comment
  done after handling it: `POST /api/comments/<id>` with `{"status": "done"}`,
  or edit the file while the page is closed.
- `taste.md`: one line per like or reject. Read it before every design pass.
  Never bring back something the user rejected.

## Scripts

| Script | What it does |
| --- | --- |
| `scripts/init_studio.py <root> --name "<product>" [--no-app]` | Creates `studio/` and `studio/app/` (npm install + every shadcn part). Refuses to overwrite. `--no-app` for hand-written HTML candidates. |
| `python3 scripts/check_variant.py studio [--variant <id>]` | Lists problems in `project.json` and `variant.json`, screens without a file, and failing contrast and hue checks. |
| `node scripts/check_components.mjs --url <studio url> [--variant <id>]` | Finds each listed part in the built screens (custom by selector, shadcn by `data-slot`) and lists what is drawn more than once but not listed. |
| `python3 scripts/check_tokens.py …` | Fails on raw colors, Tailwind's own palette classes and font names. |
| `node scripts/capture.mjs --url <studio url> --out temp/verification/<run>` | Screenshots every screen × variant × size, full page, and each variant's specimen. Writes `capture.md` with loaded fonts, sideways scroll, clipped text and console errors. Add `--studio` to capture the page itself and its Arena. Narrow with `--variants`, `--sizes`, `--screens`. |
| `python3 scripts/promote_variant.py <root> [--check --studio-url <url>]` | After approval: copies the studio app with only the approved variant to `web/`, one route per screen, the approved `design/` files in place of the live theme; installs and builds. `--check` runs the comparison below. |
| `node scripts/compare_screens.mjs --app web --studio-url <url> --variant <id>` | Captures every route of the promoted app next to the studio's page at three sizes, light and dark, and reports the share of pixels that differ (threshold 1%). Writes `compare.md`. |
| `node scripts/test_studio.mjs` | End-to-end test of the engine in a throwaway project with HTML candidates. Run it after changing the engine. |
| `node scripts/test_app.mjs` | End-to-end test of the app flow: init, a React variant, build, checks, approval, promotion, comparison. Installs packages twice, so it takes minutes. |

`capture.mjs`, `compare_screens.mjs` and the tests need Playwright with Chromium. They find
it through `STUDIO_PLAYWRIGHT`, a normal import, or the npx cache. If none
works, they print how to install it.

The brief every model gets is [variant-brief.md](variant-brief.md).
