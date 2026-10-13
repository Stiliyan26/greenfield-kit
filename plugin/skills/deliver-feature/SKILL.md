---
name: deliver-feature
description: Builds one approved feature file, as the backend agent or the frontend agent of a pair in one working copy, or alone. Writes tests from the scenarios first, then code until all tests and checks pass, drives the journeys in a real browser, saves the evidence, and writes the feature file for verify. Use for a feature from an approved plan; not for small edits.
---

# Deliver a feature

You build one feature. Its file is `docs/plans/<project>/features/<slug>.md`.
The file has `Status: approved`.

Usually two agents build the feature at the same time, in one working copy:

- The **backend agent** owns the Backend section of the feature file.
- The **frontend agent** owns the Frontend section.

If you are alone, do both sections. Do the backend first.

The lead starts you and opens the PR. You cannot send a message to the lead
while you work. The lead reads your report and your request files when you
stop.

Before you start, read the feature file, `plan.md`, `DESIGN.md` and the
`write-code` skill.

Before you write a helper or a part, search the shared code and the entities.
If the helper or part exists, use it.

## Rules for two agents

These rules apply for all of the work.

**One working copy**

- Use one working copy and one branch, `feature/<slug>`.
- Do not use a worktree.
- Do not use `git stash` or a command that resets files.

Reason: each agent must see the commits of the other agent at once. The
other agent also has edits that are not committed. `git stash` and resets
can remove them.

**Your files**

- Edit only the paths in the Owns list of your section.
- Commit only these paths, by name: `git add -- <paths>`.
- Do not use `git add .`.

Reason: `git add .` also adds the files of the other agent.

The lead owns the shared code and the database schema. To change them, send
a request.

**Contract first**

The contract is the schemas and the server function signatures in the
Backend section.

1. Backend agent: make the contract your first commit.
2. Use the names and types exactly as the Backend section gives them.
3. In each server function, throw `new Error("not implemented: <name>")`.
4. Backend agent: report to the lead and stop. The lead starts the frontend
   agent, then tells you to continue.
5. Frontend agent: build against this commit.

If you are alone, do not stop after the contract.

Reason: the names and types are real. A server function that throws makes
each test that calls it fail. Sample data can make a test pass when the
feature does not work.

To change a signature after this commit, stop. This is a plan change. Write
it in your report.

**A request**

You need a shared helper, a part or a column that you do not own:

1. Write `docs/plans/<project>/requests/<slug>-<name>.md`. Give what you
   need, why, and the signature.
2. Continue with the work that does not need it.
3. If all of your remaining work needs it, report to the lead and stop.

The lead commits the item on your branch, `feature/<slug>`. Then the lead
tells you to continue.

Do not make a local copy. Reason: two copies become different, and the lead
keeps only the lead's copy.

## Steps

Copy this list into your first message. Mark each step when it is done.

```text
Feature <slug> · backend | frontend | alone
- [ ] 1 Write the tests first
- [ ] 2 Build one scenario at a time
- [ ] 3 Make all checks pass
- [ ] 4 Use the feature in a browser
- [ ] 5 Write the feature file
- [ ] 6 Report to the lead
```

### 1. Write the tests first

- Backend agent: write one test for each scenario. Test the server function
  on a real database.
- Frontend agent: write one end-to-end test for each journey. Test at
  desktop size and at phone size.
- Write the tests as `tests.md` in the `write-code` skill tells you.

Done when: each test exists and fails.

If a scenario is wrong, do not change its test. Do not make the test pass.
Write the problem in your report. This is a plan change.

### 2. Build one scenario at a time

Build one scenario or one journey from start to end, then the next.

- Backend agent: change the schema first. Then write the data access, then
  the business logic. Then make the server function call the logic.
- Frontend agent: start at the lowest layer in `structure.md` of the
  `write-code` skill. Go up to the route.

The approved design does not have a screen or a part that you need:

1. Stop work on that screen or part.
2. Write it in your report. The design stage makes the screen or the part.

Done when: the tests for each scenario and journey pass.

### 3. Make all checks pass

Done when:

- All your tests pass.
- The checks of the project pass.
- The full test suite passes the Rules in `tests.md`.

If a test or a check fails, go back to step 2.

### 4. Use the feature in a browser

Use the `verify-<app>` skill of the project. If it does not exist, use
Playwright. Use a real browser at desktop size and at phone size. For each
journey:

- Do the action as a user does it.
- Look at the state after the action.
- Look at the side effects, for example rows in the database and emails.

Frontend agent: compare the screens with `DESIGN.md`. Then ask the
`design-critic` agent to score the screenshots.

Keep the evidence. The explainer uses it and deletes it after the PR.

Done when: the evidence is saved, and the verdict of the `design-critic`
agent is `show the user`.

If the verdict is `revise first`, go back to step 2.

### 5. Write the feature file

The feature file is the only file outside your Owns list that you write.

- Frontend agent, or one agent alone: write the Driving, Gotchas and Trace
  sections. Then set the Status to `review`.
  - Driving: the preconditions. Then each user action, with its exact
    command and the result that you see.
  - Trace: one line.
- Backend agent: do not edit the feature file. Put your Gotchas and your
  Trace line in your report. The lead adds them.

Done when: your sections are written, or your lines are in your report.

### 6. Report to the lead

Give:

- The state: ready, blocked or not checked.
- Each command that you ran, and its output.
- Each check that you could not run.
- Each question about the plan.
- Each request file that you wrote.

If you are blocked, also give:

- The real error.
- What you tried.
- What you think the cause is.
- What the environment needs.

Done when: the lead has your report.

## When to decide and when to ask

| Type of choice | Example | Action |
| --- | --- | --- |
| The feature file gives the answer | `cancelOrder` gives the same result two times | Do what the feature file says. |
| Small and local. Nobody outside your code sees it | the name of a private helper; one file split into two | Decide. Write one line in the Trace. |
| Other people see it, or it stays | a column; the input or output of a function; a status value; a new package; an environment variable | Stop that work. Write the question in your report. The lead updates the plan. |
| The feature file looks wrong, or you cannot do it | a scenario needs a function that nobody owns | Stop that work. Write it in your report. |
| A test that you did not change fails | | Write it in your report. Do not make a test weaker: the user approved each scenario. |

Do not ask the user questions during the feature. The lead asks the user and
updates the plan.
