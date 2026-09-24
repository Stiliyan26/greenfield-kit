# The design studio

The studio is a local page where the user compares candidate screens, tunes one
look, pins comments, and approves. Approval writes `DESIGN.md` and
`design/tokens.css`, which every later skill builds from.

`<skill-root>` below means the `greenfield-mode` folder.

## Two parts

- **Engine**, shared by every project: `<skill-root>/assets/studio-engine/`.
  The server (`studio_server.py`), the checks and export (`studio_export.py`,
  `studio_color.py`), and the page (`web/`). Never copy it into a project.
- **Content**, one per project: `studio/`. The agent writes `project.json`,
  `candidates/`, `references/` and any data file the candidates load. The page
  writes `selection.json`, `comments.json` and `taste.md`.

`studio/server.py` is a small stub. It looks for the engine in the project's
`.agents/skills/greenfield-mode/` first, then in `~/.agents/skills/`. Run it
from the project root: `python3 studio/server.py`. It prints its URL; add
`--port 4173` for a fixed one.

## Words

- **Layout**: one arrangement of a screen. Each layout has one HTML file per
  screen.
- **World**: one complete look: colors, a display and a body typeface, radius,
  and a signature detail. A world is data in `project.json`, not a file.
- **Status colors**: danger, warning and ok. They are set once per product in
  `project.json`, and the user cannot tune them.

The page has a top bar (rounds, revision, the main action), a left rail
(layouts, worlds, references), a canvas, and an inspector with four tabs:
Colors, Tune, Checks and Comments. The canvas shows one frame at 1440, 1024 or
390 px, or an overview of every layout × world. Fit scales the true width to
the space; 100% shows real pixels. `P` hides the side panels so the frame gets
the width.

## Palettes

A palette is four seed colors: primary, secondary, tertiary and neutral. The
Colors tab shows the applied palette as four role cards, each with an 11-step
tonal scale (0 to 100), and a library below it.

- The engine ships about 40 curated palettes in `web/palettes.json`. Saved
  palettes go to the project's `studio/palettes.json`.
- Picking a palette sets every color token of the current world at once and
  recolors every frame live. The world keeps its fonts and radius.
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

## Rounds

1. **Layout round** (`"round": "layout"`). Two or three layouts, all in the
   `neutral` world, so only the arrangement is judged. The user presses
   **Choose layout**, which writes `layoutChoice` in `selection.json`.
2. **Identity round** (`"round": "identity"`). The chosen layout, usually
   alone, in two or three worlds. The user picks a world for its type and
   shape, browses palettes on it, tunes, and presses **Approve**. The neutral
   world can't be approved. Palettes also work in the layout round, as a
   preview only.

## project.json

```json
{
  "name": "Product",
  "language": "bg",
  "scripts": ["cyrillic"],
  "round": "layout",
  "specimen": { "display": "...", "heading": "...", "body": "...", "label": "...", "rows": [["10:00", "item", "ok"]] },
  "screens": [{ "id": "ops-day", "label": "Operations day" }],
  "layouts": [{ "id": "roster", "name": "Roster", "summary": "...", "previews": { "ops-day": "/candidates/roster.html" } }],
  "worlds": [{
    "id": "paper", "name": "Paper", "summary": "...", "signature": "...",
    "fonts": { "display": "\"Unbounded\", sans-serif", "body": "\"Onest\", sans-serif",
               "google": "family=Unbounded:wght@600;700&family=Onest:wght@400;600" },
    "tokens": {
      "color-bg": "oklch(0.97 0.01 85)", "color-surface": "...", "color-ink": "...",
      "color-muted": "...", "color-line": "...", "color-primary": "...",
      "color-on-primary": "...", "color-accent": "...", "radius-sm": "3px", "radius-md": "6px"
    },
    "type": { "display": { "font": "display", "fontSize": "36px", "fontWeight": 700, "lineHeight": 1.05 } },
    "rules": ["Do ... / Don't ..."]
  }],
  "status": { "danger": "oklch(0.52 0.19 27)", "warning": "oklch(0.52 0.12 70)", "ok": "oklch(0.5 0.12 150)" },
  "statusMeaning": { "danger": "Only a missing deposit", "warning": "...", "ok": "..." },
  "references": [{ "app": "Deputy", "title": "...", "url": "https://mobbin.com/screens/...", "image": "/references/deputy.webp", "note": "what to learn", "screens": ["ops-day"] }]
}
```

- Studio text is in English: screen labels, layout and world names and
  summaries, signatures, status meanings and reference notes. The studio is
  the team's tool. Only the candidate pages and the `specimen` sample text use
  the product's `language`.
- The ten tokens shown are required. A world may add more `color-*`,
  `radius-*`, `space-*` or `shadow-*` tokens.
- Every world also gets `color-secondary`, `color-on-secondary`,
  `color-tertiary`, `color-on-tertiary`, `color-primary-soft`,
  `color-secondary-soft`, `color-tertiary-soft` and `color-surface-2`. A
  palette sets them; otherwise the engine derives them from the core tokens.
  Candidates may use them.
- A world's colors are its starting point. In round 2 the user can replace
  them with any palette, so make worlds differ in type, shape and signature
  first.
- Write colors as `oklch(L C H)` or `#rrggbb`. The tuner edits only `color-*`
  tokens.
- `scripts` names the Google Fonts subsets every font must have, such as
  `cyrillic`.
- The page lists anything missing or wrong in `project.json` in a red box.
  `GET /api/project` returns the same list as `_problems`.

## Candidate files

Each candidate is a plain HTML file that loads the frame script first:

```html
<script src="/_studio/frame.js"></script>
```

The frame script asks `GET /api/tokens?world=<id>` for the finished tokens
(world, tuning, derived palette tokens and status colors), sets them as CSS
variables, loads the world's Google Fonts, reports the page height, and handles
comment pins. So a candidate:

- Uses only `var(--color-…)`, `var(--status-…)`, `var(--font-display)`,
  `var(--font-body)` and `var(--radius-…)`. No hex, rgb, hsl, oklch or font
  names.
- Mixes tints with `color-mix(in oklab, var(--status-warning) 12%, var(--color-surface))`.
  Use oklab, not oklch. A grey or white has hue 0 in oklch, so an oklch mix
  drifts toward red.
- Opens alone at `/candidates/<file>.html?world=<id>`. Add `&tuned=0` to
  ignore the user's tuning.
- Sets `data-*` attributes on meaningful elements, like `data-booking="b4"`.
  Comment pins use them, so pins survive later edits to the markup.

Check candidates with:

```
python3 <skill-root>/scripts/check_tokens.py --project studio/project.json studio/candidates
```

## What the page enforces

- **Contrast** (WCAG 2): 4.5:1 for text pairs and every status color on the
  surface; 3:1 for primary and accent marks.
- **Danger hue guard**: primary or accent may not sit within 30° of the danger
  hue unless it is nearly grey.
- **Fonts**: each family must ship every script in `scripts`. The page asks
  Google Fonts. If it can't reach Google Fonts, it shows "not checked" and
  doesn't block.
- **Approve** stays disabled while any check fails. The server runs the
  contrast and hue checks again before it writes anything.
- A tune after approval returns the revision to draft. The top bar then marks
  the export as outdated.
- Approval refuses to overwrite a `DESIGN.md` or `tokens.css` that the studio
  did not write.

## What the agent reads back

- `selection.json`: `layout`, `world`, `tuning` (the color tokens per world),
  `palette` (the applied palette per world: id, name and seeds), `shortlist`
  (starred palette ids), `feedback`, `status`, `revision`, `layoutChoice`,
  `exported`. Only `status: "approved"` is an approval.
- `comments.json`: each comment's `kind` (`note`, `like`, `reject`), `text`,
  `layout`, `world`, `screen`, `width`, CSS `selector` and `snippet`. Mark a
  comment done after handling it: `POST /api/comments/<id>` with
  `{"status": "done"}`, or edit the file while the page is closed.
- `taste.md`: one line per like or reject, across rounds. Read it before every
  round. Never bring back something the user rejected.

## Scripts

| Script | What it does |
| --- | --- |
| `scripts/init_studio.py <root> --name "<product>"` | Creates `studio/` content. Refuses to overwrite. |
| `node scripts/capture.mjs --url <studio url> --out temp/verification/<run>` | Screenshots every layout × world × width and each world's specimen. Writes `capture.md` with loaded fonts, sideways scroll, clipped text and console errors. Add `--studio` to capture the page itself. |
| `python3 scripts/check_tokens.py …` | Fails on raw colors and font names. |
| `node scripts/test_studio.mjs` | End-to-end test of the engine in a throwaway project. Run it after changing the engine. |

`capture.mjs` and `test_studio.mjs` need Playwright with Chromium. They find
it through `STUDIO_PLAYWRIGHT`, a normal import, or the npx cache. If none
works, they print how to install it.
