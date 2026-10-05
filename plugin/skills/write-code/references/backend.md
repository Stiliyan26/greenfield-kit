# Server code

TanStack Start server functions, drizzle on Postgres, zod. Where files go is in
[structure.md](structure.md); how to write the TypeScript is in
[typescript.md](typescript.md); what to test is in [tests.md](tests.md).

## Server functions

One server function per read or action. Reads live in
`entities/<thing>/api/<thing>.functions.ts`, actions in
`features/<action>/api/<action>.functions.ts`. The wrapper is thin:

```ts
// features/cancel-order/api/cancel-order.functions.ts
import { createServerFn } from "@tanstack/react-start";

import { CancelOrderInput } from "@/entities/order";
import { requireUser } from "@/server/shared/auth/require-user.server";
import { cancelOrderForUser } from "@/server/orders/orders.service.server";

export const cancelOrder = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .inputValidator(CancelOrderInput)
  .handler(({ data, context }) => cancelOrderForUser(context.user, data));
```

- The handler calls one function from `server/<area>`. No branching, no
  queries, no formatting in the wrapper. `bun test` tests the `server/`
  function directly; Playwright proves the wrapper through the browser.
- Input is a zod schema from the entity's `schema.ts`, `.strict()` so unknown
  fields are refused, with a limit on every string, number and list.
- Output is a shape the caller may see, built on purpose. Never return a
  drizzle row as it is; never a password hash, token, or another user's data.
- Errors are the project's typed errors from `server/shared/errors.server.ts`
  (`NotFoundError`, `ForbiddenError`, `ConflictError`, `InvalidInputError`).
  Throw them; one middleware maps them to a response. Never turn an error into
  an empty success, and never swallow one.
- Keep pure business rules in functions that take plain values, so a test
  needs no database to reach them.

## Access

- `requireUser` middleware puts the signed-in user on `context`. A function
  that needs a role reads it there, through the one role helper in
  `server/shared/auth/`. Don't read `user.role` at call sites.
- The server decides who may do what, using the user and the record's scope.
  Hiding a button is not access control.
- Ownership is a `where` clause (`and(eq(orders.id, id), eq(orders.ownerId, user.id))`),
  not a check after loading. A record that isn't yours answers like one that
  doesn't exist, so an id can't be used to learn what exists.
- Test refused and out-of-scope calls through the server function's logic,
  not only through the UI ([tests.md](tests.md)).

## Queries and lists

- In the query, first limit to what the user may see, then filter and sort,
  then page. Never load everything and cut it in memory.
- Sort in a fixed order with a unique field last (`id`), so ties don't jump
  between pages. Paging takes `size` 1–100; out of range is `InvalidInputError`.
- Load related data in batches (`inArray`), not one query per row.
- Writes that must all succeed together go in `db.transaction`. Nothing
  half-written survives a failure.
- Counts and totals must never reveal records the user may not see.
- Add an index only for a query you can name, in the same migration.

## Same call twice, two at once

Say in the feature file what happens, then make it true:

- A double click or a client retry ends in the same state as one call: a
  unique constraint plus `onConflictDoNothing`, or a status check inside the
  transaction that returns the existing result.
- Two writers on one row: `select … for update` inside the transaction, or an
  optimistic `version` column; the loser gets `ConflictError`.
- A check followed by a separate write is a race. Put both in one statement
  or one transaction.

## Schema and migrations

- The drizzle schema lives in `server/shared/db/schema.ts` (split per area and
  re-exported when it grows). `bunx drizzle-kit generate` writes a migration;
  read it before you commit it. Never `drizzle-kit push` against anything but
  a local database.
- Running a migration on a real database: ask first. Writing it doesn't mean
  you may run it.
- A new non-null column gets a default or a backfill. Say what happens to
  existing rows, and whether the migration can be reverted.
- Derive zod shapes from the schema with `drizzle-zod` where they match; the
  entity's `schema.ts` narrows them (lengths, enums) for input.

## Time, ids, config

- Read the time through `server/shared/clock.server.ts`, never `new Date()`
  in business code, so tests can set it.
- Ids are generated server-side (UUID v7). A client never chooses an id.
- `server/shared/env.server.ts` parses `process.env` with zod once at startup
  and refuses to start on a missing or invalid value, naming it.
- Never log secrets, tokens, passwords, personal data or request bodies.

## Imports, resets and scripts

Must be safe to run twice, and safe to rerun after a crash halfway.

## Proving it works

A mocked unit test doesn't prove the function works. Every scenario in the
feature file runs against the `server/` function with a real Postgres
([tests.md](tests.md)), and the journeys run in a real browser.
