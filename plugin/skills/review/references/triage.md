# Triage rules

`scripts/triage.mjs` collects the target and plans the agents. It's a script,
not an agent, so the same target always gets the same plan.

## Areas

1. The script drops lock files, generated files, binaries and anything under
   `temp/` (they go under "skipped").
2. It groups files by top folder. A folder too big for one reviewer is split
   one level deeper, again and again, down to single files.
3. If everything fits one reviewer (3,000 changed lines for a diff, 8,000
   lines for `--app`), there is one area.
4. Otherwise it sorts the groups by risk, then size, and fills up to 4 areas.
   A group joins the first area it fits in, or opens a new one. When 4 areas
   are full, the rest go under "not reviewed".

Risk, highest first: access or data paths, then contract paths, then other
source, then docs. A project rule counts as highest risk.

## Lenses per area

| Lens | Runs when the area has |
| --- | --- |
| `correctness`, `fit`, `scope` | any file |
| `access` | a path that looks like a controller, guard, auth, policy, permission, access, role, middleware, service, repository, route or resolver file |
| `data` | an entity, migration, repository, SQL, Prisma, seed or pagination file |
| `contract` | a DTO, contract, OpenAPI, API paths, schema or enum file; or frontend or backend source, when both sides changed |
| `ui` | a `.tsx`, `.jsx`, `.vue`, `.svelte` or style file, the tokens, or `DESIGN.md` |
| `tests` | any source or test file |
| `blind-spot` | any code file; always last |

An area of docs only gets `scope` alone. Rules look at code paths only, so a
Markdown file named `pagination.md` doesn't start `data`. `--quick` gives
every area `correctness` and `fit` only.

## Project rules (optional)

Most projects need none. A project can add `.agents/review/triage.json`
([template](../assets/project-rules/triage.json)):

```json
{
  "rules": [
    { "lens": "access", "why": "billing is money", "paths": ["^server/src/billing/"] }
  ],
  "always": [],
  "never": [],
  "ignore": ["^server/src/legacy/"],
  "linesPerAgent": { "diff": 3000, "app": 8000 },
  "maxAgents": 5
}
```

- `rules[].paths` are regular expressions, matched case-insensitively. A path
  that matches also counts as highest risk.
- `always` adds lenses to every area; `never` removes them. Use lens names:
  `correctness`, `access`, `data`, `contract`, `ui`, `tests`, `fit`, `scope`,
  `blind-spot`. The script stops with an error on any other name.
- `ignore` leaves matching paths out of the review, like lock files.
- `linesPerAgent` sets how much one reviewer gets.
- `maxAgents` lowers the cap. It can't raise it above 5.
