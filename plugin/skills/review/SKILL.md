---
name: review
description: Review a branch, a PR checked out locally, uncommitted changes, a commit range, the whole app, or a plan. Runs the project's gates, proposes one reviewer per feature (model from the project's config), and the reviewers read and run the code to prove each problem. On a branch or PR (fix mode) the same reviewer fixes each problem in a commit and re-proves it, up to two rounds, and writes no review files; the lead then runs the project's gates and tests once, and interactive-explanation writes the PR description; only hard-to-undo choices and what is still open reach the user. On other targets (report mode) it writes reviews/<date>-<target>/ with a README table and one file per feature for the user to tick, and fix agents work from the ticks. Use before merging, at every stage of greenfield-mode, when asked to "review", or to set up a project's gate tools.
---

# Review

`<skill-root>` is the folder that holds this `SKILL.md`.

You lead the review. You don't review or fix the code yourself. One
reviewer per feature finds each problem and proves it. In fix mode the same
reviewer then fixes it, commits, and proves the fix. You write the summary.

## Two modes

| | Fix mode | Report mode |
| --- | --- | --- |
| Targets | A branch, a PR | A plan, the whole app, uncommitted work, a commit range, `--security`, or when the user says "report only" |
| Who fixes | The reviewer of that feature, in commits on the branch | Fix agents, after the user ticks |
| Files written | None for the user. The record is the commit messages and the PR page | `reviews/<date>-<target>/`: `README.md` and one file per feature |
| The user reads | One page: the PR description from `interactive-explanation` | `README.md`, then the feature files |

Fix mode is the default for a branch or a PR. Uncommitted work stays in
report mode: a reviewer's commit would take the user's unfinished changes
with it.

```
Fix mode:    target ─► 0 tools ─► 1 config ─► 2 ask ─► 3 plan ─► 4 reviewers: find, prove, fix, commit, re-prove (max rounds)
             ─► 5 cross-feature pass ─► verify once (gates, tests) ─► explainer ─► the user reads the PR page
Report mode: target ─► 0 ─► 1 ─► 2 ─► 3 plan, user OK ─► 4 reviewers (find + prove)
             ─► 5 README ─► 6 user ticks ─► "fix" ─► 7 fix agents, user OK ─► 8 merge ─► 9 reviewer closes
```

Steps 6 to 9 are report mode only.

`<run>` is the folder that holds a review's inputs (`files.txt`, `diff.patch`,
`plan.json`, `goal.md`, `tools.txt`, `captures/`):

- Report mode: `reviews/<date>-<target>/` in the project, committed. It is
  also the record. Shape: [report.md](references/report.md).
- Fix mode: `temp/review/<date>-<target>/`, scratch, not committed. Nothing
  is written for the user to read. Each commit message holds its problem and
  proof; the PR page holds the rest.

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
`npm run gates`). Save the output to `<run>/tools.txt`. A failed check
doesn't stop the review; the README (report mode) or your last message (fix
mode) says which failed.

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
node <skill-root>/scripts/triage.mjs --out <run> <target flag>
```

It writes `files.txt`, `diff.patch` (not for `--app` or `--plan`) and
`plan.json`: one entry per feature with its files and lines, grouped by the
project's feature files when they exist, else by folder
([triage.md](references/triage.md)).

Write `goal.md` in `<run>`: one paragraph on what the change or the
app is for, from the request, the PR text, the commits, `docs/plans/` and
`.agents/PROJECT.md`; then the user's "what worries you" answer.

Show the plan block from [config.md](references/config.md): target, depth,
one reviewer per feature with lines and files, the model, whether the app
may run, the folder. **Wait for the user.** They may change the number of
reviewers (fewer means the smallest features merge into one reviewer; never
drop a feature silently), merge or drop features, or name another model.
More features than `maxReviewers`: propose the merge yourself and say so.

Start no agent before the user says yes. The exceptions are a request that
already said to go ahead without asking, and a call from a pipeline step
(`add-feature`, `greenfield-mode`); then show the plan block in one chat
line (report mode: put it at the top of the README) and skip step 2.

## 4. Reviewers

Every reviewer is the `code-reviewer` agent
([agents/code-reviewer.md](../../agents/code-reviewer.md)), on the config's
reviewer model. Start one per feature in the agreed plan, all at once. Give
each:

- its feature: name, file list, lines, and the feature file's path when one
  exists (`docs/plans/<project>/features/<slug>.md`),
- the `<run>` path (goal, files, diff, tools),
- the path to [checklist.md](references/checklist.md); in report mode also
  [report.md](references/report.md),
- the `write-code` skill's `SKILL.md` path (for fit),
- whether it may start the app and how (`.agents/PROJECT.md` → Commands),
  and `<run>/captures/` for screenshots,
- the global problem numbers it may use: give each reviewer a range
  (1–99, 100–199, …) so numbers never clash across features,
- in plan mode: the plan files and the "Plan mode" section of the checklist,
- the mode. In fix mode also: the branch, the `maxRounds` from the config,
  and the rule that it commits only its own feature's files.

Report mode: reviewers write their own `<run>/<feature>.md`. They don't see
each other's files. A reviewer that fails or times out is listed in the
README under "Not run" with its feature; don't re-run it with a softer
prompt. Fix mode: reviewers write no file and reply to you (below); one that
fails or times out is listed as not run in your last message.

### Fix mode: what each reviewer does

It works in the one checkout, on the branch under review. No worktrees.

1. Find every problem and prove it: a failing test, or a command or
   request and what it printed. A problem it can't prove isn't reported.
2. For each problem, in order of priority: write the failing test, apply
   the fix with the project's helpers, run the project's tests and gates,
   commit only its own feature's files, then run the proof again. One problem
   per commit. The message is `review: <title> (#n)`, and the body holds the
   problem, who is hurt, and the proof with its output.
3. When every fixable problem is done, read the changed files once more for
   problems the fixes introduced. That is round 2. Stop after `maxRounds`
   rounds (config, default 2). Fixes have no end otherwise: each one adds
   code to review.
4. It never pushes, amends, rebases or touches another feature's files.
5. It replies to you with one line per fixed problem
   (`#n <priority> <title> · <sha> · <proof>`) and, for each `left for you`
   problem, a short block you can paste into the PR: what happens, who is
   hurt, the options with the recommended one first, and why it waits.
   No file.

A problem is `left for you` when:

- the fix is hard to undo: a migration on existing data, a permission or
  auth rule, the input or output of a server function, deleted data,
- the feature file or the spec looks wrong, so the fix is a plan change,
- it is still open after the last round or its proof fails,
- its fix lives in another feature and step 5 could not settle it.

The reviewer does not touch the code for these.

**No sub-agents?** Review the features one after another yourself, reading
`code-reviewer.md` and the checklist first (and the report shape in report
mode), and say so in the README or the PR text.

## 5. Hand over

### Report mode

When every reviewer is done, read every feature file and write `README.md`
in the shape of [report.md](references/report.md): the table of every
problem, the suggested order, "Not run", "Already there". Merge a problem
two reviewers found from both sides (one cause, one row; keep it in the
feature file where the fix lives and point the other file at it). Don't
change a reviewer's problem otherwise, and don't add problems of your own.

Commit the folder (`review: <target>`), unless the user said not to. Hand
over: the digest (counts by priority, the top three, the folder path), and:
"Tick the Decision lines, then say fix."

### Fix mode

1. **Cross-feature.** A problem whose fix lives in another feature: send it
   once to the reviewer of the owning feature (same agent, same model) to
   fix. Still unsettled: `left for you`.
2. **Verify once**, on the branch after every fix. Run the project's gate
   command and the full test suite, and the `verify-<app>` skill on each
   reviewed feature when the project has one. Save the output in
   `<run>/verify.txt`. Red: send the failure once to the reviewer of the
   feature it points at. Still red: stop and tell the user, with the output.
   A check that couldn't run is listed as not run, never as a pass.
3. **Explain.** Run `interactive-explanation` on the branch as it is now
   (pr mode when a feature file exists, else task mode). Give it:
   - `tests`: one line per fixed problem, from its proof, and the verify
     result,
   - `risks.items`: every `left for you` block, and every fixed problem
     with a hard-to-undo change,
   - one line for the PR text: "Review: <n> fixed in <shas>, <m> left for
     you".

The explainer builds the page and the PR text; opening a PR stays its own
step. Hand over: the digest (found, fixed, left for you, not run, verify
result) and the page path. Only the `left for you` problems need the user.

## 6. The user ticks (report mode)

The user edits the Decision line of each problem: fix now (with the option
letter), later, not a problem, explain more. Don't tick for them. "Explain
more": answer in chat with more context and evidence, then the user ticks
again.

## 7. "fix" (report mode)

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

## 8. Merge (report mode)

One branch at a time: rebase, run all the project's tests, read the diff
against the feature's ownership, merge. A fix that touches shared code or
another feature's files goes back to the agent with a request. Say in the
digest what merged and what is blocked.

## 9. Close (report mode)

Fix mode closes inside step 4. Start the reviewer of that feature again (same agent definition, same
model) with the feature file, the merged code and the checklist. For every
problem in `fixing`: run the same proof as before. Passed: Status becomes
`fixed · proved by <command> → <output>` (or the new capture). Failed:
Status back to `open` with what still happens, and tell the user. Update
the README's Status and Fixed count. Commit (`review: close <target>`).

## The same flow everywhere

| Where | Target | Notes |
| --- | --- | --- |
| Plan, before the user approves | `--plan` on plan.md, the contract, the feature files | Problems point at a section; "fix" edits the plan files |
| A feature branch, after Prove and before its explainer | `--base` on its branch, fix mode | The reviewer fixes and commits; the explainer then shows the fixed code |
| Merge, by the lead | `--range` on the feature's commits | Report mode; usually one reviewer; the fit section is the duplication check |
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

- A reviewer edits project code only in fix mode, only its own feature, only
  in commits. In report mode it never edits code; a fix agent edits only its
  feature.
- Proof costs time. A reviewer that may not run the app says "Not run" and
  gives the command; the README lists every one.
- Every problem is written in full, Later included. The README table is the
  short view; the feature files are the long one. Nothing is cut to a
  one-liner.
- No CI mode and no PR comment for now. The review runs locally.
