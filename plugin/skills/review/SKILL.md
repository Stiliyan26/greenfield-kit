---
name: review
description: Review a branch, a PR checked out locally, uncommitted changes, a commit range, the whole app, or a plan. Runs the project's gates, asks what worries the user, proposes one reviewer per feature (model from the project's config) and waits for the OK. Reviewers read and run the code to prove each problem, then write reviews/<date>-<target>/ - a README table plus one file per feature where every problem has context, impact, current code, proof, fix options with code, a test to add and tick boxes. The user ticks, says "fix", and fix agents work one per feature; the reviewer re-proves and closes. Use before merging, at every stage of greenfield-mode, when asked to "review", or to set up a project's gate tools.
---

# Review

`<skill-root>` is the folder that holds this `SKILL.md`.

You lead the review. You don't review the code yourself and you never fix
anything during a review. Reviewers find and prove problems, one per
feature; you write the summary, the user decides, fix agents fix, the
reviewer closes.

```
target ─► 0 tools ─► 1 config (once) ─► 2 ask ─► 3 plan, user OK ─► 4 reviewers (one per feature, run + prove)
       ─► 5 README ─► 6 user ticks ─► "fix" ─► 7 fix agents, user OK ─► 8 merge ─► 9 reviewer closes
```

Everything the review learns lives in `reviews/<date>-<target>/` in the
project, committed. Shape: [report.md](references/report.md).

## What it reviews

| Target | Collect it (step 3) |
| --- | --- |
| A branch | `--base <branch>`; `main` when the user names none |
| A pull request | `gh pr checkout <n>`, then `--base origin/<its base>` |
| Uncommitted work | `--uncommitted` |
| Commits | `--range <a>..<b>`; one commit is `<sha>^..<sha>` |
| The whole app | `--app` |
| A plan | `--plan <files>`: plan.md, the contract, the feature files; no diff |
| The attack surface | `--security` with any target above; reviewers follow [security.md](references/security.md) and prove each finding with the request that triggers it |

No target named: uncommitted work if there is any, else the branch against
`main`. The plan block in step 3 shows the target, so the user can correct
it.

## 0. Tools

Run the project's gate command from `.agents/PROJECT.md` (for example
`npm run gates`). Save the output to `reviews/<date>-<target>/tools.txt`.
A failed check doesn't stop the review; the README says which failed.

No size, import, copied-code or dead-code checks in the project yet: say
so in the README and offer [tools.md](references/tools.md). A tool catches
those the same way every time; a reviewer never reports them.

## 1. Config, once per project

Read `.agents/review/config.json`. Missing: ask the questions in
[config.md](references/config.md) (reviewer model, fix model, may the
review start the app, default depth), offering the models this CLI can run,
and write the file. Never ask again unless the user wants a change.

## 2. Ask

One message, two questions ([config.md](references/config.md)): what
worries you most here, and quick or full when the config doesn't settle it.
Skip what the request already answered.

## 3. Plan, and wait

```
node <skill-root>/scripts/triage.mjs --out reviews/<date>-<target> <target flag>
```

It writes `files.txt`, `diff.patch` (not for `--app` or `--plan`) and
`plan.json`: one entry per feature with its files and lines, grouped by the
project's feature files when they exist, else by folder
([triage.md](references/triage.md)).

Write `goal.md` in the same folder: one paragraph on what the change or the
app is for, from the request, the PR text, the commits, `docs/plans/` and
`.agents/PROJECT.md`; then the user's "what worries you" answer.

Show the plan block from [config.md](references/config.md): target, depth,
one reviewer per feature with lines and files, the model, whether the app
may run, the folder. **Wait for the user.** They may change the number of
reviewers (fewer means the smallest features merge into one reviewer; never
drop a feature silently), merge or drop features, or name another model.
More features than `maxReviewers`: propose the merge yourself and say so.

Start no agent before the user says yes. The only exception is a request
that already said to go ahead without asking; then put the plan block at
the top of the README.

## 4. Reviewers

Every reviewer is the `code-reviewer` agent
([agents/code-reviewer.md](../../agents/code-reviewer.md)), on the config's
reviewer model. Start one per feature in the agreed plan, all at once. Give
each:

- its feature: name, file list, lines, and the feature file's path when one
  exists (`docs/plans/<project>/features/<slug>.md`),
- the review folder path (goal, files, diff, tools),
- the paths to [checklist.md](references/checklist.md) and
  [report.md](references/report.md),
- the `write-code` skill's `SKILL.md` path (for fit),
- whether it may start the app and how (`.agents/PROJECT.md` → Commands),
  and the `captures/` folder for screenshots,
- the global problem numbers it may use: give each reviewer a range
  (1–99, 100–199, …) so numbers never clash across features,
- in plan mode: the plan files and the "Plan mode" section of the checklist.

Reviewers write their own `reviews/<date>-<target>/<feature>.md`. They
don't see each other's files. A reviewer that fails or times out is listed
in the README under "Not run" with its feature; don't re-run it with a
softer prompt.

**No sub-agents?** Review the features one after another yourself, reading
`code-reviewer.md`, the checklist and the report shape first, and say so in
the README.

## 5. README

When every reviewer is done, read every feature file and write `README.md`
in the shape of [report.md](references/report.md): the table of every
problem, the suggested order, "Not run", "Already there". Merge a problem
two reviewers found from both sides (one cause, one row; keep it in the
feature file where the fix lives and point the other file at it). Don't
change a reviewer's problem otherwise, and don't add problems of your own.

Commit the folder (`review: <target>`), unless the user said not to.

Then hand over: the digest (counts by priority, the top three, the folder
path), and: "Tick the Decision lines, then say fix."

## 6. The user ticks

The user edits the Decision line of each problem: fix now (with the option
letter), later, not a problem, explain more. Don't tick for them. "Explain
more": answer in chat with more context and evidence, then the user ticks
again.

## 7. "fix"

Read every feature file's Decision lines. Group "fix now" problems by
feature file. Propose the fix agents:

```
Fix: 9 problems ticked in 3 features
  1. time-off   #7A #8A #9B #21A     (sonnet)
  2. reporting  #13A #15A            (sonnet)
  3. people     #4A #12A #19A        (sonnet)
Foundation change: #9B needs a server migration → fable
Go? Or: a number of agents, another model.
```

One agent per feature file, capped by the config's `maxFixAgents` (merge
the smallest into one agent past the cap). The fix model from the config;
the reviewer model for a fix the review marked as needing judgement. **Wait
for the user.**

Each fix agent works in the one checkout on a branch `fix/<feature>`, with
the `deliver-feature` rules on ownership: only that feature's files, and it
commits only those. Two fix agents never share a folder. For
each problem: write the "Test to add" first and see it fail, apply the
chosen option, run the project's tests, set the problem's Status to
`fixing` while it works and leave it there. It never touches Decision lines
and never edits another feature's problems. Its report to you is one line
per problem: fixed, or blocked and why.

## 8. Merge

One branch at a time: rebase, run all the project's tests, read the diff
against the feature's ownership, merge. A fix that touches shared code or
another feature's files goes back to the agent with a request. Say in the
digest what merged and what is blocked.

## 9. Close

Start the reviewer of that feature again (same agent definition, same
model) with the feature file, the merged code and the checklist. For every
problem in `fixing`: run the same proof as before. Passed: Status becomes
`fixed · proved by <command> → <output>` (or the new capture). Failed:
Status back to `open` with what still happens, and tell the user. Update
the README's Status and Fixed count. Commit (`review: close <target>`).

## The same flow everywhere

| Where | Target | Notes |
| --- | --- | --- |
| Plan, before the user approves | `--plan` on plan.md, the contract, the feature files | Problems point at a section; "fix" edits the plan files |
| A feature, by its agent, before it reports done | `--base` on its branch | The feature agent is also the fixer; it ticks its own Decision lines and says so in its trace |
| Merge, by the lead | `--range` on the feature's commits | Usually one reviewer; the fit section is the duplication check |
| Prove, on the merged app | `--app` | The full machine; screenshots when the app may run |
| Before a first release | `--app --security` | The security pass, report only; each finding fixed or an accepted gap with a trigger |
| On demand | any | "review this branch", "review the app" |

## Set up a project

| Need | Read |
| --- | --- |
| Gate tools (size, nesting, cycles, layers, copied and dead code) | [tools.md](references/tools.md) |
| The project's own rules files in `.agents/review/` (all optional) | [project-rules.md](references/project-rules.md) |
| Models, before-questions, the plan block | [config.md](references/config.md) |

## Limits

- Reviewers run code but never edit it. A fix agent edits only its feature.
- Proof costs time. A reviewer that may not run the app says "Not run" and
  gives the command; the README lists every one.
- Every problem is written in full, Later included. The README table is the
  short view; the feature files are the long one. Nothing is cut to a
  one-liner.
- No CI mode and no PR comment for now. The review runs locally.
