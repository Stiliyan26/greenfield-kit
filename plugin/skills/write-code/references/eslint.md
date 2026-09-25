# The ESLint preset

`assets/eslint.config.mjs` turns the mechanical rules into checks, so nobody
has to remember them. Install it once per project:

```
python3 <skill-root>/scripts/install_eslint.py <project-root>
```

The script refuses to overwrite an existing config, prints the `npm i -D` line
for whatever is missing, and tells you how to wrap the preset if the project
already has its own rules. Set `SRC` at the top of the config if the frontend
layers don't live under `src/`.

Two things the install gets right that are easy to get wrong by hand:

- `eslint` and `@eslint/js` must stay on the same major. Let `@eslint/js`
  float and it pulls the next major in, after which every `import/*` rule
  reports `Resolve error` on every file.
- `eslint-import-resolver-typescript` is what lets the layer check follow a
  `@/…` alias. The project needs `paths` in its `tsconfig.json` for it to work.

The layer direction is checked twice on purpose: `no-restricted-imports` reads
the import string, so it works even with no resolver, and
`import/no-restricted-paths` follows the resolved file, so it also catches a
relative `../../app/x`. An aliased import that breaks a layer is reported by
both.

After every TypeScript edit, run it on the files you touched:

```
npx eslint --fix <files>
```

Whole-tree lint is optional and slow. Don't make it a required step.

## What it checks, and which rule it replaces

| Check | ESLint rule | Written rule it replaces |
| --- | --- | --- |
| Layer direction `app → pages → features → entities → shared` | `no-restricted-imports`, `import/no-restricted-paths` | structure.md, "Frontend layers" |
| Reaching past a feature's or entity's `index.ts` | `no-restricted-imports` | structure.md, "Frontend layers" |
| No import loops, no self-import | `import/no-cycle`, `import/no-self-import` | structure.md, "Frontend layers" |
| File over 450 real lines | `max-lines` | structure.md, "Splitting a file" |
| `if`/`for` nesting past depth 2 | `max-depth` | typescript.md, "Flat control flow" |
| Nested ternaries | `no-nested-ternary` | typescript.md, "Flat control flow" |
| `else` after a `return` | `no-else-return` | typescript.md, "Flat control flow" |
| Import order, six groups, assets last | `simple-import-sort/imports` | typescript.md, "Import order" |
| Imports the change left unused | `unused-imports/no-unused-imports` | INSTRUCTIONS.md, "Before changing code" |
| Named exports only | `import/no-default-export` | typescript.md, "Names" |
| No `I` prefix, casing per kind | `@typescript-eslint/naming-convention` | typescript.md, "Names" |
| Casts onto object literals | `@typescript-eslint/consistent-type-assertions` | SKILL.md, "Check outside data once" |
| A component defined inside a component | `react/no-unstable-nested-components` | react.md, "Performance" |
| `&&` that can render a `0` | `react/jsx-no-leaked-render` | react.md, "Performance" |
| Hook order and dependencies | `react-hooks/*` | react.md, "Hook and state block order" |
| Real buttons, labels, focus | `jsx-a11y` recommended | react.md, "Forms and data" |
| Inline `/api/…` in a component or hook | `no-restricted-syntax` | typescript.md, "No magic strings" |
| Literal path in `navigate()` or `<Link to>` | `no-restricted-syntax` | react.md, "Routes, API paths, roles, icons" |
| Inline route string in a Nest decorator | `no-restricted-syntax` | typescript.md, "No magic strings" |
| Blank line between block-level siblings | `@stylistic/padding-line-between-statements` | typescript.md, "Blank lines between siblings" |

Tests, fixtures and seeds are exempt from the length, depth and magic-string
rules. Config files, `main.ts`, `pages/` and a Next `app/` route file may
default-export.

## What stays prose, and why

These need a reader who knows what the code means. Don't try to lint them.

- Reuse before writing; share only when two uses really mean the same thing.
- A name that matches what the body does now.
- Narrow parameters: taking the field instead of the parent object.
- Scannable first: happy path at the top, details below.
- Object literals holding only end results.
- Fixing a crash at its cause instead of guarding the symptom.
- Server-side access checks against the record's scope.
- Query order: permission filter, then filters and sort, then paging.
- A union with a `kind` field instead of a bundle of optional fields.

## Dead code across files

ESLint sees one file at a time, so it can't find an export nobody imports. Use
[knip](https://knip.dev) for that, as a separate step before a refactor — not
on every edit.

## Adding a rule

Add one only after a real mistake that a rule would have caught, and only if
it's mechanical. Put the guide line it replaces in the comment next to it, and
delete that line from the prose in the same change — a rule written in two
places drifts.
