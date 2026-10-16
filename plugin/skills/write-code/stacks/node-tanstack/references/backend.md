# Server code

Server code uses TanStack Start server functions, drizzle on Postgres and zod.
Files go as structure.md says. Tests follow tests.md.

## Contents

- Server functions
- Access
- Queries and lists
- Same call twice, two at once
- Schema and migrations
- Time, ids, config
- Imports, resets and scripts
- Proving it works

## Server functions

Write one server function for each read or action. Put reads in
`entities/<thing>/api/<thing>.functions.ts`. Put actions in
`features/<action>/api/<action>.functions.ts`. Keep the wrapper thin:

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

- Make the handler call one function from `server/<area>`. Put no branching,
  query or formatting in the wrapper. `pnpm vitest run` tests the `server/`
  function. Playwright proves the wrapper.
- Make the input a zod schema from the entity's `schema.ts`. Use `.strict()`
  to refuse unknown fields. Limit every string, number and list.
- Build the output on purpose, as a shape that the caller may see. Never return
  a drizzle row as it is, a password hash, a token or another user's data.
- Throw the project's typed errors from `server/shared/errors.server.ts`
  (`NotFoundError`, `ForbiddenError`, `ConflictError`, `InvalidInputError`).
  One middleware maps them to a response. Never swallow an error or turn it
  into an empty success.
- Keep pure business rules in functions that take plain values. Tests then
  need no database.

## Access

- Auth is Better Auth. Read its session once, in `server/shared/auth/`. The
  `requireUser` middleware puts the signed-in user on `context`. A function
  that needs a role reads it from there, through the one role helper in
  `server/shared/auth/`. Never read `user.role` at a call site.
- Let the server decide who may do what, from the user and the record's scope.
  Hiding a button is not access control.
- Write ownership as a `where` clause
  (`and(eq(orders.id, id), eq(orders.ownerId, user.id))`), not as a check after
  the load. Make a record that is not yours answer like one that does not
  exist, so an id cannot show what exists.
- Test refused and out-of-scope calls through the server function's logic (see
  tests.md).

## Queries and lists

- In the query, limit to what the user may see first. Then filter and sort.
  Then page. Never load everything and cut it in memory.
- Sort in a fixed order with a unique field last (`id`), so that ties do not
  jump between pages. Paging takes `size` 1–100. A value out of range is an
  `InvalidInputError`.
- Load related data in batches (`inArray`), not one query for each row.
- Put writes that must all succeed together in `db.transaction`.
- Never let counts and totals reveal records that the user may not see.
- Add an index only for a query that you can name, in its migration.

## Same call twice, two at once

Write down what happens. Then make it true:

- Make a double click or a retry end in the same state as one call. Use a
  unique constraint plus `onConflictDoNothing`, or a status check inside the
  transaction that returns the existing result.
- For two writers on one row, use `select … for update` inside the
  transaction, or an optimistic `version` column. The loser gets
  `ConflictError`.
- Treat a check followed by a separate write as a race. Put both in one
  statement or one transaction.

## Schema and migrations

- Keep the drizzle schema in `server/shared/db/schema.ts`. Split it per area
  and re-export it when it grows. `pnpm drizzle-kit generate` writes a
  migration. Read it before you commit it. Run `drizzle-kit push` only on a
  local database.
- Ask first before you run a migration on a real database. Writing it does not
  allow you to run it.
- Give a new non-null column a default or a backfill. Say what happens to
  existing rows and whether the migration can be reverted.
- Derive zod shapes from the schema with `drizzle-zod` where they match. Narrow
  them (lengths, enums) in the entity's `schema.ts`.

## Time, ids, config

- Read the time through `server/shared/clock.server.ts`, never `new Date()` in
  business code. Tests can then set the time.
- Generate ids on the server (UUID v7). A client never chooses an id.
- Let `server/shared/env.server.ts` parse `process.env` with zod once at
  startup. Make it refuse to start on a missing or invalid value, and name the
  value.
- Never log secrets, tokens, passwords, personal data or request bodies.

## Imports, resets and scripts

Make each one safe to run twice, and safe to rerun after a crash halfway.

## Proving it works

A mocked unit test proves nothing. Run every scenario of the feature
against the `server/` function with a real Postgres (see tests.md). Run the
journeys in a real browser.
