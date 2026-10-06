---
name: write-code
description: How to write and place code - FSD folders for a TanStack Start app on Bun, server functions and server-only files, drizzle, TypeScript style, React, tests, and the checks (oxlint, oxfmt, tsc, knip, a four-rule ESLint config) that catch the mechanical rules. Use before writing or changing TypeScript or React code, and when reviewing it.
---

# Write code

Defaults for one TanStack Start app on Bun: React, TanStack Router, Query,
Table and Form, shadcn + Tailwind, zod, drizzle on Postgres. Files a framework
needs in a fixed place (`src/routes/`, `src/router.tsx`) stay there. If you
break a rule, say why.

The mechanical half of these rules is checked, not written down twice.
`bun run check` runs oxlint, oxfmt, `tsc --noEmit`, knip and a four-rule
ESLint config ([checks.md](references/checks.md)). Install it once per
project:

```
python3 <skill-root>/scripts/install_checks.py <project-root>
```

Run `bun run check` after every edit and before you call any task done. Output
that isn't clean means the task isn't done; the reviewer must never be the one
who finds what a tool can find. `<skill-root>` is the folder holding this
`SKILL.md`.

What a tool can't judge is below.

## The rules that need a person

- **Reuse before writing.** Look for what exists, by name and by what it does.
  Read it and its callers before reusing it.
- **Share only real sameness.** Two pieces that look alike but mean different
  things stay apart. Never merge different behaviors behind a true/false flag.
- **Names match the body now.** When behavior shrinks, rename it and drop the
  fields that no longer apply. No broad name over a narrow body.
- **Names say what and whose.** No bare `data`, `items`, `result`, `handle`
  or `utils`: every name carries its subject (`overdueInvoices`,
  `cancelOrder`). The table is in [typescript.md](references/typescript.md#names-say-what-and-whose).
- **Scannable first.** Open a file: the exported function should show its
  intent in a few seconds. Happy path at the top, details below it. If reading
  the export doesn't tell you what the unit does, extract or reorder.
- **Take what you use.** A helper that reads one field takes that field, not
  the whole parent object.
- **Fix a crash at its cause.** No null check added only to silence it, no
  retry or cast that hides a deeper problem.
- **Check outside data once, where it comes in.** Server function input, URL
  params and env get parsed with zod at the edge. No `as` cast unless the
  value was checked first.
- **Make impossible states impossible.** Model a state as a union with a `kind`
  field, not a bundle of optional fields. When a new case would grow an
  if/else chain or add a second flag that must stay in sync, use a table, map
  or state machine.
- **Leave nothing behind.** When a function, helper or import path changes,
  update every caller and delete the old one in the same change. No re-export
  shims, no old path kept alive next to the new one.
- **Don't invent a look.** Colors, fonts and radius come from
  `design/tokens.css` as `var(--…)`, or through shadcn's class names
  (`bg-primary`), which `design/shadcn.css` points at the same tokens. If the
  approved design doesn't cover what you need, stop and use `design-interface`.
- **shadcn has it → add it.** A primitive shadcn ships (button, dialog, table,
  select, sheet) comes from `bunx shadcn add` into `shared/ui/`. A composition
  shadcn lacks becomes one reusable part in `shared/ui/` (no business meaning)
  or `entities/<thing>/ui/` (one thing's card or row). Never a third copy, and
  never a hand-written dropdown.

## Where to read more

| File | Read it when |
| --- | --- |
| [structure.md](references/structure.md) | Deciding which folder a file goes in, splitting a file that grew, or drawing the line between server and browser code |
| [typescript.md](references/typescript.md) | Writing or reviewing any `.ts` / `.tsx` file |
| [react.md](references/react.md) | Components, hooks, views, routes, forms, and frontend performance |
| [backend.md](references/backend.md) | Server functions, access checks, drizzle queries, migrations, errors |
| [tests.md](references/tests.md) | Writing unit, repository, server-function and e2e tests; what every feature must cover |
| [checks.md](references/checks.md) | Installing or changing `bun run check`, or deciding whether a new rule belongs in it |
