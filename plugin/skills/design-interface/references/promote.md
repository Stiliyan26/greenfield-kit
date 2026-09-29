# Promote the approved design

The stage right after the user approves a design. The approved variant is
already React + shadcn code, so nothing is rebuilt: the variant is copied into
the app, its screens become routes, the live studio theme is swapped for the
approved `design/` files, and a pixel comparison proves the app shows what the
user approved. It runs in the background while planning goes on with the user,
and needs no decisions from them.

## What approval gave you

- `DESIGN.md`: the rules, the approved screens, and the **Components** table:
  every part, custom or shadcn, with the screens it is on and a selector.
- `design/fonts.css`: the font import only.
- `design/tokens.css`: every color, font and radius as a CSS variable.
- `design/shadcn.css`: shadcn's theme, filled in from the tokens, with the
  same mapping the studio used live.

The studio writes all four. Never edit them; a look change goes back to the
studio.

## Steps

1. With the studio running, from the project root:

   ```
   python3 <design-interface>/scripts/promote_variant.py . --check --studio-url http://127.0.0.1:4173
   ```

   It creates `web/` from `studio/app/`: `src/design/screens/` and
   `src/design/parts/` are the approved variant, `src/data.ts` is the sample
   data, `src/main.tsx` mounts one route per screen (`/<screen id>`, the first
   screen at `/`), and `src/index.css` imports `design/fonts.css`,
   `design/tokens.css` and `design/shadcn.css` in place of the live theme.
   Then it installs, type-checks and builds. It refuses to overwrite an
   existing `web/`; move it first.
2. `--check` captures every route at 1920, 1440 and 390, light and dark, next
   to the studio's own page, and writes
   `temp/verification/promote/compare.md` with the share of pixels that
   differ per capture. Under 1% passes. Above it, open the two captures it
   names; the usual causes are a font that did not load, a `lang` mismatch,
   or a screen that reads the URL. Fix the cause in the app, never by editing
   the `design/` files, and run the check again.
3. Motion. With the routes matching, use `design-animations` on the promoted
   screens: transitions between states the data has, dialogs and menus
   opening, lists changing. Purposeful motion only, with a reduced-motion
   alternative. Run the comparison again afterwards at rest; motion must not
   change a screen's resting look.
4. Report: the routes, the comparison result, the motion added, and what
   could not be checked. The user opens `web/` (`npm run dev`) and accepts it,
   or names what doesn't match.

## After promotion

- Screens show `src/data.ts` until the plan's API exists. Wiring them to real
  data is delivery work and follows the plan's contract.
- `src/design/` is the approved look. Delivery builds new screens from the
  same shadcn parts and `src/design/parts/`, with `design/tokens.css` names;
  `check_tokens.py --tokens design/tokens.css` on changed UI files stays the
  rule. A new part or a changed look goes back to the studio for a new
  revision, then a new promotion of the changed screens.
- shadcn's `rounded-*` roles follow `design/shadcn.css`: `rounded-lg` is a
  control, `rounded-xl` a card or dialog, `rounded-4xl` a pill. They match
  what the studio showed, because the studio mapped them the same way.
- Never run `shadcn init --force` or `shadcn apply` in `web/`: both rewrite
  the theme in `src/index.css`.
