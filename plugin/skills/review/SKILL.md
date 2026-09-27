---
name: review
description: Review a PR, a branch, uncommitted changes, a commit range, the whole app, or a plan. Tool checks first, then at most 5 read-only agents - up to 4 area reviewers, each checking its own files through every lens they need (correctness, access, contract, data, fit, tests, UI, scope, blind spot), and a judge. Shows the agent plan and waits for the user's OK before starting any agent. Produces one report sorted by what to act on. Full mode for big or risky changes, quick mode for small ones, plan mode before code exists. Use before merging, when asked to "review", or in CI on a pull request. Also sets up the tools and CI a project needs for it.
---

# Review

`<skill-root>` is the folder that holds this `SKILL.md`.

You run the review. You don't review the code yourself and you never fix
anything during a review. The area reviewers find problems, the judge filters
them, and you pass the results along exactly.

```
target ─► 0 tools ─► 1 plan ─► 2 user confirms ─► 3 area reviewers (≤ 4, parallel) ─► 4 judge ─► report
            │ fail = CI red                        └──────────── at most 5 agents in all ───────────┘
```

## What it reviews

| Target | How to collect it (step 1) |
| --- | --- |
| A pull request | Check it out (`gh pr checkout <n>`), then `--base origin/<its base branch>` |
| A branch | `--base <branch>`; `main` when the user names none |
| Uncommitted work | `--uncommitted`: staged, unstaged and new files |
| Commits | `--range <a>..<b>`; one commit is `<sha>^..<sha>` |
| The whole app | `--app`: every tracked source file, no diff |
| A plan | Plan mode, below; no script |

When the user doesn't name a target: review uncommitted work if there is
any, otherwise the branch against `main`. The plan in step 2 shows the target,
so the user can correct it.

## Modes

| Mode | When | Agents |
| --- | --- | --- |
| Full (default) | A branch, PR or the whole app; anything risky: access, data, API, many files | Up to 4 area reviewers with every lens their files need, plus the judge |
| Quick | A small change: a few files, no access, data or API change | Step 1 with `--quick`: lenses `correctness` and `fit` only, no blind spot. Usually 1 reviewer plus the judge |
| Plan | A plan, API design or architecture before code exists | Skip tools and the script. One reviewer with the `plan` lens ([plan.md](lenses/plan.md)) on the plan files, plus the judge: 2 agents |

Pick quick only when you can say why the change isn't risky; when unsure, run
full. In plan mode, `goal.md` names the plan files and the request, and there
is no diff.

## The 5-agent cap

A review starts at most 5 agents, the judge included. Never start more, and
never start a second batch in the same review to get round it.

A bigger target gets narrower, not wider. Each area reviewer gets about 3,000
changed lines (a diff) or 8,000 lines (the whole app), because past that it
skims. The plan fills the 4 areas in order of risk (access and data first)
and lists the rest under "Not reviewed". To cover those, the user runs another
review with `--only` on them.

## 0. Tools

Run the project's gate command from `.agents/PROJECT.md` (for example
`npm run gates`). Save its output to `temp/review/<run>/tools.txt`. If a check
fails, the review still runs, but the report says which check failed.

If the project has no size, import, copied-code or dead-code checks yet, say
so in the report and offer [tools.md](references/tools.md). A tool catches
those problems the same way every time, for free. An agent should never report
them.

## 1. Plan

1. Collect the target and plan the agents:

   ```
   node <skill-root>/scripts/triage.mjs --out temp/review/<run> <target flag> [--quick] [--only <regex>]
   ```

   It writes `files.txt` (lines and path per file), `diff.patch` (not for
   `--app`) and `plan.json`: the areas, each with its files and lenses, what
   is not reviewed, and what it skipped (lock files, generated files, binaries,
   `temp/`). The rules are in [triage.md](references/triage.md).
   `.agents/review/triage.json` is optional; if the project has one, the
   script adds its rules.
2. Write the goal in one paragraph in `temp/review/<run>/goal.md`. For a
   change: from the request, the PR text, the commits and any plan in
   `docs/plans/`. For the whole app: what the app is for (from
   `.agents/PROJECT.md` and the product brief) and what the user wants found.
   Every reviewer judges the code against this.
3. Keep the script's areas and lenses. Change them only when the user asks in
   step 2, by running the script again with other flags.

## 2. Confirm with the user

Show the plan and wait. Start no agent before the user says yes.

```
Review plan: branch vs main · full mode · 5,400 changed lines
Agents: 4 of 5
  1. server/src/invoices, server/src/auth (2,900 lines): correctness, access, data, contract, tests, fit, scope, blind spot
  2. client/src/invoices (1,500 lines): correctness, contract, ui, tests, fit, scope, blind spot
  3. server/src/orders (1,000 lines): correctness, access, tests, fit, scope, blind spot
  4. judge
Not reviewed: client/src/reports (2,000 lines): over the 5-agent cap
Skipped: package-lock.json (lock file)

Go ahead? Or name areas to review instead (--only), or switch to quick mode.
```

In plan mode the plan is short: the plan files, one plan reviewer and the
judge, 2 agents.

If the user changes the target, the areas or the mode, run step 1 again and
show the new plan.

Skip the question only when nobody can answer: in CI, or when the user
already said in this request to go ahead without asking. Then put the plan at
the top of the report.

## 3. Area reviewers

Every reviewer is the same read-only agent, `code-reviewer`
([agents/code-reviewer.md](../../agents/code-reviewer.md) in the plugin). Start
one per area in `plan.json`, all at the same time, on the session's model.
Give each one:

- its area: the name, the file list, and its lenses in the order
  `plan.json` gives them, as paths to the lens files below,
- the path to `temp/review/<run>/` (goal, files, diff, tool report),
- the path to [finding.md](references/finding.md), the shape every finding
  comes back in,
- for the fit lens: the path to the `write-code` skill's `SKILL.md`,
- for the UI lens: the screenshot folder, or "no screenshots".

| Lens in `plan.json` | Lens file |
| --- | --- |
| `correctness` | [correctness.md](lenses/correctness.md) |
| `access` | [access.md](lenses/access.md) |
| `data` | [data.md](lenses/data.md) |
| `contract` | [contract.md](lenses/contract.md) |
| `ui` | [ui.md](lenses/ui.md) |
| `tests` | [tests.md](lenses/tests.md) |
| `fit` | [fit.md](lenses/fit.md) |
| `scope` | [scope.md](lenses/scope.md) |
| `blind-spot` | [blind-spot.md](lenses/blind-spot.md), always last |

Each reviewer goes through its lenses one at a time on its own files and tags
every finding with the lens that found it. The reviewers must not see each
other's findings. Save each reply as-is to
`temp/review/<run>/candidates/<n>-<area>.md`.

A reviewer that fails or times out is listed under "Not checked" in the report.
Don't re-run it with a softer prompt.

**No sub-agents?** (Some tools can't start them.) Review the areas one after
another yourself. Before each, read
[code-reviewer.md](../../agents/code-reviewer.md) and that area's lens files,
and follow only them. Write each result to its file before you start the next
area. Say in the report that the review ran in this mode.

## 4. Judge

Start `code-reviewer` with [judge.md](lenses/judge.md), the review folder, the
whole `candidates/` folder and the path to [report.md](references/report.md).
It returns the final report in that shape. Save it to
`temp/review/<run>/report.md`.

## Hand it over

- **Locally:** show the report as it is. Offer to fix the "Act on" items; the
  user picks. Don't fix anything they didn't pick. If areas were not
  reviewed, offer the `--only` run that covers them.
- **On a PR:** post the report as one comment. Update that comment on the next
  run; don't add a new one each time. The review never blocks the merge; only
  the tools do.
- Keep `temp/review/<run>/` until the user has seen the report.

## Set up a project

| Need | Read |
| --- | --- |
| Tool checks (size, nesting, cycles, layers, copied and dead code) | [tools.md](references/tools.md) |
| The project's own rules files in `.agents/review/` (all optional) | [project-rules.md](references/project-rules.md) |
| Run the review on every pull request | [ci.md](references/ci.md) |

## Limits

- The reviewers can read and search files, nothing else. They can't run code,
  so anything that needs running goes under "Not checked" with the exact
  command.
- The cap trades coverage for cost. The report lists every area that was not
  reviewed, so nobody mistakes a partial review for a full one.
- Quick and plan mode trade coverage for speed. The report says which mode
  ran.
