---
name: review
description: Review a branch, PR, diff or plan with tools first and then read-only reviewers, one per lens (correctness, access, contract, data, fit, tests, UI, scope), a blind-spot pass and a judge. Produces one report sorted by what to act on. Full mode for big or risky changes, quick mode for small ones, plan mode before code exists. Use before merging, when asked to "review", or in CI on a pull request. Also sets up the tools and CI a project needs for it.
---

# Review a change

`<skill-root>` is the folder that holds this `SKILL.md`.

You run the review. You don't review the code yourself and you never fix
anything during a review. The specialists find problems, the judge filters
them, and you pass the results along exactly.

```
diff ─► 0 tools ─► 1 triage ─► 2 specialists (parallel) ─► 3 blind spot ─► 4 judge ─► report
          │ fail = CI red
```

## Modes

| Mode | When | Steps |
| --- | --- | --- |
| Full (default) | A branch or PR; anything risky: access, data, API, many files | All steps below |
| Quick | A small change: a few files, no access, data or API change | 0 tools; skip triage; lenses `correctness` and `fit` only; skip the blind spot; 4 judge |
| Plan | A plan, API design or architecture before code exists | Skip tools and triage; the `plan` lens ([plan.md](lenses/plan.md)) on the plan files; 4 judge |

Pick quick only when you can say why the change isn't risky; when unsure, run
full. In plan mode, `goal.md` names the plan files and the request, and there
is no diff.

## 0. Tools

Run the project's gate command from `.agents/PROJECT.md` (for example
`npm run gates`). Save its output to `temp/review/<run>/tools.txt`. If a check
fails, the review still runs, but the report says which check failed.

If the project has no size, import, copied-code or dead-code checks yet, say
so in the report and offer [tools.md](references/tools.md). A tool catches
those problems the same way every time, for free. An agent should never report
them.

## 1. Triage

1. Find the base: the PR's base branch, or the branch the user names, or
   `main`. Collect the change:

   ```
   git diff --name-only <base>...HEAD > temp/review/<run>/files.txt
   git diff <base>...HEAD > temp/review/<run>/diff.patch
   ```

2. Pick the specialists:

   ```
   node <skill-root>/scripts/triage.mjs temp/review/<run>/files.txt > temp/review/<run>/triage.json
   ```

   It matches changed paths to reviewers by fixed rules
   ([triage.md](references/triage.md)). A project can add rules in
   `.agents/review/triage.json`. Keep its choice; add a reviewer only with a
   reason you write down.
3. Write the change's goal in one paragraph in `temp/review/<run>/goal.md`,
   from the request, the PR text, the commits and any plan in `docs/plans/`.
   Every reviewer judges the change against this.
4. Diffs over about 1,500 changed lines: split by top folder or module, as
   `triage.json` lists in `chunks`. Run step 2 once per chunk.

## 2. Specialists

Every reviewer is the same read-only agent, `code-reviewer`
([agents/code-reviewer.md](../../agents/code-reviewer.md) in the plugin),
pointed at a different lens file in [lenses/](lenses/). Only the lens file for each
reviewer gets loaded, and only during a review.

| Reviewer in `triage.json` | Lens file | Model |
| --- | --- | --- |
| `review-correctness` | [correctness.md](lenses/correctness.md) | session's |
| `review-access` | [access.md](lenses/access.md) | session's |
| `review-contract` | [contract.md](lenses/contract.md) | session's |
| `review-data` | [data.md](lenses/data.md) | session's |
| `review-fit` | [fit.md](lenses/fit.md) | session's |
| `review-tests` | [tests.md](lenses/tests.md) | session's |
| `review-ui` | [ui.md](lenses/ui.md) | session's |
| `review-scope` | [scope.md](lenses/scope.md) | fast (for example `haiku`) |

Start one `code-reviewer` agent per reviewer, all at the same time. Set the model
from the table when you start it. Give each one:

- the path to its lens file,
- the path to `temp/review/<run>/` (goal, files, diff, tool report),
- the path to [finding.md](references/finding.md), the shape every finding
  comes back in,
- the chunk it reviews, if any,
- for the fit lens: the path to the `write-code` skill's `SKILL.md`,
- for the UI lens: the screenshot folder, or "no screenshots".

They must not see each other's findings. Save each reply as-is to
`temp/review/<run>/candidates/<reviewer>.md`.

A reviewer that fails or times out is listed under "Not checked" in the report.
Don't re-run it with a softer prompt.

**No sub-agents?** (Some tools can't start them.) Run the lenses one after
another yourself. Before each, read [code-reviewer.md](../../agents/code-reviewer.md) and that lens file,
and follow only them. Write each result to its file before you read the next
lens. Say in the report that the review ran in this mode.

## 3. Blind spot

Start `code-reviewer` with [blind-spot.md](lenses/blind-spot.md), the packet and
the `candidates/` folder. Save its reply to `candidates/blind-spot.md`.

## 4. Judge

Start `code-reviewer` with [judge.md](lenses/judge.md), the packet, the whole
`candidates/` folder and the path to [report.md](references/report.md). It
returns the final report in that shape. Save it to
`temp/review/<run>/report.md`.

## Hand it over

- **Locally:** show the report as it is. Offer to fix the "Act on" items; the
  user picks. Don't fix anything they didn't pick.
- **On a PR:** post the report as one comment. Update that comment on the next
  run; don't add a new one each time. The review never blocks the merge; only
  the tools do.
- Keep `temp/review/<run>/` until the user has seen the report.

## Set up a project

| Need | Read |
| --- | --- |
| Tool checks (size, nesting, cycles, layers, copied and dead code) | [tools.md](references/tools.md) |
| The project's own rules files in `.agents/review/` | [project-rules.md](references/project-rules.md) |
| Run the review on every pull request | [ci.md](references/ci.md) |

## Limits

- The reviewers can read and search files, nothing else. They can't run code,
  so anything that needs running goes under "Not checked" with the exact
  command.
- Quick and plan mode trade coverage for speed. The report says which mode
  ran, so nobody mistakes a quick review for a full one.
