---
name: plan-feature
description: Plans a new project or a feature with the user before any code - the domain (entities, roles, server functions, what can go wrong) while the screens are designed, the screen wiring after the design is approved, then one feature file per feature with exact scenarios and every test, which the user approves in full. Use for a new project, or a feature that touches the database, server functions, permissions or several screens.
---

# Plan a feature or project

The user decides. You ask, check and write it down. Skip small changes.

A new product runs two passes: the domain pass while the screens are designed, the screen pass after the user approves the design. A later feature runs both at once.

Copy this list into your first message and tick each item.

```text
Plan <project or feature>
- [ ] 1 Read and open the plan file
- [ ] 2 Domain pass
- [ ] 3 Screen pass
- [ ] 4 Features
- [ ] 5 Write it down
- [ ] 6 Fresh-eyes review
- [ ] 7 Approval
```

## Interview rules

These rules apply through steps 2 to 4.

- Ask one question per message, in plain words. Give a concrete example ("12:00:00 click → email; 12:00:20 click → nothing") and **My recommendation** with its reason. For a real choice, give 2–3 options and the tradeoff.
- Write each answer into the plan file at once.
- Check each answer against the code, the docs or a quick test before you agree. Say which facts you checked and which are guesses.
- State a real problem once: what breaks, when, your evidence, an alternative. If you still disagree after one more round, write both views down. The user decides.
- On "You decide", take your recommendation and record it as `my call`.
- Decide obvious outcomes yourself: a malformed id gives `InvalidInputError`, the same event twice changes nothing. Ask only for a product choice ("cancel an already cancelled order: the same result, or `ConflictError`?").
- Build only what is used. Add no field that nobody reads, no index without a query, no server route without an outside caller. Offer each as an accepted gap with a trigger.

Reason: unchecked answers hide errors. Questions that the code answers waste the user's time.

## Steps

1. **Read and open the plan file.**
   - Read the brief, the screen list and draft records from the design stage (`studio/project.json`, `studio/app/src/data.ts`), earlier plans, and the code around the change.: schema, auth, shared code, feature files.
   - Treat an approved `DESIGN.md` as final for the look and the parts.
   - If you change something that exists, search the code now for every caller ([misuse.md](references/misuse.md), "Changing what exists").
   - Open the plan file with its title, `Status: Draft — interview in progress` and an empty interview record ([plan.md](references/plan.md)).
   - Resume a plan found in that state: say `Resuming: Q1–Q14 answered` and continue.
   - Pick the mode if the user did not say: **you propose** (you draft, they correct) or **they lead** (they explain, you ask and check).

   Done when the plan file exists with its Status line and the mode is set.

2. **Domain pass**, while the screens are designed. Work in this order.
   1. **Requirements:** what a user can do, and how we know it is done. Give each done-when line an ID.
   2. **Entities:** for each one, its fields and limits, its owner, what happens on delete, and which fields each role may see.
   3. **Roles:** for each action, which roles may do it. Treat a missing rule as an open question, not a yes.
   4. **Server functions:** one per read or action, taken from the screen list. Define who may call it, input, output per role, errors, the same call twice, limits. Send no role a field its screens do not show.
   5. **What can go wrong:** walk [misuse.md](references/misuse.md) for every server function, job, webhook and email. Give each item a scenario with an exact outcome, or `N/A — reason`. Ask the user about product choices.
   6. **Data:** store, keys, constraints, retention, existing rows on a change, undo.
   7. **Other services, time, config:** a service down or slow; timezone and where a day, week and month start; env vars and startup checks; what is never logged.
   8. **Stack:** use the stack in `.claude/stack.json` for a new project, unless a real need says otherwise. Keep the stack of an existing project.

   Done when each of the eight is answered in `plan.md` or listed as an open question.

3. **Screen pass**, after the design is approved. Walk every approved screen in `DESIGN.md` and the design pack (`design/screens/`). For each screen, decide
   how data loads (with the page, on demand, live), what is optimistic, validation and where errors show, when the empty, loading, error and denied states appear, and the route guards.

   Send a screen or part that the design lacks back to the studio first. Plan only approved screens.

   Done when every action and every piece of data on every approved screen has a server function and a role rule.

4. **Features.** Propose the split and the order, with one line of reason for each. A feature is one thing a user can use, working end to end. Put what others build on first, and what changes others' shapes last. Check it against the Rules in [feature-file.md](references/feature-file.md).

   Done when the user agrees to the split and the order.

5. **Write it down.**
   - Write `plan.md` in the shape of [plan.md](references/plan.md). Remove the `interview in progress` mark. Add the Q-number to each decision.
   - Write one `features/<slug>.md` per feature in the shape of [feature-file.md](references/feature-file.md). Include the Backend and Frontend sections (owners, contract), the scenarios with exact outcomes, and the tests at every layer that the stack's test file lists.

   Done when `plan.md` has no `interview in progress` mark and every feature file has every section above Driving.

6. **Fresh-eyes review.** Run the `review` skill in plan mode, once, on `plan.md` and the feature files.
   Fix a clear finding. Ask the user about a product choice, numbered on from the interview. Drop a wrong finding. Go back to step 4 if a finding changes the split.

   Done when every finding is fixed, asked or dropped.

7. **Approval.** The user reads `plan.md` and **every feature file in full** and says so. Then, and only then, set `Status: Approved (date, by the user)` on the plan and `approved` on each feature file. Report and stop:

   ```
   Plan: docs/plans/orders/plan.md

     features   3   orders-list, cancel-order, order-emails
     scenarios  41 server-function, 7 journeys
     gaps       4, each with a trigger
     interview  Q1–Q23
     review     5 findings: 4 fixed, 1 asked (Q24)
   ```

   Done when the user has said they read every file and the Status lines are set.

You only plan. Write no product code, run no migration, message no one. If the code later needs something the plan lacks, update the plan and tell the user.
