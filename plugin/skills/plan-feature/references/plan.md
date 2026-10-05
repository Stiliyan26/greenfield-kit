# Plan files

All in `docs/plans/<project>/`, or the plan folder `.agents/PROJECT.md` names:

- `plan.md`: below.
- `features/<slug>.md`: one per feature, in the shape of
  `greenfield-mode`'s [features.md](../../greenfield-mode/references/features.md).
- The contract is code, not a document: the zod schemas in
  `src/entities/<thing>/schema.ts` and the server functions in
  `*.functions.ts`, which both sides import. `plan.md` names them.

Give each "Done when" line an ID. Scenarios and feature files refer to these
IDs. Number interview answers Q1, Q2… and write the Q-number next to every
decision it settled.

## plan.md

```markdown
# <Project> plan

Status: Draft — interview in progress | Draft | Approved (YYYY-MM-DD, by the user)
Design: `DESIGN.md` at studio revision <n>, or "not approved yet"

## What it does
Two or three sentences a user would understand.

## Who can do what
- <Role>: can <action>. Can't <action>.

## Done when
- D1: <someone does X> → <they see Y>
- D2: <someone not allowed tries X> → <blocked, sees Z>
- D3: <the same action twice> → <what happens>
- D4: <a dependency is down> → <what happens>

## Entities
- <Entity>: fields with limits, owner, what happens on delete, which
  fields each role may see.
- Database: new or changed tables and columns; what happens to existing
  rows; can it be undone.

## Server functions
- `<name>` (`features/<action>/api/` or `entities/<thing>/api/`): who may
  call it, the input schema, the output per role, the errors, what the same
  call twice does, limits. One example call from the screen that uses it.
- Server routes, only for callers outside the app: <none, or the list>.

## Screens
Filled in after the design is approved. Per approved screen (`src/routes/`
path, `views/<screen>`): every action and the server function behind it; how
data loads (loader, hook, live); what is optimistic; validation and where
errors show; when the empty, loading, error and denied states appear; route
guards. Parts: from `shared/ui/` and `DESIGN.md`'s Components table. A
screen or part the design doesn't have goes back to the studio first.

## Dates and times
The timezone, how times are stored, where a day, week and month start and end.

## Deep dives
Only what applies: auth, money, external services, sensitive data.

## Features
One line per feature file: name, done-when IDs, depends on, order.

## Foundation
What is built before the first feature: drizzle schema and migrations, auth,
`server/shared/`, `shared/ui/` parts from the design, the promoted routes and
views, `bun run check`, the verify skill.

## Decisions
- <Question> (Q<n>): <choice>. Why: <reason>. Evidence: <file, doc, test>.
  Decided by: user | agreed (AI concern: <risk>) | my call

## Out of this release
What was discussed and deliberately left out.

## Accepted gaps — revisit when the trigger lands
- <What is missing or weak> (Q<n>). <Why it's fine for now.>
  **Trigger:** <the observable event> → <what to do then>.

## Open questions
- <Question> (blocks feature <slug>)

## Interview record (<YYYY-MM-DD>)
| # | Question | Answer |
| --- | --- | --- |
| 1 | <Question in plain words> | <Answer; "my call" when the user delegated it> |
```

Until the plan is written, a new `plan.md` holds only its title, the Status
line with `interview in progress`, and the interview record, so a half-done
interview can be resumed and nothing mistakes a draft for a plan.
