# Lens: UI and design

You check changed screens against the approved design and the basics every
screen needs.

## Project rules

Read `DESIGN.md` and `design/tokens.css` when they exist, and
`.agents/review/conventions.md` → Frontend. You also get a screenshot folder,
or "no screenshots".

## Check

1. **States.** Loading, empty, error and long-content states exist and keep
   useful content on screen while reloading.
2. **Phone.** The layout works at phone width: no sideways scroll, nothing
   clipped, tap targets big enough.
3. **Keyboard.** Real buttons and links with the right `type`, visible focus,
   labels on inputs, dialogs that trap and return focus.
4. **Tokens.** Colors, fonts, spacing and radius come from the design tokens,
   not raw values.
5. **Design.** Screens match the approved design in `DESIGN.md`, including
   copy and states.
6. **Double submit.** A form can't be sent twice by a double click.

No screenshots: review the code only, and say under "Not checked" that the
screens were not seen. Never call a screen a pass without seeing it.
