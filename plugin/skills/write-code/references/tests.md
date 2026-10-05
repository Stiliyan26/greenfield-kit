# Tests

`bun test` for unit, repository, server-function and concurrency tests;
Playwright in `e2e/` for journeys; the project's `verify-<app>` skill for the
merged app. Docker is required: repository and server-function tests run on a
real Postgres through `@testcontainers/postgresql`. No in-memory database, no
mocked repository.

## Layers

| Layer | What runs | Carries |
| --- | --- | --- |
| Unit | one function, plain values | every function with a branch: validators, calculations, access rules, parsers, formatters |
| Repository | the repository on Docker Postgres | every query: filters, visibility, sort and ties, paging, constraints, upserts |
| Server function | the `server/` logic function, real Postgres, other services faked at their client | **every scenario** of the feature file: normal, wrong input, someone else's record, the same call twice, two at once, a dependency down |
| Concurrency | two calls released together, final state asserted | every race the feature file names |
| E2E | Playwright against the running app | every journey a user can take, happy and bad paths, at desktop and phone |
| Verify | the `verify-<app>` skill | each feature's Driving section on the merged app, evidence saved |

## What every feature must cover

The feature file lists the scenarios; the tests make each one true. A feature
is not done while one scenario has no test. For every server function:

- missing, `null`, empty and wrong-type input; unknown extra fields; limits at
  min−1, min, max, max+1; odd text (whitespace, line breaks, emoji, very long)
- an unknown id, a deleted one, one that belongs to someone else, a malformed one
- not signed in; signed in with the wrong role
- the same call twice; two calls at once
- the database or another service failing halfway: the exact outcome, and
  nothing half-written

`plan-feature` writes these from its misuse checklist with an exact outcome
each. All the bad values of one field are one scenario and one
`test.each`, not one test each.

## Exact outcomes

A test asserts what happened and what didn't. "Throws" is not an outcome.

```ts
test("cancel: someone else's order → NotFoundError, row unchanged, no email", async () => {
  const order = await seedOrder({ ownerId: otherUser.id, status: "open" });

  await expect(cancelOrderForUser(user, { orderId: order.id })).rejects.toBeInstanceOf(NotFoundError);

  expect(await readOrder(order.id)).toMatchObject({ status: "open" });
  expect(mail.sent).toHaveLength(0);
});
```

The name says the scenario and the outcome. Arrange through seed helpers,
act through the `server/` function, assert the state and the non-events.

## Rules

- No sleeps. Wait with `expect.poll` or Playwright's auto-waiting and an
  explicit timeout.
- Time comes from the clock in `server/shared/clock.server.ts`; tests set it.
- Fresh ids and `<uuid>@example.com` addresses per test. No test depends on
  another's data or order.
- One Postgres container per test file, started in `beforeAll`; tables
  truncated in `beforeEach`.
- Fake another service only at its client (`server/shared/mail/`), and record
  what it was asked to send.
- "Nothing happened" is proven: the row is unchanged, the fake got no call,
  the count is the same.
- A test must not mock the thing it claims to test, must not pass when the
  function returns nothing, and is never weakened to make a build pass.
- The full suite runs green three times in a row before a feature is done.
  One flaky run is a bug to find, not a retry.

## Where tests live

Next to the code they test: `orders.service.server.test.ts` beside
`orders.service.server.ts`; `cancel-order.model.test.ts` beside the model.
Journeys in `e2e/<feature>.spec.ts`, one file per feature file.
