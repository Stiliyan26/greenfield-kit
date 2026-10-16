# Report mode

Report mode picks up after step 4 of the skill. The reviewers have written
their feature reports, `<run>/<feature>.md`. The user decides what gets fixed.

## Contents
- R1 README
- R2 The user ticks
- R3 Fix agents
- R4 Merge
- R5 Close
- The files
- README.md
- <feature>.md
- Rules for every problem

## R1. README

1. Read every feature report.
2. Write `README.md` in the shape below. If two reviewers found one problem
   from both sides, make it one row. Keep it in the feature report where the fix
   lives. Point the other file at it.
3. Copy each problem as its reviewer wrote it. Every row comes from a feature
   report.
4. Commit the folder (`review: <target>`) unless the user said not to.
5. Tell the user: counts by priority, the top three, the folder path, and
   "Tick the Decision lines, then say fix."

Done when every problem of every feature report has a row.

## R2. The user ticks

The user edits the Decision line of each problem: fix now (with the option
letter), later, not a problem, or explain more. The Decision lines belong to
the user. For "explain more", answer in chat with more context and evidence.
The user then ticks again.

Done when the user says "fix".

## R3. Fix agents

1. Read every Decision line. Group the "fix now" problems by feature report.
2. Propose the fix agents and wait for a yes:

```
Fix: 9 problems ticked in 3 features
  1. orders     #7A #8A #9B #21A     (sonnet)
  2. invoices   #13A #15A            (sonnet)
  3. customers  #4A #12A #19A        (sonnet)
Foundation change: #9B needs a server migration → fable
Go? Or: a number of agents, another model.
```

3. Give each feature report one agent, up to the config's `maxFixAgents`. Past
   the cap, let the smallest share an agent.
4. Use the `fixModel`. Use the `reviewerModel` for a fix the review marked as
   needing judgement.
5. Each fix agent works in the one checkout on a branch `fix/<feature>`. It
   edits and commits only its feature's files, so two agents never share a
   file.
6. For each problem, the agent writes the "Test to add" and watches it go
   red. It applies the chosen option, runs the project's tests, and sets
   Status to `fixing`.
7. The agent reports one line per problem: fixed, or blocked and why.

Done when every fix agent has reported.

## R4. Merge

1. Take one branch at a time: rebase, run all the project's tests, read the
   diff against the feature's ownership, merge.
2. If a fix touches shared code or another feature's files, send it back to
   its agent with a request.
3. Tell the user what merged and what is blocked.

Done when every branch is merged or listed as blocked.

## R5. Close

1. Start the reviewer of each feature again, with the same agent and model.
   Give it the feature report, the merged code and the checklist.
2. It runs the proof of every `fixing` problem again (reviewer.md, "Close").
3. Update the README's Status and Fixed count. Commit (`review: close
   <target>`). Tell the user what is still open.

Done when no problem is left in `fixing`.

## The files

A report-mode review writes one folder: `reviews/<date>-<target>/` in the
project (`2026-09-29-orders`, `2026-09-29-app`, `2026-09-29-plan`). It is
committed, and it is the record: found → chosen → fixed → proved.

```
reviews/2026-09-29-app/
  README.md         the summary table across every feature, and the order to fix
  orders.md         one feature report per feature, every problem in full
  invoices.md
  customers.md
  captures/         screenshots the reviewers took (only when a problem is visible)
```

The lead writes `README.md`. Each reviewer writes its feature report. The
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
| 1 | Editing a paid order creates a second order | Critical | Customer: charged twice | [orders](orders.md#1) | ran | | open |
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

Rules: put every problem from every feature report in the table. Make numbers
global across the review: the feature report uses the same number. Write no
score, no praise and no summary of the diff.

## <feature>.md

````markdown
# Review: <feature> · <date>

<3–5 lines: what this feature does and who uses it, from its feature file
and DESIGN.md. Files reviewed: <n>, <lines> lines. Ran: <what was run:
checks, unit tests, e2e specs, app started or not>.>

## 7. Editing a paid order creates a second order · Critical

**Context.** Orders → a paid order → Edit → Save. The server has a replace
path that refunds the old order and cancels it
(`orders.service.server.ts:239`), but only the update call reaches it.

**Impact.** A customer edits a paid order. The client calls create, not
update. Same items: the server refuses a duplicate, so the customer cannot
change the delivery date. Other items: the old order stays paid, a new
pending order is added, and the card is charged twice once it is paid.

**Why.** `isEditingPaid` sends the edit down the create path. The banner
"Editing a paid order places a new order" hides it.

**Current code** (`src/features/edit-order/ui/order-form.tsx:180-185`)

```tsx
if (isEdit && order && !isEditingPaid) {
  await updateOrder.mutateAsync({ orderId: order.id, ...payload });
} else {
  await createOrder.mutateAsync(payload);
}
```

**Proved by.** The e2e command, `e2e/edit-order.spec.ts -g "edit paid"`
→ the network log shows the create-order call, not update-order. Screenshot:
`captures/7-edit-paid.png` (the two orders after Save).

**Fix options**

- **A (recommended).** Always update on edit; the server already replaces
  a paid order.

  ```tsx
  if (isEdit && order) {
    await updateOrder.mutateAsync({ orderId: order.id, ...payload });
  } else {
    await createOrder.mutateAsync(payload);
  }
  ```

  Cost: 2 lines, no server change. A replaced order then shows a `cancelled`
  row in history (see #9).

- **B.** Keep create and add a server rule that cancels the old order when a
  new one names `replaces: <id>`. Cost: input schema, service and migration
  change; two code paths for one thing.

**Test to add.** "Customer edits a paid order and the old order stops
counting."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open
````

### Rules for every problem

- **Title:** what goes wrong, for whom, in product words. Use no file names.
- **Priority:** Critical = data, money, access, or a user can't finish a
  task. Important = a wrong result or a real annoyance with a workaround.
  Later = cosmetic, cleanup, tests. Order in the file: Critical first.
- **Context:** 3–5 lines from the feature file and `DESIGN.md`: what the part
  does, who uses it, where this sits in the flow. The reader cannot recall
  the whole app.
- **Current code:** copy it from the file with `path:from-to`. Never
  paraphrase. Read the lines again right before you paste them.
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
- Write one problem per cause. Two symptoms of one cause are one problem,
  with both symptoms in Impact. Give every problem this full shape, Later
  included. Write no one-liners.

### Per-file sections after the problems

```markdown
## Not run

- <check that needs the app, a seed, an account, or a service; the exact command>

## Already there

- `path:line`: <problems in lines this change didn't touch; diff reviews only>
```
