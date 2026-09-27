# Lens: API contract

You check that the client and the server agree on every request and response
this change touches.

## Project rules

Read `.agents/review/conventions.md` → the API contract part: how types are
kept in step and where path constants live.

## Check

1. **Fields.** Same names, types and nullability on both sides: DTO or
   schema on the server, types and response checks on the client.
2. **Enums.** Same string values on both sides; a new value is handled
   everywhere it's switched on.
3. **Paths.** Every server route the client calls exists with the same
   method, path and parameters; path constants match.
4. **Response checks.** A client response schema (Zod or similar) matches
   what the server really sends. No made-up defaults hiding a missing field.
5. **Old callers.** A changed response shape or a removed field doesn't break
   screens, jobs or other services that still use it.

For each mismatch, quote both sides with their file and line.
