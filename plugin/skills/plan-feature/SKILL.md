---
name: plan-feature
description: Plan a new project or a feature with the user before any code - the domain (entities, roles, server functions, what can go wrong) while the screens are designed, the screen wiring after the design is approved, then one feature file per feature with exact scenarios and every test, which the user approves in full. Saves each answer as it's given. Use for a new project, or a feature that touches the database, server functions, permissions or several screens.
---

# Plan a feature or project

The user decides; you ask, check and write it down. Small changes skip
planning. In `greenfield-mode` this runs in two passes: the domain pass while
the studio designs the screens, the screen pass after the user approves the
design. For one feature later (`greenfield-mode`, "Add a feature"), both passes happen in one
sitting.

## Start

1. **Read what exists.** `.agents/PROJECT.md`, `BRIEF.md`, `studio/project.json`
   and `studio/app/src/data.ts` (the screens and the records they show are the
   draft data model), earlier plans, the code around the change: schema,
   auth, `server/shared/`, existing feature files. `DESIGN.md`, if approved,
   settles the look and the parts. Don't ask what these already answer.
2. **Changing something that exists?** Find every caller of it in the code
   now ([misuse.md](references/misuse.md), "Changing what exists").
3. **Open the plan file** with only its title, `Status: Draft — interview in
   progress` and an empty interview record ([plan.md](references/plan.md)).
   Every answer goes in as soon as it's given. A plan found in that state is
   resumed: say `Resuming: Q1–Q14 answered` and continue.
4. **Pick the mode** if the user didn't say: **you propose** (you draft, they
   correct) or **they lead** (they explain, you ask and check).

## Interview

- One question per message, in plain words, with a concrete example of what
  happens ("12:00:00 click → email; 12:00:20 click → nothing") and **My
  recommendation** with the reason in a line or two. For a real choice, 2–3
  options and the tradeoff.
- Check each answer against the code, the docs or a quick test before you
  agree. Say which facts you checked and which are guesses. A real problem:
  say it once, with what breaks, when, and your evidence, and offer an
  alternative. Still disagree after one more round: write both views down,
  the user decides.
- "You decide" → take the recommendation, say so, record it as `my call`.
- Decide obvious outcomes yourself (a malformed id → `InvalidInputError`; the
  same event twice → no change). Ask only when the outcome is a product
  choice ("cancel an already cancelled order: the same result, or
  `ConflictError`?").
- **Build only what is used.** No field nobody reads, no index without a
  query, no server route without an outside caller. Offer those as accepted
  gaps with a trigger.
- No question budget. Settled areas are skipped, not confirmed.

### Domain pass (runs while the screens are designed)

In this order:

1. **Requirements:** what a user can do, and how we know it's done. Done-when
   lines get IDs.
2. **Entities:** each one, its fields and limits, who owns it, what happens on
   delete, which fields each role may see.
3. **Roles:** for every action, which roles may do it. A missing rule is an
   open question, not a yes.
4. **Server functions:** one per read or action, from the screens in
   `project.json`: who may call it, the input, the output per role, the
   errors, the same call twice, limits. A role never receives a field its
   screens don't show.
5. **What can go wrong:** walk [misuse.md](references/misuse.md) for every
   server function, job, webhook and email. Each item becomes a scenario
   with an exact outcome, or `N/A — reason`. Product choices are questions.
6. **Data:** store, keys, constraints, retention, existing rows on a change,
   can it be undone. An index only for a query you can name.
7. **Other services, time, config:** what happens when a service is down or
   slow; the timezone and where a day, week and month start; env vars and
   startup checks; what is never logged.
8. **Stack:** a new project uses the kit's default (`write-code`:
   TanStack Start on Bun, drizzle, Postgres) unless a real need says
   otherwise. An existing project keeps its stack.

### Screen pass (after the design is approved)

Walk every approved screen in `DESIGN.md` and `src/routes/`: every action
and every piece of data on it has a server function and a role rule. Per
screen: how data loads (loader, hook, live), what is optimistic, validation
and where errors show, when the empty, loading, error and denied states
appear, route guards. A screen or part the design doesn't have goes back to
the studio first. Never plan around a screen that isn't approved.

### Features, last

Propose the split and the order, one line of reason each. A feature is one
thing a user can use, working end to end. What others build on goes first;
what changes others' shapes goes last. Two features that need the same table
or helper mean it goes to the foundation.

## Write it down

- `plan.md` in the shape of [plan.md](references/plan.md): remove the
  `interview in progress` mark; every decision carries its Q-number.
- `features/<slug>.md`, one per feature, in the shape of
  [features.md](../greenfield-mode/references/features.md): Backend and
  Frontend sections with owners, the scenarios with exact outcomes, the
  tests at every layer ([tests.md](../write-code/references/tests.md)).
- The contract is code the plan names: the zod schemas in
  `src/entities/<thing>/schema.ts` and the server function signatures.

**Fresh-eyes review**, once, after writing. Run the `review` skill in plan
mode on `plan.md` and the feature files; it checks every server function has
its misuse scenarios or `N/A` lines, every outcome is exact, every caller of
a changed thing has a feature or a gap, every gap has a trigger. Clear
findings: fix. Product choices: ask, numbered on from the interview. Wrong
findings: drop. One pass.

**Approval.** The user reads `plan.md` and **every feature file in full** and
says so. Only then: `Status: Approved (date, by the user)` on the plan and
`approved` on each feature file. Report and stop:

```
Plan: docs/plans/orders/plan.md

  features   3   orders-list, cancel-order, order-emails
  scenarios  41 server-function, 7 journeys
  gaps       4, each with a trigger
  interview  Q1–Q23
  review     5 findings: 4 fixed, 1 asked (Q24)
```

You only plan. Don't write product code, run migrations or message anyone.
If the code later needs something the plan doesn't say, update the plan and
tell the user.
