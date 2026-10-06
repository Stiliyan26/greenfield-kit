# Report mode

Report mode picks up after step 4 of the skill. The reviewers have written
their feature files; the user decides what gets fixed.

## 5. README

Read every feature file and write `README.md` in the shape below. A problem
that two reviewers found from both sides is one row: keep it in the feature
file where the fix lives and point the other file at it. Copy each problem
as its reviewer wrote it. Every row comes from a feature file.

Commit the folder (`review: <target>`) unless the user said not to. Tell
the user: counts by priority, the top three, the folder path, and "Tick the
Decision lines, then say fix."

Done when every problem of every feature file has a row.

## 6. The user ticks

The user edits the Decision line of each problem: fix now (with the option
letter), later, not a problem, or explain more. The Decision lines are the
user's. For "explain more", answer in chat with more context and evidence;
the user then ticks again.

Done when the user says "fix".

## 7. Fix agents

Read every Decision line and group the "fix now" problems by feature file.
Propose the fix agents and wait for a yes:

```
Fix: 9 problems ticked in 3 features
  1. time-off   #7A #8A #9B #21A     (sonnet)
  2. reporting  #13A #15A            (sonnet)
  3. people     #4A #12A #19A        (sonnet)
Foundation change: #9B needs a server migration → fable
Go? Or: a number of agents, another model.
```

Each feature file gets one agent, up to the config's `maxFixAgents`; past
the cap, the smallest share an agent. Use the `fixModel`, and the
`reviewerModel` for a fix the review marked as needing judgement.

Each fix agent works in the one checkout on a branch `fix/<feature>`, with
the ownership rules of `deliver-feature`: it edits and commits only its
feature's files. For each problem it writes the "Test to add" and sees it
go red, applies the chosen option, runs the project's tests, and sets
Status to `fixing`. It reports one line per problem: fixed, or blocked and
why.

Done when every fix agent has reported.

## 8. Merge

Take one branch at a time: rebase, run all the project's tests, read the
diff against the feature's ownership, merge. A fix that touches shared code
or another feature's files goes back to its agent with a request. Tell the
user what merged and what is blocked.

## 9. Close

Start the reviewer of each feature again, with the same agent and model,
the feature file, the merged code and the checklist. It runs the proof of
every `fixing` problem again ([code-reviewer.md](../../../agents/code-reviewer.md),
"Close"). Update the README's Status and Fixed count, commit
(`review: close <target>`), and tell the user what is still open.

Done when no problem is left in `fixing`.

## The files

A report-mode review writes one folder: `reviews/<date>-<target>/` in the
project (`2026-09-29-time-off`, `2026-09-29-app`, `2026-09-29-plan`). It is
committed, and it is the record: found → chosen → fixed → proved.

```
reviews/2026-09-29-app/
  README.md         the summary table across every feature, and the order to fix
  time-off.md       one file per feature, every problem in full
  reporting.md
  people.md
  captures/         screenshots the reviewers took (only when a problem is visible)
```

The lead writes `README.md`. Each reviewer writes its feature file. The
user edits the Decision lines. The reviewer edits the Status lines when it
closes a problem. Nobody else edits these files.

## README.md

````markdown
# Review: <target> · <date>

**Target:** whole app | branch `x` vs `main` | uncommitted | range `a..b` | plan
**Tools:** passed | failed: <check names> (`tools.txt`)
**Depth:** full | quick · **Reviewers:** <n> (<model>) · **May run the app:** yes | no
**What worried you:** <the user's words, or "nothing named">
**Problems:** <n> critical · <n> important · <n> later · **Fixed:** <n>

## All problems

| # | Problem | Priority | Who is hurt | Feature | Proof | Decision | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Editing approved leave creates a second request | Critical | Employee: double-booked and charged twice | [time-off](time-off.md#1) | ran | | open |
| 2 | … | | | | read | | open |

Proof: `ran` (a command, test or screenshot), `read` (found the line, not run).

## Suggested order

1. <#, #, #>: <why first: money, access, data>
2. <#, #>: <why next>
3. The rest.

## Not run

- <what could not be proved, and the exact command that would>
- <the app could not be started because …>

## Already there (diff reviews only)

- `path:line`: <one line each>; problems in lines this change didn't touch.
````

Rules: every problem from every feature file is in the table, none left
out. Numbers are global across the review: the feature file uses the same
number. No score, no praise, no summary of the diff.

## <feature>.md

````markdown
# Review: <feature> · <date>

<3–5 lines: what this feature does and who uses it, from its feature file
and DESIGN.md. Files reviewed: <n>, <lines> lines. Ran: <what was run:
gates, unit tests, e2e specs, app started or not>.>

## 7. Editing approved leave creates a second request · Critical

**Context.** Time off → an approved upcoming row → Edit → Save. The server
has a replace path that credits the old days back and cancels the old row
(`requests.service.ts:239`), but only PATCH reaches it.

**Impact.** An employee edits approved leave. The client sends a plain POST.
Overlapping dates: the server refuses, so moving leave by a day is
impossible. Non-overlapping: the old leave stays approved and charged, a new
pending request is added, and the balance is charged twice once approved.

**Why.** `editingApproved` sends the edit down the create path. The banner
"Editing approved leave submits a new request" hides it.

**Current code** (`client/src/features/time-off/request/ui/RecordModal.tsx:180-185`)

```tsx
if (isEdit && request && !editingApproved) {
  await updateRequest.mutateAsync({ requestId: request.id, ...payload });
} else {
  await createRequest.mutateAsync(payload);
}
```

**Proved by.** `npx playwright test e2e/tests/employee/time-off-tab.spec.ts -g "edit approved"`
→ the network log shows `POST /api/leave/requests`, not PATCH. Screenshot:
`captures/7-edit-approved.png` (the two rows after Save).

**Fix options**

- **A (recommended).** Always PATCH on edit; the server already replaces
  approved leave.

  ```tsx
  if (isEdit && request) {
    await updateRequest.mutateAsync({ requestId: request.id, ...payload });
  } else {
    await createRequest.mutateAsync(payload);
  }
  ```

  Cost: 2 lines, no server change. Moved leave then shows a `cancelled` row
  in history (see #9).

- **B.** Keep POST and add a server rule that cancels the old row when a
  new request names `replaces: <id>`. Cost: DTO, service and migration
  change; two code paths for one thing.

**Test to add.** "Employee edits approved upcoming leave and the old row
stops counting."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open
````

### Rules for every problem

- **Title:** what goes wrong, for whom, in product words. No file names in
  the title.
- **Priority:** Critical = data, money, access, or a user can't finish a
  task. Important = a wrong result or a real annoyance with a workaround.
  Later = cosmetic, cleanup, tests. Order in the file: Critical first.
- **Context:** 3–5 lines from the feature file and `DESIGN.md`: what the part
  does, who uses it, where this sits in the flow. The reader can't remember
  the whole app.
- **Current code:** copied from the file with `path:from-to`, never
  paraphrased. Read the lines again right before you paste them.
- **Proved by:** the exact command and what it printed, or the screenshot
  path, or `Not run: <command that would prove it>`. A screenshot only when
  the problem changes what the user sees in a way that matters; a one-word
  label change gets none.
- **Fix options:** two or three when there are real alternatives, each with
  its own code and a one-line cost. One option when there is only one. The
  recommended one is marked and comes first. Correct code uses the
  project's existing helpers and imports; check they exist.
- **Test to add:** named by what it proves. The fix agent writes it first.
- **Decision:** the user ticks one box and, for fix now, circles a letter.
  The reviewer never ticks it.
- **Status:** `open` → `fixing` (a fix agent has it) → `fixed` with the
  proof re-run: `fixed · proved by <command> → <output>` → or `not a
  problem` / `later` copied from the decision.
- One problem per cause. Two symptoms of one cause are one problem, with
  both symptoms in Impact. Every problem gets this full shape, Later
  included. No one-liners.

### Per-file sections after the problems

```markdown
## Not run

- <check that needs the app, a seed, an account, or a service; the exact command>

## Already there

- `path:line`: <problems in lines this change didn't touch; diff reviews only>
```
