# Tests

Run `pnpm vitest run` for unit, repository, server-function and concurrency
tests. Run Playwright in `e2e/` for journeys. Run the project's `verify-<app>` skill
for the merged app. Docker is required: repository and server-function tests
use a real Postgres through `@testcontainers/postgresql`. Use no in-memory
database and no mocked repository.

## Contents

- Layers
- What every feature must cover
- Exact outcomes
- Rules
- Where tests live

## Layers

| Layer | What runs | Carries |
| --- | --- | --- |
| Unit | one function, plain values | every function with a branch: validators, calculations, access rules, parsers, formatters |
| Repository | the repository on Docker Postgres | every query: filters, visibility, sort and ties, paging, constraints, upserts |
| Server function | the `server/` logic function, real Postgres, other services faked at their client | **every scenario** of the feature: normal, wrong input, someone else's record, the same call twice, two at once, a dependency down |
| Concurrency | two calls released together, final state asserted | every race the feature names |
| E2E | Playwright against the running app | every journey a user can take, happy and bad paths, at desktop and phone |
| Verify | the project's `verify-<app>` skill | each feature's journeys on the merged app, evidence saved |

## What every feature must cover

A feature is not done while one of its scenarios has no test. For
every server function, test:

- missing, `null`, empty and wrong-type input; unknown extra fields; limits at
  min−1, min, max, max+1; odd text (whitespace, line breaks, emoji, very long)
- an unknown id, a deleted one, one that belongs to someone else, a malformed one
- not signed in; signed in with the wrong role
- the same call twice; two calls at once
- the database or another service failing halfway: the exact outcome, and
  nothing half-written

Write all the bad values of one field as one scenario and one `test.each`.

## Exact outcomes

Assert what happened and what did not happen. "Throws" is not an outcome.

```ts
test("cancel: someone else's order → NotFoundError, row unchanged, no email", async () => {
  const order = await seedOrder({ ownerId: otherUser.id, status: "open" });

  await expect(cancelOrderForUser(user, { orderId: order.id })).rejects.toBeInstanceOf(NotFoundError);

  expect(await readOrder(order.id)).toMatchObject({ status: "open" });
  expect(mail.sent).toHaveLength(0);
});
```

Name the test with the scenario and the outcome. Arrange with seed helpers,
act through the `server/` function, and assert the state and the non-events.

## Rules

- Use no sleeps. Wait with `expect.poll` or Playwright's auto-waiting.
- Set the time through the clock in `server/shared/clock.server.ts`.
- Use fresh ids and `<uuid>@example.com` addresses in each test. Let no test
  depend on the data or order of another.
- Start one Postgres container for each test file in `beforeAll`. Truncate the
  tables in `beforeEach`.
- Fake another service only at its client (`server/shared/mail/`). Record its
  calls.
- Prove "nothing happened": the row is unchanged and the fake got no call.
- Never mock the thing that the test claims to test. Never write a test that
  passes when the function returns nothing. Never weaken a test to pass.
- Run the full suite green three times in a row before you call a feature done.
  Find the cause of a flaky run. Do not retry it.

## Where tests live

Put a test beside the code it tests: `orders.service.server.test.ts` beside
`orders.service.server.ts`. Put journeys in `e2e/<feature>.spec.ts`, one file
for each feature.
