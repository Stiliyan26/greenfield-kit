# Build the components

The stage right after the user approves a design, before any planning. It
turns the approved design into the app's real components: shadcn/ui for the
ordinary parts, hand-built parts for the rest. The user checks them on one
gallery page. Planning and delivery then build every screen from these
components.

It needs a React app with Tailwind CSS 4. If the project already has a
frontend, set up in it. Otherwise create one in `web/`. `<greenfield-mode>`
below is that skill's folder, in `.agents/skills/` or `~/.agents/skills/`.

## What approval gave you

- `DESIGN.md`: the rules, the approved screens, and the **Components** table.
  Each row says what the part is, which screens show it, a CSS selector to find
  it in the approved screen files, and whether to build it from shadcn or by hand.
- `design/fonts.css`: the font import only.
- `design/tokens.css`: every color, font and radius as a CSS variable.
- `design/shadcn.css`: shadcn's theme, filled in from the tokens.

The studio writes all four. Never edit them; a look change goes back to the studio.

Open the studio's **Components** view (`T`) on the approved model first. It
shows each screen's tree of parts and where each part is reused: the order to
build them in and the states each one needs.

Split and name components as `write-code/references/react.md`, section
"Splitting a screen into components", says: one component per piece of data,
a list and its item as two, one component for the same thing on two screens,
layout that takes children.

## Steps

1. **Set up shadcn** with the `shadcn` skill. In a new app,
   `npx shadcn@latest init -t vite -b radix -p nova -n <app> --no-monorepo -y`
   creates a Vite app with Tailwind and shadcn without asking questions. The template and base are free choices; any preset
   works, because the next step replaces its theme.
2. **Replace shadcn's theme.** `init` writes its own theme into the app's main
   CSS file (`src/index.css` in Vite): an `@theme inline` block, `:root` and
   `.dark` blocks, and a font import such as `@fontsource-variable/geist`.
   Delete all four. Keep its `@custom-variant` line and `@layer base` block.
   The top of the file must then read, in this order:

   ```css
   @import "../design/fonts.css";   /* first: a CSS @import only works before other rules */
   @import "tailwindcss";
   @import "tw-animate-css";
   @import "shadcn/tailwind.css";
   @import "../design/tokens.css";
   @import "../design/shadcn.css";
   ```

   Adjust the relative paths to where `design/` sits. If the Vite dev server
   refuses a file outside the app folder, add that folder to `server.fs.allow`.
   Remove the font package `init` installed. Keep `init`'s
   `@custom-variant dark` line and its theme switch: `tokens.css` and
   `shadcn.css` both carry the approved dark look under `.dark` on `<html>`.
3. **Add the shadcn parts.** Run `npx shadcn@latest add` with every name in
   the Components table's "Build from" column that says `shadcn`, in one
   command.
4. **Check the added files.**
   `python3 <greenfield-mode>/scripts/check_tokens.py --tokens design/tokens.css src/components/ui`
   must print `0 problems`. shadcn sometimes uses Tailwind's own colors, for
   example `bg-black/10` behind a dialog. Replace each one with the shadcn
   name that fits (`bg-foreground/10`), not a raw value.
5. **Prove the theme took.** Render one primary button, one input and one
   card, open the page in a browser, and compare them with the approved
   screen that shows the same part: color, font, corner radius. Do it again
   with `class="dark"` on `<html>` against the studio's dark look (`D`). Check that the
   display and body fonts actually loaded (`document.fonts`). Save a screenshot
   with the task's evidence.
6. **Build the custom parts** from the Components table, one component per
   row. Open the named screens, find the part with its selector, and rebuild
   it in React with `var(--…)` tokens. Keep what the screen shows in every
   state the data has (for example an order that is overdue). Use the
   studio's shared fake data for the examples. Components take their data as
   props; they don't fetch.
7. **Make the gallery.** One page at `/_components` in development shows
   every row of the Components table, in table order: its name, the approved
   screens it comes from, and each state the screens show (for a button:
   primary, quiet, disabled, focused; for an order card: each status the data
   has). Dialogs and menus render open. A switch on the page
   shows the same gallery light and dark.
8. **Check it before the user sees it.**
   - `check_tokens.py --tokens design/tokens.css` on every component file
     prints `0 problems`.
   - Capture the gallery at 1440 and 390, light and dark, and each approved
     screen that the components come from. Put them side by side in the
     evidence folder.
   - Ask the `design-critic` agent to compare each component with its
     approved screen. Under 70, or any score of 1, means fix it first.
9. **The user checks the gallery.** Give the URL and the captures. The user
   says which components don't match. Fix those, or, if the user wants a
   different look, send it back to the studio for a new revision. Move on to
   planning only after the user accepts the gallery.

## An app set up before approval wrote `design/fonts.css`

Older approvals put the font import inside `tokens.css`. After a new approval
it moves to `design/fonts.css`, and an app that imports only `tokens.css`
loses its fonts without an error. Add `@import` of `design/fonts.css` as the
first line of the app's main CSS file, then check `document.fonts` in the
browser.

## Rules while building

- In class names, use shadcn's names (`bg-primary`, `text-muted-foreground`,
  `border-border`, `bg-destructive`). For a token shadcn has no name for,
  write `bg-(--color-surface)` or plain CSS with `var(--color-surface)`.
- shadcn's `secondary` and `accent` are quiet fills: a plain button and a
  hovered menu item. The look's own accent color is `var(--color-accent)`.
- `destructive` is the danger status color. Use it only for what
  `DESIGN.md` says danger means.
- shadcn's `rounded-*` classes follow its own roles, set in `design/shadcn.css`:
  `rounded-lg` is a control, `rounded-xl` a card or dialog, `rounded-4xl` a
  pill, `rounded-md` and `rounded-sm` small inner parts. They don't match the
  `--radius-*` names in `DESIGN.md`. In a custom part, write the approved name:
  `rounded-(--radius-md)` or `border-radius: var(--radius-md)`.
- Never run `shadcn init --force` or `shadcn apply` after setup: both rewrite
  the theme in the main CSS file. If one ran, repeat step 2.
- Change a shadcn part's layout, size and variants freely. Never change its
  colors, fonts or radius; `design/shadcn.css` owns those.
- A part the Components table doesn't list, or a look the approved screens
  don't show, goes back to `design-interface` first.
- Later, a screen is built from these components. Add a new component only
  when the approved design has it, and add it to the gallery too.
