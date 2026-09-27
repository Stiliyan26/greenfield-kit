# Triage rules

`scripts/triage.mjs` picks reviewers from the changed paths. It's a script, not
an agent, so the same diff always gets the same reviewers.

| Reviewer | Runs when |
| --- | --- |
| `review-correctness` | always |
| `review-fit` | always |
| `review-scope` | always |
| `review-access` | a path looks like a controller, guard, auth, policy, permission, access, role, middleware, service, repository, route or resolver file |
| `review-contract` | a DTO, contract, OpenAPI, API paths, schema or enum file changed, or frontend and backend source changed together |
| `review-data` | an entity, migration, repository, SQL, Prisma, seed or pagination file changed |
| `review-ui` | a `.tsx`, `.jsx`, `.vue`, `.svelte` or style file, the tokens, or `DESIGN.md` changed |
| `review-tests` | any source or test file changed |

Docs-only changes get `review-scope` alone. Rules look at code paths only, so a
Markdown file named `pagination.md` doesn't start `review-data`.

## Project rules

`.agents/review/triage.json` adds to the defaults:

```json
{
  "rules": [
    { "reviewer": "review-access", "why": "billing is money", "paths": ["^server/src/billing/"] }
  ],
  "always": [],
  "never": [],
  "chunkBy": 2,
  "maxChunks": 4
}
```

- `rules[].paths` are regular expressions, matched case-insensitively.
- `always` adds reviewers to every run; `never` removes them.
- `chunkBy` is how many folder levels group files into chunks (default 1).
  For a monorepo like `client/` + `server/`, use 2 or 3 so each chunk is one
  module.
- `maxChunks` caps the chunks (default 4). Small folders are packed together,
  and a folder is never split.

## Chunks

Split only when the diff is over about 1,500 changed lines. Run every picked
reviewer on every chunk; the judge merges findings across chunks.
