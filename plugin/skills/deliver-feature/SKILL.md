---
name: deliver-feature
description: Build one approved feature file - as the backend agent or the frontend agent of a pair in one checkout, or alone - scenarios into failing tests first, then code until every test is green, bun run check clean, the journeys driven in a real browser and the evidence saved, then the feature file filled in for verify. Use for a feature from an approved plan; not for small edits.
---

# Deliver a feature

You build one feature from its file, `docs/plans/<project>/features/<slug>.md`,
with `Status: approved`. Usually two agents build it at the same time in the
same checkout: the **backend agent** owns the Backend section's folders, the
**frontend agent** owns the Frontend section's. Alone, you do both, backend
first. The lead starts you, answers questions, and opens the PR when you
report.

Read first: the feature file, `plan.md`, `DESIGN.md`, the `write-code` skill
(`structure.md`, `backend.md` or `react.md`, `tests.md`), and what already
exists in `src/server/shared/`, `src/shared/` and the entities you touch.
Reuse before writing.

## Rules while two agents build

- One checkout, one branch `feature/<slug>`, no worktree, never `git stash`.
- Edit only the files and folders your section's **Owns** list names. Commit
  only them: `git add -- <your folders>`. Never touch the other agent's
  files, the foundation (`server/shared/`, `shared/`, the drizzle schema
  outside your Owns list) or another feature.
- **Contract first.** The backend agent's first commit is the zod schema in
  `entities/<thing>/schema.ts` and the `*.functions.ts` wrappers with
  handlers that throw `NotImplementedError`, exactly as the Backend section
  describes them. The frontend agent builds against those from that commit.
- Something you need that isn't yours (a shared helper, a part, a column):
  write `docs/plans/<project>/requests/<slug>-<name>.md` with what, why and
  the signature, tell the lead, and continue with the rest. No local copy.
- Run `bun run check:fix` after every edit. Your folders only need to be
  clean for your commits; the whole tree must be clean before you report.

## Steps

1. **Scenarios into failing tests.** Backend: one `bun test` per scenario
   in the Scenarios section, against the `server/` logic function on Docker
   Postgres, exact outcome and non-events asserted
   ([tests.md](../write-code/references/tests.md)). Frontend: the journeys
   as `e2e/<slug>.spec.ts` at desktop and phone. All red now. Never weaken
   one; a scenario that turns out wrong is a plan change and goes in your
   report.
2. **Build in thin slices**, each working end to end:
   - Backend: migration → repository → service → the wrapper calls it. Unit
     tests on every branch as you go.
   - Frontend: entity queries and `ui/` → the feature's `ui/` and `model/`
     → the view → the route and its loader. Tokens only; run
     `check_tokens.py` from `design-interface` on the files you touched.
     A screen or part the approved design doesn't have: stop that part and
     report it; it goes back to the studio.
3. **Green.** Every test of yours green, the full suite green three times in
   a row, `bun run check` clean.
4. **Drive it.** The project's `verify-<app>` skill (launch, doctor, drive,
   stop), or Playwright, at desktop and phone: every journey the way a user
   would, the action and the state it produced, side effects checked (rows,
   emails). Save the evidence under `temp/verification/<slug>/`. Compare the
   screens with `DESIGN.md`; ask the `design-critic` agent to score the
   captures. Under 70, or any 1, means fix first.
5. **Fill in the feature file.** Driving (preconditions, each user action
   with its exact command and what you should see), Gotchas, a Trace line,
   `Status: review`.
6. **Report** to the lead: ready, blocked or not checked; the commands that
   ran and what they printed; what you couldn't run; any plan question.

A check counts only when it ran in this session and passed. A check that
couldn't run (no Docker, no browser) stays listed as not run; it never
becomes a pass.

## When to decide and when to ask

| Kind of choice | Example | Do |
| --- | --- | --- |
| The feature file decides it | `cancelOrder` answers the same result twice | Follow it |
| Small, local, invisible from outside | a private helper's name, splitting a file | Decide; one line in the Trace |
| Visible or lasting | a column, a function's input or output, a status value, a new package, an env var | Stop that part. Write the question in your report; the lead updates the plan |
| The file looks wrong or can't be done | a scenario needs a function nobody owns | Stop that part and report it |
| A red test you didn't touch | | Report it. Never weaken a test |

Don't ask the user mid-feature; the lead does, and updates the plan.

## When you're stuck

Hand over the goal, the code change, the real error output, what you tried,
what you still suspect, and what the environment needs. Handing it to someone
else doesn't give the task more tries.
