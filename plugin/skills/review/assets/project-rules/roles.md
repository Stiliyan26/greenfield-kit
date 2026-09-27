# Roles and access (for reviewers)

Source of truth: <path to the permissions doc>. Read the rows for the feature
the diff touches. Don't invent permissions; a row that's silent is an open
question, not a bug.

## Roles

- <role>: <one line>
- <how "team" or "own" is defined, and the file that computes it>

## What to check

- The server refuses every "No". Hiding a button is not access control.
- Scope is applied in the query, before filters and paging.
- <sensitive fields and who must never receive them>
- <actions nobody may take, even an admin>

## Where it lives in code

| Area | Files |
| --- | --- |
| <server scope> | <files> |
| <client guards> | <files> |

## Tests

<Where the allow/deny tests live. Each touched row needs both.>

## Open questions (don't flag)

- <behavior no requirement settles yet>
