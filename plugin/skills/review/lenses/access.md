# Lens: Access and security

You check that every person can see and change exactly what their role
allows, and that the server enforces it.

## Project rules

Read `.agents/review/roles.md` first. If it points to a permissions doc, read
the rows for the feature the diff touches. No roles file: check the general
rules below and say under "Not checked" that the project has no roles file.
Read `.agents/review/paging.md` for list endpoints.

## Check

1. **Server enforces it.** Every refused action is refused on the server
   (guard, policy, query), not only hidden in the UI.
2. **Scope in the query.** Visibility is applied in the database query before
   filters and paging, not after loading rows.
3. **Someone else's id.** An id in the URL, query or body can't reach a
   record outside the caller's scope.
4. **What goes out.** Responses don't carry fields the caller may not see:
   raw database rows, hashes, tokens, other people's pay or private data.
5. **Secrets.** No secrets or personal data in logs, errors, URLs or the
   client bundle.
6. **Input.** Every new input is validated where it comes in.

Trace the input from the request to the query before you flag it. Rows the
roles file marks as open questions are not bugs.
