# The checks

`pnpm run check` turns the mechanical rules into tools. Nobody has to remember them and no reviewer has to find them. Install the checks once per project:

```
python3 <skill-root>/stacks/node-tanstack/install_checks.py <project-root>
```

The script copies `.oxlintrc.json`, `eslint.config.mjs` and `knip.json` next
to the project's `package.json`, adds the `check` and `check:fix` scripts, and
prints the `pnpm add -D` line for whatever is missing. It never overwrites an
existing file without `--force`.

```
pnpm run check       oxlint → oxfmt --check → tsc --noEmit → eslint → knip
pnpm run check:fix   the same, with oxlint --fix, oxfmt and eslint --fix
```

Run `check:fix` on the whole tree after each edit. It takes seconds. A task is done only when `check` prints nothing.

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
| `if`/`for` nesting past depth 2, nested ternary, `else` after `return` | oxlint `max-depth`, `no-nested-ternary`, `no-else-return` | clean-code.md, "Flat control flow" |
| Named exports only (route and config files excepted) | oxlint `import/no-default-export` | clean-code.md, "Names" |
| Casts onto object literals, `any` | oxlint `typescript/consistent-type-assertions`, `no-explicit-any` | write-code SKILL.md, "Check outside data once" |
| Hook rules, a component inside a component, `&&` that renders a `0`, keys | oxlint `react/*` | react-screens.md, "Performance" |
| Real buttons, labels, focus | oxlint `jsx-a11y` | react-screens.md, "Forms and data" |
| Formatting | oxfmt | — |
| Types | `tsc --noEmit` | — |
| Exports, files and dependencies nobody uses | knip | clean-code.md, "Leave nothing behind" |
| Casing per kind, no `I` prefix | ESLint `@typescript-eslint/naming-convention` | clean-code.md, "Names" |
| Import order, six groups, assets last | ESLint `simple-import-sort` | typescript.md, "Import order" |
| Blank line between block-level siblings | ESLint `@stylistic/padding-line-between-statements` | clean-code.md, "Blank lines between siblings" |
| Layer direction on relative paths the resolver follows | ESLint `import/no-restricted-paths` | structure.md, "Layers" |

Tests, fixtures and seeds are exempt from the length, depth and `any` rules.
Route files, `router.tsx` and config files may default-export.

Checked with `npx oxlint@1.86.0 -c .oxlintrc.json` on a sample: the layer
and depth rules fire; `naming-convention`, `import/order`,
`padding-line-between-statements` and `no-restricted-syntax` are "not found".
Re-check when oxlint moves; a rule it gains leaves the ESLint config.

## What stays prose

A tool cannot judge what code means. The rules in the write-code SKILL.md and in clean-code.md that no row above covers stay prose. Do not try to lint them.

## Adding a rule

Add a rule only after a real mistake that the rule would have caught, and only if it is mechanical. Prefer oxlint. Use the ESLint config only for a rule that oxlint lacks. Put the guide line that the rule replaces in the comment next to it. Delete that line from the prose in the same change.

Reason: a rule written in two places drifts.
