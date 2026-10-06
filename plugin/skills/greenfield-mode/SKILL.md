---
name: greenfield-mode
description: Run a new product end to end with the user - a short brief, the screens designed in the studio while the domain is planned, approval, one feature file per feature the user approves in full, the foundation, then one feature at a time built by a backend and a frontend agent in one checkout, each landing as a PR with an explainer page and videos the user approves. Use for a new product or a full restart of its design.
---

# Greenfield mode

You lead the whole pipeline across turns. The user gives the evidence in
chat: client calls, notes, or their own words. You keep `STATUS.md` at the
project root current (the working agreement says how) and report in digests.
Each stage below names the skill that runs it, what the user is asked, and
what it produces. Ask nothing the brief, the evidence or the code already
answers.

```
0 Input ─► 1 Brief ─► 2 Frame ═╦═► 3A Design in the studio ══ APPROVE ═╗
                               ╚═► 3B Plan the domain (with the user) ═╩═► 4 Plan per feature
                                                                                │ every file approved
                                                        5 Foundation ─► PR + explainer ─► merge
                                                                                │
                                      6 Build one feature (BE + FE agents) ─► 7 PR + explainer ─► merge
                                                                                │ next feature
                                                        8 Later: add a feature (below)
```

## Stages

| Stage | Runs it | The user is asked | Produces |
| --- | --- | --- | --- |
| **0 Input** | the user | — | requirements, calls, notes |
| **1 Brief, short** | you | Only what changes the product: keep or drop an item with no evidence | `BRIEF.md`: confirmed lines each citing their source, suggested lines (yours), unknowns |
| **2 Frame** | you + user, `design-interface` steps 1–3 | Roles, first device, brand or examples liked and disliked; only if the brief raises it: sensitive data, integrations | `studio/project.json` (every screen with role and requirement), `studio/app/src/data.ts` (the draft data model), references |
| **3A Design** | `design-interface` steps 4–6, Opus unless the user names another model | Only studio actions: pick, tune, comment, **Approve** | `DESIGN.md`, `design/*.css`, the approved variant's code |
| **3B Plan the domain** | you + user, `plan-feature` domain pass, while 3A runs | Mode (you propose or they lead); then one question at a time: entities, roles, server functions, what can go wrong, data, services, time, config; each real choice with 2–3 options and a recommendation; answers saved as Q1…Qn | `docs/plans/<project>/plan.md`, interview in progress |
| **4 Plan per feature** | you + user, `plan-feature` screen pass, after Approve | Per approved screen: how data loads, what is optimistic, errors, states, guards; the feature split; then **every feature file in full** | `plan.md` approved, `features/<slug>.md` each with Backend, Frontend, Scenarios, Tests; the `review` skill in plan mode first |
| **5 Foundation** | one agent, `deliver-feature` alone, [coordination.md](references/coordination.md) | Approve its PR | The promoted routes and views, drizzle schema, auth, `server/shared/`, `shared/` with `INDEX.md`, `bun run check`, the `verify-<app>` skill (`verify`); a PR with an explainer |
| **6 Build one feature** | a backend agent and a frontend agent, `deliver-feature`, same checkout | Nothing; a plan question comes to you from the lead | Every scenario green on Docker Postgres, journeys green at desktop and phone, `bun run check` clean, the verify run's evidence, the feature file's Driving section |
| **7 Review + PR + explainer** | you: `review` in fix mode on the feature branch (the reviewers fix and commit), then `interactive-explanation` pr mode | Read the page, watch the journey and architecture videos, answer the `left for you` problems, **approve** | The merged feature, `Status: merged`; the next feature's agents already running |
| **8 Later** | you, "Add a feature" below | The screen, the feature file, the PR | A new feature through 4 → 6 → 7; a screen change through the studio |

## The fork after Frame

Frame is the fork. The screen list and the real records in `data.ts` fix
what the product is about, so the domain can be planned while the studio
designs the look. The join is Approve: only then are screens wired to
server functions (stage 4), because screens change until then. A screen
change during planning goes back through the studio: re-approve, and the
promotion in stage 5 takes the changed screens. It never goes straight into
the app.

## Fixed rules

- No worktrees. One checkout, one branch per feature, ownership by folder.
  The backend agent and the frontend agent of one feature never touch the
  same file; the lead owns the foundation and merges.
- Pipelining, not fan-out: while feature N is built, feature N−1 gets its
  verify run and explainer. The user approves one PR at a time.
- Coordination is files and git: the feature files, the Owns lists,
  `requests/` and the merge order. A runtime's task list or messaging is an
  extra on top, never what the flow depends on.
- Every scenario is written in the plan with an exact outcome, made green per
  feature on a real database, and the journeys are driven on the merged app
  by the verify skill.
- Building asks the user almost nothing. A question during a feature means
  the plan was incomplete: update the plan, then continue.
- A part or a look the approved design doesn't have goes back to the studio.
- Checks are tools the agents run (`bun run check`, the tests,
  `check_tokens.py`, the verify skill), not findings for a reviewer. A
  skipped or failed check is never a pass.
- The `review` skill runs in plan mode before approval. It runs in fix mode
  on each feature branch after Prove and before the explainer, so the page
  shows the code after the fixes.
- Every feature and the foundation land as a PR with an explainer the user
  approves. A change with no feature file gets neither.

## Later: add a feature

One feature for a product with an approved design and a plan. The same
pipeline in one sitting; the user decides three times: the screen, the
feature file, the PR.

0. Small? A color, a label, one more field with no new behaviour: one
   agent, `bun run check`, a direct commit with a one-line note. No feature
   file, no PR.
1. Read `plan.md`, every feature file, `DESIGN.md`, `shared/INDEX.md` and
   the code around the change. Find every caller of what the feature
   changes ([misuse.md](../plan-feature/references/misuse.md)).
2. The screen. Fits an approved screen: go on. Needs a new screen, part or
   state: ask once, with your pick. The studio (`design-interface`) for a
   screen users live in or anything that changes the look. Straight into
   the app, from `design/tokens.css`, `shared/ui/` and the entity parts,
   for a plain form, list or detail page; `check_tokens.py` clean and the
   `design-critic` agent at 1440 and 390, under 70 or any 1 means fix
   first. A changed layout of an approved screen: always the studio.
3. Plan: `plan-feature`, both passes in one sitting, into `plan.md` and
   `features/<slug>.md`. Every caller gets a line or an accepted gap.
   `review --plan`, then the user approves the file in full.
4. Build: stage 6, on branch `feature/<slug>`.
5. Prove: rebase on main, the suite green three times, `bun run check`,
   e2e, then the verify skill on this feature and on every caller from
   step 1. Evidence in `temp/verification/<slug>/`.
6. Stage 7. Then `Status: merged`, and one line on what the user can do now.

Changing another feature's agreed scenario, schema or server function is a
plan change: update `plan.md` and that feature file, and say so. A look
change alone goes through `design-interface`.
