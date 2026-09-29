# Feature files

The plan splits the product into features. Each is one file,
`docs/plans/<project>/features/<slug>.md`, and one agent builds it. The same
file is what the `verify` skill drives at the end, so it is written once and
read three times: plan, build, prove.

## The file

```markdown
# <Feature name>

One paragraph: what a user can do when this is done.

- Requirements: R3, R7 (from plan.md)
- Done when: D4, D5, D9 (from plan.md; the scenarios below prove them)
- Screens: `orders`, `order-detail` (approved studio screens; routes in web/)
- Owns: `src/features/orders/**`, `src/entities/order/**`, endpoints `GET /orders`,
  `POST /orders/:id/cancel`, table `orders`
- Uses from shared: `formatMoney`, `DateRange`, `Order card` (see shared/INDEX.md)
- Depends on: `auth-login` (needs a signed-in user)
- Wave: 2
- Agent: full-stack, <model> · or FE + BE pair

## Scenarios

Written before any code. Each one names the done-when line it proves.

- D4: Given three orders today, one late → when staff open /orders → they see
  three rows and the late one marked warning.
- D5: Given an order → when staff cancel it and confirm → the row shows
  "cancelled", `orders.status` is `cancelled`, and the customer email was
  queued.
- D9: Given a viewer role → when they try to cancel → the button is absent and
  `POST /orders/:id/cancel` answers 403.

## How to get to it (user POV)

Every way a user reaches it: menu, link, URL.

## Driving it

Preconditions, then each user action with its exact command and what you
should see. Written by the feature agent when the feature is green; the
`verify` skill runs it.

## Gotchas

Traps that waste or spoil a run. Filled in as they are found.

## Status

proposed · ready · building · review · merged · proven

## Trace

One line per phase, appended by the agent that did it: what ran, what it
found, how long.
```

## Rules

- **One owner per file, endpoint and table.** Two features that need the
  same table or helper mean that thing belongs in `shared/` or the
  foundation, built before the fan-out. The planner checks this when writing
  the files; overlaps are a planning error, not something agents sort out.
- **Depends on** is for a feature that calls another's endpoint or needs its
  data. It sets the wave. Fewer dependencies, more parallel.
- **Scenarios come from done-when lines, not from the code.** A feature
  agent may add scenarios, never weaken one. Changing an agreed scenario is a
  plan change and says so.
- **Right size:** an agent finishes it in one session with tests. Too big
  splits along a screen or an endpoint; too small merges into its neighbour.
  The user accepts the split at fan-out setup.
- **The verify map is these files.** `verify` reads the Scenarios, Driving
  and Gotchas sections and drives every feature on the merged app. No second
  feature map exists.
