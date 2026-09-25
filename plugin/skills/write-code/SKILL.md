---
name: write-code
description: How to write and place code - folder layers, TypeScript style, React components, NestJS modules, and the ESLint preset that checks the mechanical rules. Use before writing or changing TypeScript, React or NestJS code, and when reviewing it.
---

# Write code

Defaults for React/TypeScript and NestJS. Files a framework needs in a fixed
place (like `main.ts`) stay there. If you break a rule, say why.

The mechanical half of these rules is checked, not written down twice: the
ESLint preset in [assets/eslint.config.mjs](assets/eslint.config.mjs) enforces
import order, layer direction, nesting depth, file size, naming, inline route
and API strings, and the React hook rules. Install it once per project:

```
python3 <skill-root>/scripts/install_eslint.py <project-root>
```

Then after every TypeScript edit, run `npx eslint --fix` on the files you
touched. Whole-tree lint is optional. `<skill-root>` is the folder holding this
`SKILL.md`.

What a linter can't judge is below.

## The rules that need a person

- **Reuse before writing.** Look for what exists, by name and by what it does.
  Read it and its callers before reusing it.
- **Share only real sameness.** Two pieces that look alike but mean different
  things stay apart. Never merge different behaviors behind a true/false flag.
- **Names match the body now.** When behavior shrinks, rename it and drop the
  fields that no longer apply. No broad name over a narrow body.
- **Scannable first.** Open a file: the exported function should show its
  intent in a few seconds. Happy path at the top, details below it. If reading
  the export doesn't tell you what the unit does, extract or reorder.
- **Take what you use.** A helper that reads one field takes that field, not
  the whole parent object.
- **Fix a crash at its cause.** No null check added only to silence it, no
  retry or cast that hides a deeper problem.
- **Check outside data once, where it comes in.** API responses, URL params and
  config get checked at the edge. No `as` cast unless the value was checked
  first.
- **Make impossible states impossible.** Model a state as a union with a `kind`
  field, not a bundle of optional fields. When a new case would grow an
  if/else chain or add a second flag that must stay in sync, use a table, map
  or state machine.
- **Leave nothing behind.** When an API, helper or import path changes, update
  every caller and delete the old one in the same change. No re-export shims,
  no old path kept alive next to the new one.
- **Don't invent a look.** Colors, fonts and radius come from
  `design/tokens.css` as `var(--…)`. If the approved design doesn't cover what
  you need, stop and use `design-interface`.

## Where to read more

| File | Read it when |
| --- | --- |
| [structure.md](references/structure.md) | Deciding which folder a file goes in, splitting a file that grew, or sharing code between frontend and backend |
| [typescript.md](references/typescript.md) | Writing or reviewing any `.ts` / `.tsx` file |
| [react.md](references/react.md) | Components, hooks, screens, forms, and frontend performance |
| [backend.md](references/backend.md) | Controllers, services, DTOs, access checks, queries and lists |
| [eslint.md](references/eslint.md) | Installing or changing the preset, or deciding whether a new rule belongs in it |
