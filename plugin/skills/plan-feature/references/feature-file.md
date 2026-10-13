# Feature file

The plan splits the product into features. Each is one file,
`docs/plans/<project>/features/<slug>.md`. The planner writes it and the user
approves it in full before anyone builds it. The lead writes its last three
sections from the agents' reports, and the verify skill drives it on the
merged app. Written
once, read three times: plan, build, prove.

## Contents

- The file: the template, with an example feature
- Rules: what the planner guarantees, and who writes during the build

## The file

```markdown
# <Feature name>

One paragraph: what a user can do when this is done.

- Done when: D4, D5, D9 (from plan.md; the scenarios below prove them)
- Screens: `orders`, `order-detail` (approved screens)
- Depends on: `auth-login` (needs a signed-in user)
- Order: 2
- Status: proposed (then approved · review · merged)

## Backend (owner: the backend agent)

- Owns: `src/server/orders/**`, `src/entities/order/api/order.functions.ts`,
  `src/features/cancel-order/api/**`, table `orders`
- Server functions: `listOrders` (read; staff and viewer;
  `{ page, size 1–100 }` → `{ rows: { id, customer, total, status,
  createdAt }[], total }`; sorted `createdAt desc, id`), `cancelOrder`
  (write; staff only; `{ orderId }` → the order with `status: "cancelled"`;
  `NotFoundError` for an order that isn't theirs; twice → the same result,
  one email)
- Schema: `orders.status` gains `cancelled`; existing rows unchanged
- Uses from the shared code: `requireUser`, `clock`, `mail`

## Frontend (owner: the frontend agent)

- Owns: `src/views/orders/**`, `src/views/order-detail/**`,
  `src/features/cancel-order/{ui,model}/**`, `src/entities/order/{ui,queries}*`
- Loads: `/orders` → the order list; the detail view → one order
- Actions: Cancel button → `cancelOrder`, confirm dialog, optimistic row
  status, error toast with the server message
- States: loading skeleton, empty ("No orders yet"), error, denied (viewer sees
  no Cancel button)
- Parts: table, dialog and button from the shared parts; `OrderRow`

## Scenarios

Each with an exact outcome and the done-when line it proves. Every item of
the misuse checklist is here or in N/A.

- D4: three orders today, one late → staff open /orders → three rows, the
  late one marked warning.
- D5: an open order → staff cancel and confirm → row shows "cancelled",
  `orders.status` is `cancelled`, one email queued to the customer.
- D5: the same cancel twice → second call answers the same cancelled order,
  no second email.
- D5: two staff cancel at once → one email, status `cancelled`.
- D9: a viewer → no Cancel button; calling `cancelOrder` → `ForbiddenError`,
  row unchanged.
- D9: an order of another company → `NotFoundError`, row unchanged, no email.
- Input: `orderId` missing, `null`, not a UUID, upper-case UUID → `InvalidInputError`,
  nothing changed (one `test.each`).
- Mail down → the order is still cancelled, the email is queued for retry,
  the user sees "cancelled".
- N/A — uploads: none. N/A — scheduled job: none.

## Tests

Each line names the agent that writes it.

- Unit (backend): `canCancel(order, user)` every branch.
- Unit (frontend): `formatOrderStatus`; the cancel form's validation.
- Repository (backend): `listOrders` visibility, sort ties at equal
  `createdAt`, page boundaries, `size` 0 / 101.
- Server function (backend): every scenario above, on a real database.
- E2E (frontend, `e2e/cancel-order.spec.ts`): staff cancels from the list
  and from the detail; viewer sees no button; desktop and phone.

## How to get to it (user POV)

Every way a user reaches it: menu, link, URL.

## Driving it

Preconditions, then each user action with its exact command and what you
should see. The verify skill runs it.

## Gotchas

Traps that waste or spoil a run.

## Trace

One line per phase: what ran, what it found, how long.
```

## Rules

- **The planner writes everything above Driving.** A change to it after
  approval is a plan change and says so.
- **The lead writes Driving, Gotchas and Trace** from the agents' reports,
  then sets `review`. No build agent edits this file: two agents in one
  working copy cannot commit one file safely.
- **One owner per file, server function and table.** Two features that need
  the same table or helper mean that thing belongs in the foundation, built
  before the first feature. An overlap is a planning error, not something
  agents sort out.
- **Backend and Frontend own different folders.** The two agents work in one
  checkout at the same time and never touch the same file. The contract
  between them is the input and output schemas and the server function
  signatures, written in the Backend section before either starts.
- **Depends on** is for a feature that calls another's server function or
  needs its data. It sets the order. Fewer dependencies, more freedom.
- **Scenarios come from done-when lines and the misuse checklist, not from
  the code.**
- **Exact outcomes.** A scenario names the state, the rows, the emails, the
  message. "Returns an error" is not an outcome. A negative outcome says what
  didn't happen.
- **Right size:** two agents finish it in one session with every test. Too
  big splits along a screen or a server function; too small merges into its
  neighbour.
- **The verify map is these files.** The verify skill reads Scenarios,
  Driving and Gotchas and drives every feature on the merged app. No second
  feature map exists.
