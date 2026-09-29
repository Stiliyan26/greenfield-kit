---
name: greenfield-mode
description: Run a new product end to end - brief, studio design in React + shadcn, approval, then the plan with the user while the approved front end is promoted, then foundation, features built in parallel by agents in their own worktrees, and proof. Use for a new product or a full restart of its design.
---

# Greenfield mode

You lead the whole pipeline across turns. The user gives the evidence in chat:
client calls, notes, or their own words. You keep `STATUS.md` at the project
root current (the working agreement says how) and report in digests. Each
stage below names the skill that runs it, what the user is asked, and what it
produces. Ask nothing the brief, the evidence or the code already answers.

```
0 Evidence ─► 1 Frame ─► 2 Design ═══ APPROVE ═══╦═► 3A Promote (background)
                                                  ╚═► 3B Plan (with the user)
                                                            │  join: both done
                                              3C Fan-out setup ─► 4 Foundation
                                                            │
                                    5 Features, in waves, one agent each
                                                            │
                                            6 Prove ─► 7 Loop (back to 3, or 2)
```

## Stages

| Stage | Runs it | The user is asked | Produces |
| --- | --- | --- | --- |
| **0 Evidence → brief** | you | Which calls, notes or messages are in scope; keep or drop an item with no evidence | `BRIEF.md`: confirmed lines each citing their source (a call and timestamp, a message), suggested lines (yours), unknowns |
| **1 Frame** | you + user, `design-interface` steps 1–3 | Roles, first device, brand or examples liked and disliked, language and scripts; only if the brief raises it: sensitive data, integrations, multi-tenant later | `studio/project.json` (every screen a confirmed requirement names, with role and requirement), `studio/app/src/data.ts`, references |
| **2 Design** | `design-interface` steps 4–6 | How many models design and which ones; then only studio actions: pick, tune, comment, **Approve** | `DESIGN.md`, `design/*.css`, the approved variant's code |
| **3A Promote** | a background agent, `design-interface` [promote.md](../design-interface/references/promote.md) | Nothing | `web/`: one route per approved screen, the pixel comparison, motion added; the user accepts it when 3B is done |
| **3B Plan** | you + user, `plan-feature` | Mode (you lead or the AI proposes); then one decision at a time, biggest first: data model, storage, auth and roles, API shape, external services, timezone, v1 scope; per screen: how data loads, what is optimistic, validation and errors, empty and denied states, route guards; each real choice with 2–3 options and a recommendation | `docs/plans/<project>/plan.md`, the API contract, `features/*.md`; the `review` skill in plan mode runs on them before the user approves |
| **3C Fan-out setup** | you, [features.md](references/features.md) + [coordination.md](references/coordination.md) | Accept the feature split; model per agent; full-stack or FE+BE per feature; how many agents at once; which runtime | Waves and owners in the feature files |
| **4 Foundation** | you, alone, sequential | Nothing, unless a contract conflict appears | Schema, auth, the API skeleton from the contract, `shared/` with `INDEX.md`, the app shell = the promoted `web/` |
| **5 Features** | one agent per feature, `deliver-feature`; you merge | Only blockers: a request you can't answer from the plan, a done-when line that turned out impossible | Merged features, each with green scenarios, tests and a review |
| **6 Prove** | `review` full on the merged app, then `verify` | Which features to demo; accept, or send named done-when lines back | One review report acted on; every feature's scenarios green on the merged app, evidence saved, the client demo |
| **7 Loop** | you | — | New evidence becomes a new feature file and re-enters at 3; a screen change re-enters at 2 |

## The fork after Approve

Approval is the fork. 3A needs no decisions, so it runs in the background
while 3B runs with the user in chat. A screen change during planning goes
back through the studio: re-approve, and 3A promotes the changed screens
again. It never goes straight into `web/`. The join is: plan approved and
promotion accepted. Then 3C.

## Fixed rules

- Worktrees for every agent that writes code. One shared checkout only for
  read-only agents (reviewers, the critic).
- Coordination is files and git: the feature files, the ownership lists, the
  `requests/` folder and the merge order. A runtime's task list or messaging
  is an extra on top, never what the flow depends on.
- Feature agents never edit `shared/`, the schema or the contract; they write
  a request. You never write features; you answer requests and merge.
- End-to-end scenarios are written in the plan, made green per feature, and
  run all together on the merged app at the end.
- Building asks the user almost nothing. A question during a feature means
  the plan was incomplete: update the plan, then continue.
- A part or a look the approved design doesn't have goes back to the studio.
- The `review` skill runs four times: plan mode on the plan before approval,
  quick by each feature agent, at every merge by you (its fit lens is the
  duplication check), and full on the merged app before proof. The design
  critic is the review of stage 2.

## Small changes

Not everything re-enters the whole loop. A new screen or a look change goes
to `design-interface`. A data or API change updates the plan and its contract.
A wiring-only fix goes straight to `deliver-feature`.
