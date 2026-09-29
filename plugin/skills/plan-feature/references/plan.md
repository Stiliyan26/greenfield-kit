# Plan template

Save to the plan folder named in `.agents/PROJECT.md`, or
`docs/plans/<feature>/plan.md`. The contract and the feature files sit next to
it: `docs/plans/<feature>/contract.ts` (or `openapi.yaml`) and
`docs/plans/<feature>/features/<slug>.md`.

Give each "Done when" line an ID. Tests, scenarios and feature files refer to
these IDs.

```markdown
# <Feature> plan

Status: Draft | Approved (YYYY-MM-DD, by the user)
Design: `DESIGN.md` at studio revision <n>, or "no approved design yet"
Front end: `web/` promoted from that revision, or "not yet"

## What it does
Two or three sentences a user would understand.

## Who can do what
- <Role>: can <action>. Can't <action>.

## Done when
- D1: <someone does X> → <they see Y>
- D2: <someone not allowed tries X> → <blocked, sees Z>
- D3: <edge case> → <what happens>
- D4: <someone not logged in tries X> → <blocked, sees Z>

## Changes
- Database: new or changed tables/columns; what happens to existing data.
- API: each endpoint, who may call it, what goes in, errors. Show one
  example call from the screen that uses it. The contract file is the
  checked version of this list.
- Responses: for each endpoint, the fields each role gets back. Never a
  database row as it is.
- Screen actions: every button, link, filter and search on each approved
  screen, and the endpoint and role rule behind it. An action without an
  endpoint is a gap to close or a line under "Out of this release".
- Screens: which screens, reused or new. Name the approved studio screen and
  the `web/` route each one follows. Don't restate colors or fonts;
  `DESIGN.md` owns them.
- Screen behaviour: per screen, how data loads, what is optimistic,
  validation and where errors show, when the empty, loading and denied
  states appear, route guards.
- Parts: which parts each screen uses, from `web/src/design/parts/` and the
  shadcn parts in `DESIGN.md`'s Components table. A screen that needs a part
  the design doesn't have goes back to the studio first.
- Dates and times: the timezone, how times are stored, and where a day, week
  and month start and end.

## Contract
Path of the contract file, and how the code checks against it (types
imported by both sides, or a schema check in CI).

## Features
One line per feature file: name, requirement IDs, wave, depends on. Shared
things two features need are listed under Foundation, not in a feature.

## Foundation
What is built before the fan-out: schema, auth, API skeleton, shared parts
and helpers, the app shell.

## Decisions
- <Question>: <chosen option>. Why: <reason>. Evidence: <file, doc, test>.
  Decided by: agreed | user (AI concern: <risk>)

## Build order
1. Foundation (D1, D2)
2. Wave 1: <features> (D3, D4)
3. Wave 2: <features> (D5)

## Open questions
- <Question> (blocks step N)
```
