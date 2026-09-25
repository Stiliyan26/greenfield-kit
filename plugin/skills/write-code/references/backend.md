# Backend code

NestJS defaults. Where modules go is in [structure.md](structure.md); how to
write the TypeScript is in [typescript.md](typescript.md).

## Controllers and services

- Controllers stay thin: check the request, then call a service.
- Check input at the edge with DTOs. Choose what you send back; never return
  database entities as they are.
- Keep the existing error codes. Never turn an error into an empty success, and
  never swallow one.
- Keep pure business rules testable without HTTP or database setup.
- Use the project's existing config and logging.

## Access

- The server decides who may do what, using the logged-in user and the record's
  scope. Hiding a button is not access control.
- Test refused and out-of-scope requests through the API, not just through the
  UI.
- `.agents/PROJECT.md` holds the project's roles and what each may do.

## Queries and lists

- In the database query, first limit to what the user may see, then filter and
  sort, then page. Never load everything and cut it in memory.
- Sort in a fixed order with a unique field last (like `id`), so ties don't
  jump between pages.
- Load related data in batches, not one query per row.
- Writes that must all succeed together go in a transaction.
- Counts and totals must never reveal records the user may not see.

## Migrations and scripts

- Schema changes go in a reviewed migration. Never auto-sync the schema in
  production. Writing a migration doesn't mean you may run it — ask first.
- Imports, resets and scripts must be safe to run twice, and safe to rerun
  after a crash halfway.

## Proving it works

A mocked unit test doesn't prove the real API works. Check it with a real
request against the running server, and save the response as evidence.
