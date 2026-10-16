---
name: start
description: Run a new product end to end with the user - a short brief, the screens designed in the studio while the domain is planned, approval, one feature file per feature the user approves in full, the foundation, then one feature at a time built by a backend and a frontend agent in one checkout, each landing as a PR with an explainer page and videos the user approves. Use for a new product or a full restart of its design.
---

# Start

Lead the whole pipeline across turns. Report to the user in digests. Each
stage names its skill, what the user decides, and what it produces.

Ask nothing that the brief, the evidence or the code already answers.

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
| **1 Brief, short** | you | Only what changes the product: an item with no evidence | `BRIEF.md`: confirmed lines each citing their source, suggested lines (yours), unknowns |
| **2 Frame** | you + user, `design-interface` steps 1–3 | Roles, first device, brand or examples liked and disliked; if the brief raises it: sensitive data, integrations | `studio/project.json` (every screen with role and requirement), `studio/app/src/data.ts` (the draft data model), references |
| **3A Design** | `design-interface` steps 4–6, Opus unless the user names another model | Only studio actions: pick, tune, comment, **Approve** | `DESIGN.md`, `design/*.css`, the approved variant's code |
| **3B Plan the domain** | you + user, `plan-feature` domain pass, while 3A runs | Mode (you propose or they lead); then one question at a time: entities, roles, server functions, what can go wrong, data, services, time, config; each choice with 2–3 options and a pick; answers saved as Q1…Qn | `docs/plans/<project>/plan.md`, interview in progress |
| **4 Plan per feature** | you + user, `plan-feature` screen pass, after Approve | Per approved screen: how data loads, what is optimistic, errors, states, guards; the feature split; then **every feature file in full** | `plan.md` approved, `features/<slug>.md` each with Backend, Frontend, Scenarios, Tests; the `review` skill in plan mode first |
| **5 Foundation** | one agent, `deliver-feature` alone, [coordination.md](references/coordination.md) | Approve its PR | Everything coordination.md lists for the foundation, plus the plan's Foundation section; a PR with an explainer |
| **6 Build one feature** | a backend agent and a frontend agent, `deliver-feature`, same checkout | Nothing; a plan question comes to you from the lead | Scenarios green on a real database, journeys green at desktop and phone, the check command clean, the verify evidence, the Driving section |
| **7 Review + PR + explainer** | you: `review` in fix mode on the feature branch (the reviewers fix and commit), then `interactive-explanation` pr mode | Read the page, watch the videos, answer the `left for you` problems, **approve** | The merged feature, `Status: merged`; the next feature's agents already running |
| **8 Later** | you, "Add a feature" below | The screen, the feature file, the PR | A new feature through 4 → 6 → 7; a screen change through the studio |

Done when each stage has produced what its row lists.

## The fork after Frame

1. Plan the domain while the studio designs the look. The screen list and the
   real records in `data.ts` fix what the product is about.
2. Wire screens to server functions (stage 4) only after Approve.
3. Send a screen change during planning back through the studio. Re-approve,
   so the new design pack reaches the builders.

Screens change until Approve, so earlier wiring wastes the plan. Studio code
never goes into the app: the builders read the design pack.

## Fixed rules

1. Use one checkout, one branch per feature, and ownership by folder. Use no
   worktrees. The lead owns the foundation and merges. The two agents of one
   feature never touch the same file.
2. Pipeline the work. While feature N is built, feature N-1 gets its verify
   run and explainer. The user approves one PR at a time.
3. Coordinate through files and git: the feature files, the Owns lists,
   `requests/` and the merge order.
4. Write every scenario in the plan with an exact outcome. Make it green on
   a real database. Drive the journeys on the merged app with the verify skill.
5. Ask the user almost nothing while you build. A question means the plan is
   incomplete: update the plan. Send a part or look that the approved design
   lacks back to the studio.
6. Run checks as tools: the check command, the tests, `check_tokens.py`, the
   verify skill. Treat a skipped or failed check as a fail.
7. Run `review` in plan mode before approval. Run it in fix mode on each
   feature branch after Prove and before the explainer.
8. Land every feature and the foundation as a PR with an explainer that the
   user approves. A change with no feature file gets neither.

These rules stop agent collisions and unproven work.

## Later: add a feature

Use this for a product with an approved design and a plan. The user decides
three times: the screen, the feature file, the PR.

0. Skip the pipeline for a small change: a color, a label or one more field
   with no new behaviour. Use one agent, the check command and a direct
   commit with a one-line note.

   Done when the change is committed, or you go to step 1.

1. Read `plan.md`, every feature file, `DESIGN.md` and the code around the
   change. Find every caller of what the feature changes (the misuse
   reference of `plan-feature`).

   Done when you have listed every caller.

2. Choose the screen route.
   - Fits an approved screen: go on.
   - Needs a new screen, part or state: ask once, with your pick.
   - Use the studio (`design-interface`) for a screen where users live, any
     change to the look, and any changed layout of an approved screen.
   - Build a plain form, list or detail page straight in the app from
     `design/tokens.css`, `shared/ui/` and the entity parts. Run
     `check_tokens.py`, then the `design-critic` agent at 1440 and 390. Fix
     first when the score is under 70 or any criterion scores 1.

   Done when the screen is approved or passes the check.

3. Plan with `plan-feature`, both passes in one sitting, into `plan.md` and
   `features/<slug>.md`. Give every caller a line or an accepted gap. Run
   `review --plan`. The user approves the file in full.

   Done when the feature file is approved.

4. Build as in stage 6, on branch `feature/<slug>`. Then prove: rebase on
   main, run the suite green three times, the check command and e2e. Run the
   verify skill on this feature and on every caller from step 1. Save the
   evidence in `temp/verification/<slug>/`.

   Done when every check is green.

5. Run stage 7. Set `Status: merged`. Tell the user in one line what they can
   do now.

   Done when the PR is merged.

A change to another feature's agreed scenario, schema or server function is
a plan change: update `plan.md` and that feature file. Send a look change
through `design-interface`.
