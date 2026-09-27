# Plan template

Save to the plan folder named in `.agents/PROJECT.md`, or
`docs/plans/<feature>/plan.md`.

Give each "Done when" line an ID. Tests and later tasks refer to these IDs.

```markdown
# <Feature> plan

Status: Draft | Approved (YYYY-MM-DD, by the user)
Design: `DESIGN.md` at studio revision <n>, or "no approved design yet"

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
  example call from the screen that uses it.
- Responses: for each endpoint, the fields each role gets back. Never a
  database row as it is.
- Screen actions: every button, link, filter and search on each approved
  screen, and the endpoint and role rule behind it. An action without an
  endpoint is a gap to close or a line under "Out of this release".
- Screens: which screens, reused or new. Name the approved studio screen each
  one follows. Don't restate colors or fonts; `DESIGN.md` owns them.
- Components: which built components (the gallery from `DESIGN.md`'s
  Components table) each screen uses. A screen that needs a part the gallery
  doesn't have goes back to design first.
- Dates and times: the timezone, how times are stored, and where a day, week
  and month start and end.

## Decisions
- <Question>: <chosen option>. Why: <reason>. Evidence: <file, doc, test>.
  Decided by: agreed | user (AI concern: <risk>)

## Build order
1. <smallest usable piece> (D1, D2)
2. <next piece> (D3)

## Open questions
- <Question> (blocks step N)
```
