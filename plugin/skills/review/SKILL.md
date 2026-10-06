---
name: review
description: Review code or a plan, prove each problem, and fix it. Use on a branch or PR before merge (reviewers fix and commit, then interactive-explanation writes the PR page), also on a commit range, the whole app or a security pass; on a plan (report only); or to set up a project's gate tools.
---

# Review

You lead the review. Each feature gets one reviewer, a sub-agent. It finds
the problems in that feature, proves each one, and in fix mode fixes it. You
plan the run, verify the result and hand it over.

## Pick the mode

| Target | Flag for step 3 | Fixes go on |
| --- | --- | --- |
| A branch | `--base <branch>`, `main` by default | that branch |
| A pull request | `gh pr checkout <n>`, then `--base origin/<its base>` | that branch |
| Commits | `--range <a>..<b>`; one commit is `<sha>^..<sha>` | the current branch |
| The whole app | `--app` | a new branch `review/app-<date>` |
| The attack surface | `--security` with any target; reviewers also follow [security.md](references/security.md) | as for its target |
| Uncommitted work | `--uncommitted` | ask the user to commit first, then review it as a branch |
| A plan | `--plan <files>`: plan.md, the contract, the feature files | report mode |

Every code target runs in fix mode. A plan runs in report mode, because the
user approves plans. "Report only" from the user means report mode on any
target. With no target named, take uncommitted work if there is any, else
the branch against `main`.

Fix mode runs steps 0 to 7 below. Report mode runs steps 0 to 4, then
continues in [report.md](references/report.md).

Fix mode writes no review files. The goal and the red gates go into each
reviewer's prompt. Screenshots and the verify output go in the project's
evidence folder, `temp/verification/review-<date>/`.

Report mode writes `reviews/<date>-<target>/`, called `<run>` below. It is
committed and is the record.

## 0. Gates

Run the gate command from `.agents/PROJECT.md`. Note which checks are red;
they go to the reviewers and into the hand-over, and the review goes on.
Report mode also saves the output in `<run>/tools.txt`.
If the project has no size, import, copied-code or dead-code checks, say so
in the hand-over and offer [tools.md](references/tools.md).

Done when you know which gates are red.

## 1. Config

Read `.agents/review/config.json`. If it is missing, ask the questions in
[config.md](references/config.md), offer the models this CLI can run, and
write the file.

Done when the file exists.

## 2. Ask

Ask in one message: what worries the user most here, and quick or full when
the config doesn't settle it. Skip what the request already answered. Skip
the step when `greenfield-mode` started the
review.

Done when both are answered or skipped.

## 3. Plan

```
node <skill-root>/scripts/triage.mjs --out <dir> <flag>
```

`<skill-root>` is the folder this `SKILL.md` is in. `<dir>` is `<run>` in
report mode, and `temp/review/` in fix mode, where nothing reads it but
you. The script writes `plan.json`, one entry per feature
([triage.md](references/triage.md)), plus `files.txt` and `diff.patch`.

Write the goal: one paragraph on what the change is for, from the request,
the PR text, the commits, `docs/plans/` and `.agents/PROJECT.md`, then the
user's worry. Fix mode puts it in each reviewer's prompt; report mode saves
it as `<run>/goal.md`.

Show the plan block from [config.md](references/config.md) and wait for a
yes. The user may change the number of reviewers, merge or drop features,
or name another model. With fewer reviewers than features, the smallest
features share a reviewer; a feature leaves the plan only when the user
drops it. With more features than `maxReviewers`, propose the merge
yourself.

Go ahead without waiting when the request said so or `greenfield-mode`
started the review. Show the plan block as one chat line instead.

Done when the user said yes, or the exception applies, and every feature in
`plan.json` has a reviewer.

## 4. Reviewers

Start one sub-agent per feature, all at once, on the config's
`reviewerModel`. Tell it to follow [reviewer.md](references/reviewer.md),
and give it:

- the mode; in fix mode also the branch and `maxRounds`,
- its feature: name, files, lines, and the feature file's path when one
  exists (`docs/plans/<project>/features/<slug>.md`),
- fix mode: the goal, the red gates, and the base ref for `git diff`;
  report mode: the `<run>` path,
- the path to [checklist.md](references/checklist.md), and in report mode
  [report.md](references/report.md),
- the `write-code` skill's `SKILL.md` path,
- whether it may start the app, and the commands from `.agents/PROJECT.md`,
- its problem numbers: 1–99 for the first reviewer, 100–199 for the next,
- for a plan: the plan files and the checklist's "Plan mode" section.

A reviewer that fails or times out is listed as not run, with its feature.
Start it again only with the same prompt. Without sub-agents, review the
features yourself one at a time, following `reviewer.md`, and say so
in the hand-over.

Done when every reviewer has replied or is listed as not run.

## 5. Cross-feature problems

A reviewer names a problem whose fix lives in another feature. Send it once
to that feature's reviewer, with the same agent and model. If it is still
open after that, it is `left for you`.

Done when each of these problems is fixed or `left for you`.

## 6. Verify

On the branch after the last fix, run the gate command, the full test
suite, and the project's `verify-<app>` skill on each reviewed feature when
the project has one. Save the output in the evidence folder.

If a check goes red, send the failure once to the reviewer of the feature
it points at, then run the checks again. Still red: stop and show the user
the output.

Done when every check is green, or listed as not run with the command that
would run it. A check that didn't run is reported as not run.

## 7. Explain and hand over

Run `interactive-explanation` on the branch as it is now: pr mode when a
feature file exists, task mode otherwise. Give it:

- `tests`: one line per fixed problem with its proof, and the verify result,
- `risks.items`: each `left for you` block, and each fix that is hard to
  undo,
- a line for the PR text: "Review: <n> fixed in <shas>, <m> left for you".

The explainer builds the page and the PR text; opening the PR is its own
step. Then tell the user in chat: found, fixed, left for you, not run, the
verify result, and the page path. The user acts only on the `left for you`
problems.

Done when the page is built and the user has the digest.

## When the pipeline runs it

| Where                                                  | Target                             | Mode                                                           |
| ------------------------------------------------------ | ---------------------------------- | -------------------------------------------------------------- |
| A plan, before the user approves it                    | `--plan`                           | report; "fix" edits the plan files                             |
| A feature branch, after Prove and before its explainer | `--base`                           | fix                                                            |
| The lead's merge                                       | `--range` on the feature's commits | fix; one reviewer, its fit section is the duplication check    |
| The merged app                                         | `--app`                            | fix, with screenshots when the app may run                     |
| Before a first release                                 | `--app --security`                 | fix; auth findings are `left for you`                          |

## Set up a project

| Need                                                            | Read                                            |
| --------------------------------------------------------------- | ----------------------------------------------- |
| Gate tools: size, nesting, cycles, layers, copied and dead code | [tools.md](references/tools.md)                 |
| The project's own rules in `.agents/review/`                    | [project-rules.md](references/project-rules.md) |
| Models, the questions, the plan block                           | [config.md](references/config.md)               |
