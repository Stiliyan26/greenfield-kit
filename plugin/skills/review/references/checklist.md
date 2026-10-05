# Checklist

What a reviewer looks for in its feature. Go through the feature's files
one at a time with the whole list in mind; don't run the list as separate
passes. Every problem you write down must name the input and the code path
that gets there, and must be proved or marked "Not run" with the command
that would prove it.

The project's own rules live in `.agents/review/` (roles, scope, paging,
conventions; see [project-rules.md](project-rules.md)). Read the ones that
exist before you start. When the code and a rules file disagree, the rules
win. Rows a rules file marks as open questions are not problems.

## 1. Correctness

- Edges: empty, null, zero, one item, first and last page, very long text,
  dates at midnight and across time zones, money rounding.
- Errors: caught and ignored, logged and continued, turned into a success
  response, a promise nobody awaits.
- Repeats and crashes: a double click or a retried request that saves twice;
  a crash halfway that leaves half the data written.
- Callers: every caller of a changed function, endpoint or event still gets
  what it expects.
- Cause or symptom: a guard, retry or cast that hides a deeper problem.

Before you say "this could be null", follow the call chain and show how a
null gets there.

## 2. Access

- The server refuses every refused action (guard, policy, query), not only
  the UI.
- Visibility is applied in the query before filters and paging.
- An id in the URL, query or body can't reach a record outside the caller's
  scope.
- Responses don't carry what the caller may not see: raw rows, hashes,
  tokens, other people's pay or private data.
- No secrets or personal data in logs, errors, URLs or the client bundle.
- Every new input is validated where it comes in.

## 3. Data

- Lists filter, sort and page in the query, in the order visibility →
  filters → page. Nothing loads every row and cuts it in memory.
- No query inside a loop over rows.
- Writes that must succeed or fail together are in one transaction.
- Migrations run on real data (defaults for new non-null columns), can be
  reverted, don't drop data by accident. Schema changes only through
  migrations.
- A new filter, sort or foreign key on a growing table has an index.
- Sorts end with a unique field so rows don't move between pages.

## 4. Contract

- Same field names, types and nullability on both sides.
- Same enum values on both sides; a new value is handled everywhere it's
  switched on.
- Every route the client calls exists with the same method, path and
  parameters.
- A client response schema matches what the server really sends; no made-up
  defaults hiding a missing field.
- A changed response shape doesn't break screens, jobs or other callers.

Quote both sides with file and line.

## 5. UI

- Loading, empty, error and long-content states exist and keep useful
  content on screen while reloading.
- Phone width works: no sideways scroll, nothing clipped, tap targets big
  enough.
- Real buttons and links with the right `type`, visible focus, labels on
  inputs, dialogs that trap and return focus.
- Colors, fonts, spacing and radius come from the tokens, not raw values.
- Screens match `DESIGN.md`, including copy and states.
- A form can't be sent twice by a double click.

Never call a screen a pass without seeing it. When you may run the app,
look; when you may not, say "Not run".

## 6. Tests

- Would the test still pass if the code returned nothing or the wrong thing?
  Then it checks nothing.
- New behaviour has a test at the level where it can break.
- Each access rule has an allow and a deny test.
- The test doesn't mock the very thing it claims to test.
- Edge cases are tested, not only the happy path.

Name a missing test by what it proves: "Employee cannot download another
person's invoice".

## 7. Fit

Read the `write-code` skill for the kinds of files in the feature, then
`.agents/review/conventions.md`.

- Each piece lives in the module and layer that owns it.
- A helper, component or query that already exists wasn't written again.
  Search by name and by what it does before flagging.
- No old path kept alive next to the new one; no flag or special case where
  the model should have changed.
- No wrappers that only pass arguments on, options nobody uses, code kept
  "just in case", abstractions with one caller.
- Derived values aren't stored and synced; a state that should be a union
  with a `kind` isn't a bag of booleans.
- Names still match what the code does.

"I would have done it differently" is not a problem.

## 8. Scope

- The change adds a feature, screen, entity or setting the scope file lists
  as out.
- Changes that don't trace back to the goal: drive-by refactors, new
  options, unrelated files.
- Code that settles something the scope doc lists as still open.

Quote the scope line each problem rests on. Usually "Later", unless it
ships something the user said not to build.

## 9. Last look

After the list: which files and hunks in your feature does none of your
problems mention? Start there, and look where reviewers usually don't:

- config and env: a new setting with no default or no doc,
- feature flags: a path that ignores the flag,
- seeds, fixtures and test data that no longer match the schema,
- deleted code that something still imports, calls or links to,
- build, CI, Docker and deploy files,
- generated files edited by hand,
- text shown to users: wrong, leaking internals, missing.

For a diff, also: what does the goal promise for this feature that nothing
in the diff delivers?

## Plan mode

When the target is a plan (no code yet), check `plan.md` and every feature
file instead. You haven't seen the interview; find what's missing, don't
rewrite anything. One line per finding: where → what's missing.

- Every requirement in the brief maps to a done-when line and a feature;
  nothing in the plan is out of scope.
- Every role's rights are stated and the server enforces each refusal;
  silent cases are open questions, not guesses.
- Every server function, job, webhook and email has a scenario or an `N/A`
  line for every item of `plan-feature/references/misuse.md`.
- Every outcome is exact: the state, the rows, the message, what didn't
  happen. "Returns an error" is a finding.
- Every failure the design mentions (a slow service, the same call twice,
  two at once) has a scenario.
- Entities, ownership and deletes are clear; lists filter and page in the
  query; migrations can run on real data.
- Every caller of a changed function, table or field has a feature or an
  accepted gap; every accepted gap has a trigger.
- Backend and Frontend sections own different folders; no file, server
  function or table has two owners; anything two features share is in the
  foundation.
- Every feature has tests at every layer of `write-code/references/tests.md`.
- Parts nobody asked for, layers with one user, options "for later".
- Decisions the plan makes that the user never made (no Q-number).

`Where` points at the plan file and section. "Proved by" is the requirement
or rules line the problem rests on.

## Not problems

- What `tools.txt`, the linter or the formatter already catches.
- Style.
- Taste.
- Something a rules file marks as an open question.
- In a diff review, something in lines the diff didn't touch and didn't make
  reachable. Put it under "Already there" in the feature file, one line each.
