# The checks

`bun run check` turns the mechanical rules into tools, so nobody has to
remember them and no reviewer has to find them. Install once per project:

```
python3 <skill-root>/scripts/install_checks.py <project-root>
```

The script copies `.oxlintrc.json`, `eslint.config.mjs` and `knip.json` next
to the project's `package.json`, adds the `check` and `check:fix` scripts, and
prints the `bun add -d` line for whatever is missing. It never overwrites an
existing file without `--force`.

```
bun run check       oxlint → oxfmt --check → tsc --noEmit → eslint → knip
bun run check:fix   the same, with oxlint --fix, oxfmt and eslint --fix
```

Run `check:fix` after every edit on the whole tree; it takes seconds. A task
is done only when `check` prints nothing.

## Who checks what

Five tools, because no single one covers the list. oxlint is the fast
default; ESLint carries the four rules oxlint 1.86 doesn't have.

| Check | Tool and rule | Written rule it replaces |
| --- | --- | --- |
| Layer direction `routes → views → widgets → features → entities → shared` | oxlint `no-restricted-imports` per layer | structure.md, "Layers" |
| Only `*.functions.ts` may import `server/**` | oxlint `no-restricted-imports` + override | structure.md, "Server and browser" |
| Reaching past a slice's `index.ts` | oxlint `no-restricted-imports` | structure.md, "Import rules" |
| No import loops, no self-import | oxlint `import/no-cycle`, `import/no-self-import` | structure.md |
| File over 450 real lines | oxlint `max-lines` | structure.md, "Splitting a file" |
| `if`/`for` nesting past depth 2, nested ternary, `else` after `return` | oxlint `max-depth`, `no-nested-ternary`, `no-else-return` | typescript.md, "Flat control flow" |
| Named exports only (route and config files excepted) | oxlint `import/no-default-export` | typescript.md, "Names" |
| Casts onto object literals, `any` | oxlint `typescript/consistent-type-assertions`, `no-explicit-any` | SKILL.md, "Check outside data once" |
| Hook rules, a component inside a component, `&&` that renders a `0`, keys | oxlint `react/*` | react.md, "Performance" |
| Real buttons, labels, focus | oxlint `jsx-a11y` | react.md, "Forms and data" |
| Formatting | oxfmt | — |
| Types | `tsc --noEmit` | — |
| Exports, files and dependencies nobody uses | knip | CLAUDE.md, "How to work here" |
| Casing per kind, no `I` prefix | ESLint `@typescript-eslint/naming-convention` | typescript.md, "Names" |
| Import order, six groups, assets last | ESLint `simple-import-sort` | typescript.md, "Import order" |
| Blank line between block-level siblings | ESLint `@stylistic/padding-line-between-statements` | typescript.md, "Blank lines between siblings" |
| Layer direction on relative paths the resolver follows | ESLint `import/no-restricted-paths` | structure.md, "Layers" |

Tests, fixtures and seeds are exempt from the length, depth and `any` rules.
Route files, `router.tsx` and config files may default-export.

Checked with `npx oxlint@1.86.0 -c .oxlintrc.json` on a sample: the layer
and depth rules fire; `naming-convention`, `import/order`,
`padding-line-between-statements` and `no-restricted-syntax` are "not found".
Re-check when oxlint moves; a rule it gains leaves the ESLint config.

## What stays prose, and why

These need a reader who knows what the code means. Don't try to lint them.

- Reuse before writing; share only when two uses really mean the same thing.
- A name that matches what the body does now.
- Narrow parameters: taking the field instead of the parent object.
- Scannable first: happy path at the top, details below.
- Object literals holding only end results.
- Fixing a crash at its cause instead of guarding the symptom.
- Server-side access checks as a `where` clause.
- Query order: visibility, then filters and sort, then paging.
- A union with a `kind` field instead of a bundle of optional fields.
- shadcn has it → add it; a composition becomes one reusable part.

## Adding a rule

Add one only after a real mistake that a rule would have caught, and only if
it's mechanical. Prefer oxlint; use the ESLint config only for a rule oxlint
lacks. Put the guide line it replaces in the comment next to it, and delete
that line from the prose in the same change. A rule written in two places
drifts.
