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

## Changes
- Database: new or changed tables/columns; what happens to existing data.
- API: each endpoint, who may call it, what goes in and out, errors. Show one
  example call from the screen that uses it.
- Screens: which screens and components, reused or new. Name the approved
  studio screen each one follows. Don't restate colors or fonts; `DESIGN.md`
  owns them.

## Decisions
- <Question>: <chosen option>. Why: <reason>. Evidence: <file, doc, test>.
  Decided by: agreed | user (AI concern: <risk>)

## Build order
1. <smallest usable piece> (D1, D2)
2. <next piece> (D3)

## Open questions
- <Question> (blocks step N)
```
