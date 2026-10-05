# Pipeline v2 plan

Status: Draft (2026-10-04). The user approves before any skill changes.
Drawing: `flow.excalidraw` at the repo root.

## What it does

One flow from requirements to a feature the user has watched work: a short
brief, screens designed in the studio while the domain is planned, one feature
file per feature with every test written down, one feature built at a time by
a backend and a frontend agent, and a PR with an explainer page and videos the
user approves. The same flow adds a feature to a finished product.

## Stages

| # | Stage | Who | The user is asked | Produces |
| --- | --- | --- | --- | --- |
| 0 | Input | user | — | requirements, calls, notes |
| 1 | Brief + grill, short | lead + user | only what changes the product | `BRIEF.md` with sources and unknowns |
| 2 | Frame | lead + user | roles, devices, screen list | `studio/project.json`, `data.ts` (the draft data model) |
| 3A | Design in the studio, Opus only | agent, critic | pick, tune, **Approve** | `DESIGN.md`, `design/tokens.css`, parts |
| 3B | Plan the domain, while 3A runs | lead + user | product choices, one at a time, Q1…Qn saved | `plan.md` draft: entities, roles, server functions, misuse outcomes |
| 4 | Plan per feature, after Approve | lead + user | **approve every feature file in full** | `features/<slug>.md`: Backend, Frontend, Scenarios, Unit tests, Verify; zod schemas = contract; accepted gaps with triggers |
| 5 | Foundation | one agent | approve its PR + explainer | routes and views promoted, drizzle schema, auth, `shared/`, `bun run check`, the verify skill in `.claude/skills/verify-<app>/` |
| 6 | Build one feature | BE agent + FE agent, same checkout, different folders | nothing | scenarios → failing tests → code → `bun run check` → e2e → verify run, evidence saved |
| 7 | PR + explainer | agent | watch, read, **approve** → merge | PR body, page, journey and architecture videos (OpenRouter voice) |
| 8 | Add a feature later | `add-feature` skill | studio or straight into the app for a new page | one feature file → 6 → 7; a small change is a direct commit |

Pipelining: while feature N is built, feature N-1 gets its verify run and
explainer. One PR at a time. No worktrees.

Code review: not in the flow for now. It slots in between 7's explainer and
the merge later.

## Stack the skills assume

Bun 1.4 · TanStack Start (`src/routes/`, server functions) · React Query ·
TanStack Table · shadcn + Tailwind · zod · drizzle · Postgres · Playwright for
e2e · `bun test` for unit and server-function tests ·
`@testcontainers/postgresql` · oxlint · oxfmt · knip · FSD folders.

Folders:

```
src/
  routes/     TanStack file routes only; each imports a view
  views/      one folder per screen
  widgets/    big reusable blocks
  features/   one user action: ui/, model/, api/*.functions.ts
  entities/   one business thing: schema.ts (zod), types, query hooks, api/*.functions.ts
  shared/     ui/ (shadcn add lands here), lib/, config/
  server/     by business area, server-only: <area>/{service,repository}.server.ts + tests
    shared/   db client, auth, errors, clock
```

Rules: only `*.functions.ts` imports `server/**`. A primitive shadcn has comes
from `shadcn add`; a composition shadcn lacks becomes a reusable part; colors,
radius and fonts only through `design/tokens.css`.

`bun run check` = oxlint + oxfmt + `tsc --noEmit` + knip + a 4-rule ESLint
config for what oxlint 1.86 lacks: layer direction, import sort, naming,
no inline route or function strings. The agent runs it after every edit.

## Tests, per feature file

- Unit (`bun test`): every function with a branch: validators, calculations,
  access rules, parsers.
- Repository: every query against Docker Postgres.
- Server function: every scenario, good and bad: missing or wrong input,
  limits, someone else's id, the same call twice, two calls at once, a
  dependency down. Exact outcome each time; "returns an error" is not one.
- E2E (Playwright): every user journey, happy and bad paths.
- Verify: the generated skill drives the merged app and saves evidence.
- Rules: no sleeps, a clock you control, fresh ids per test, real Postgres,
  the full suite green three times before a phase ends.

## What changes in the kit

| Skill or file | Change |
| --- | --- |
| `greenfield-mode` | Stages above; 3A ∥ 3B fork; foundation and each feature end in a PR + explainer; no worktrees; pipelining |
| `plan-feature` | Domain pass during design, screen wiring after Approve; `references/misuse.md` (from Peter's abuse checklist, neutral examples); exact outcomes; accepted gaps with triggers; Q-numbered answers saved as given; resume from the record |
| `features.md` | Sections Backend, Frontend, Scenarios, Unit tests, Verify; FE/BE owner folders |
| `deliver-feature` | BE + FE agent pair in one checkout; order scenarios → tests → code → check → e2e → verify; stop-and-ask table; a check counts only when it ran in this session |
| `write-code` | Stack rewrite: TanStack Start + FSD folders, server functions, drizzle; `backend.md` rewritten; `tests.md` new; `bun run check` script and the 4-rule ESLint config replace the old preset |
| `shadcn` skill | The add-or-compose rule and the token rule |
| `create-verification-skill` | Writes to `.claude/skills/verify-<app>/`; reads the feature files; no second map |
| `interactive-explanation` | Ported from `peter-skills/` into `plugin/skills/`; PR mode for features and the foundation; the verify skill's drive steps are the journey recipe |
| `add-feature` | New skill: new page? → studio or direct with critic; one feature file; 6 → 7; small change = direct commit |
| `review` | Unchanged now; `references/security.md` (from exploit-hunter) later |
| `setup-project` | Project template gains `bun run check`, `.agents/explain.config.json` |

## Steps

1. `write-code`: TanStack Start + FSD + drizzle + `bun run check`; `tests.md`.
2. `plan-feature` + `features.md`: misuse checklist, exact outcomes, gaps, saved answers.
3. `deliver-feature`: BE + FE pair, test order, stop-and-ask.
4. `create-verification-skill`: `.claude/skills/`, feature files as the map.
5. `interactive-explanation` into the plugin, project-agnostic.
6. `greenfield-mode`: the stage table, fork, pipelining, PR per feature.
7. `add-feature`: new skill.
8. `setup-project` template, README table, manifests, version bump, checks.

Each step: `claude plugin validate`, `check_manifests.py`, `check_agnostic.py`.

## Interview record (2026-10-04)

| # | Question | Answer |
| --- | --- | --- |
| 1 | Keep a short brief + grill? | Yes, short |
| 2 | When to plan the backend? | Domain during design, screen wiring after Approve |
| 3 | Parallel features? | No worktrees. FE + BE pair on one feature, pipelined |
| 4 | Feature plan shape? | One file: FE + BE + tests |
| 5 | Explainer depth? | Full PR with videos for a behaviour change; no PR for a small change |
| 6 | New-feature flow? | New `add-feature` skill |
| 7 | Unit tests? | As many as possible: every function, service, endpoint, journey, bad paths |
| 8 | Verify map? | The generated verify skill lives in `.claude/skills/` |
| 9 | shadcn rule? | shadcn has it → add it; else a reusable part; fixed tokens so the design doesn't drift |
| 10 | Test infra? | Docker Postgres (`@testcontainers/postgresql` for Node) |
| 11 | Plan approval? | Every feature file in full |
| 12 | Framework? | TanStack Start |
| 13 | Lint gaps? | Delegate to tools; the agent runs them; the reviewer gets as little as possible |
| 14 | API style? | Server functions only; server routes only for outside callers |
| 15 | Server function files? | `entities/` and `features/` `api/*.functions.ts` |
| 16 | ORM? | Drizzle |
| 17 | Test runner? | `bun test` |
| 18 | Explainer deps? | remotion + ffmpeg in the project, OpenRouter voice |
| 19 | Foundation PR? | Yes, PR + explainer like a feature |
| 20 | Direct page without studio? | FE agent builds from tokens + parts; critic scores it |

## Open questions

- `bun test` with TanStack Start's server-only files: check it resolves `*.server.ts` before step 1 is done; fall back to Vitest if not.
- The journey recipe reuse: the verify skill's drive steps and interactive-explanation's `recordClip` need one shared recorder.
