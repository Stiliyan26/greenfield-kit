---
name: add-feature
description: Add one feature to a product that already has an approved design and a plan - decide whether it needs a new screen (the studio, or straight into the app with the tokens and parts), plan it as one feature file the user approves in full, build it with a backend and a frontend agent in one checkout, prove it with the verify skill, and land it as a PR with an explainer. Use when the user asks for a new feature, flow or screen in an existing project; not for a small change.
---

# Add a feature

The same pipeline as `greenfield-mode`, for one feature, in one sitting. You
lead; the user decides at three points: the screen question, the feature
file, the PR.

## 0. Is it small?

A color, a label, one more field with no new behaviour, a wiring fix: not
this skill. One agent, `bun run check`, a direct commit with a one-line note,
no feature file, no PR. Say so and do that instead.

## 1. Read what exists

`plan.md` (its Decisions and Accepted gaps), every feature file, `DESIGN.md`,
the code around the change, `shared/INDEX.md`. Find every caller of anything
the feature changes ([misuse.md](../plan-feature/references/misuse.md),
"Changing what exists").

## 2. Does it need a new screen or part?

Check the approved screens in `DESIGN.md` and the routes in `src/routes/`.

- Fits an existing screen: no question, go to 3.
- Needs a new screen, a new part, or a new state the design never drew: ask
  the user once, with your recommendation:
  - **Studio**: `design-interface` designs that screen in the approved
    system; the user approves it there; the promotion adds its route and
    view. Right for a screen users will live in, or anything that changes the
    look.
  - **Straight into the app**: the frontend agent builds it from
    `design/tokens.css`, `shared/ui/` and the entity parts, `check_tokens.py`
    clean, and the `design-critic` agent scores captures at 1440 and 390;
    under 70, or any 1, means fix first. Right for a plain form, a list or a
    detail page in the existing look.
- A new look or a changed layout of an approved screen: always the studio.

## 3. Plan the feature file

Run `plan-feature`, both passes in one sitting: the domain (entities, roles,
server functions, what can go wrong) and the screens (actions, loading,
states, guards). It appends to `plan.md` (done-when lines, decisions with
Q-numbers continuing from the last interview, gaps, a new dated interview
record) and writes `features/<slug>.md` with Backend, Frontend, Scenarios and
Tests. Every caller of something changed gets a line in the feature file or
an accepted gap with a trigger.

Run the `review` skill in plan mode on the new file. Then the user reads the
feature file in full and approves it. Not before.

## 4. Build

Branch `feature/<slug>`. Start the backend agent and the frontend agent with
`deliver-feature`, each owning its section's folders, in the one checkout
([coordination.md](../greenfield-mode/references/coordination.md)). The
backend agent commits the contract first. You answer `requests/` and plan
questions; product questions go to the user, one at a time.

## 5. Prove

When both agents report ready: rebase on main, the full suite green three
times, `bun run check` clean, the e2e suite green, then the `verify-<app>`
skill on this feature's Driving section and on every feature the change
could affect (the callers you found in step 1). Evidence stays in
`temp/verification/<slug>/` until the user has seen it.

## 6. Review, PR + explainer

Run the `review` skill in fix mode on `feature/<slug>`: one reviewer per
feature finds, fixes and commits, and re-proves each fix. Then
`interactive-explanation` in pr mode on the fixed branch: the page, the
journey video from the Driving section, the architecture video with the
decisions and their Q-numbers, and the review's fixed and left-for-you
lists. The user reads, watches, answers the `left for you` problems and
approves. Merge, set the feature
file to `Status: merged`, and say in one line what the user can do now.

## Rules

- Never plan around a screen that isn't approved or built from the tokens
  and parts.
- Changing an agreed scenario, schema or server function of another feature
  is a plan change: update `plan.md` and that feature file, and say so.
- No worktrees, no `git stash`, no question to the user mid-build from an
  agent.
