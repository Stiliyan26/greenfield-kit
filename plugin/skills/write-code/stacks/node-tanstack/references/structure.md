# Where code goes

One TanStack Start app on Node 24 with pnpm. The browser side follows
Feature-Sliced Design (FSD): layers under `src/`, slices in each layer,
segments in each slice. Server-only code lives in `src/server/`, by business
area.

```
src/
  routes/                 TanStack file routes: __root.tsx, orders/index.tsx, orders/$orderId.tsx
  views/<screen>/         one screen; composes widgets and features
  widgets/<block>/        a big reusable block: the orders table with filters, the app sidebar
  features/<action>/      one user action: ui/, model/, api/<action>.functions.ts
  entities/<thing>/       one business thing: schema.ts, types, api/<thing>.functions.ts, hooks, ui/
  shared/                 no business meaning: ui/ (shadcn add lands here), lib/, config/
  server/<area>/          server-only: <area>.service.server.ts, <area>.repository.server.ts, tests
  server/shared/          db client and drizzle schema, auth, errors, clock, env
design/                   tokens.css, shadcn.css, screens/ (the pack) from the studio
e2e/                      Playwright journeys
```

## Contents

- Layers
- Server and browser
- Import rules
- Splitting a file
- Styling and data

## Layers

The layers run from top to bottom. Import from a lower layer only. Never import
from a higher layer or from a sibling slice on the same layer.

```
routes → views → widgets → features → entities → shared
```

- `routes/`: a route file exports `Route` from `createFileRoute` with its
  loader, and renders one view. No markup, no logic. The loader calls
  `queryClient.ensureQueryData` with the entity's query options.
- `views/<screen>/`: one screen. It lays out widgets and features. Private
  parts go in `ui/`, screen state in `model/`.
- `widgets/<block>/`: a self-contained block that two screens could show.
- `features/<action>/`: what a user does, such as `cancel-order` or
  `filter-orders`. `ui/` holds the form or button, `model/` the state and
  validation, `api/` the server function that the action calls.
- `entities/<thing>/`: what the product is about, such as `order` or
  `customer`. `schema.ts` holds the zod shapes and the `as const` unions that
  both sides use. `api/<thing>.functions.ts` holds the reads.
  `<thing>.queries.ts` holds the TanStack Query options and hooks. `ui/` holds
  the thing's card, row or badge.
- `shared/`: `ui/` for shadcn parts and generic components, `lib/` for plain
  helpers, `config/` for constants.
- `server/<area>/`: the logic behind the server functions. Use one folder for
  each business area (`orders/`, `customers/`), not one `services/` folder for
  all. Start with `<area>.service.server.ts` and `<area>.repository.server.ts`.
  Add files only when a folder gets crowded.
- `server/shared/`: `db/` (drizzle client, `schema.ts`, `migrations/`), `auth/`,
  `errors.server.ts`, `clock.server.ts`, `env.server.ts`.

Segments in a slice are `ui/`, `model/`, `api/` and `lib/`. Create only the
ones that the slice needs.

Never import `features/b` from `features/a`. Put what two features share one
layer down, in an entity or in `shared/`.

## Server and browser

- `*.server.ts` is server-only. It may read the database, env and secrets. The
  build never bundles it to the browser.
- `*.functions.ts` holds `createServerFn` wrappers. Any layer may import one.
  **Only `*.functions.ts` files may import `server/**`.** The check refuses
  every other import of it.
- A wrapper holds no logic: middleware, `inputValidator(schema)` and one call
  into a `server/<area>` function. Keep the logic in `server/`, so that
  `pnpm vitest run` can call it without the framework (see backend.md).
- Use a server route (a route file with `server.handlers`) only for a caller
  outside the app: a webhook, a mobile app or a partner. The UI never calls one.

## Import rules

- Between slices, import only through the slice's `index.ts`.
- Inside one slice, import files directly, not through its own `index.ts`. That
  creates import loops.
- Keep a slice's public `index.ts`. Add none to a folder without outside
  callers.
- Keep a component's styles next to it. Group files by job, not by type.

The check enforces the layer direction and the deep reaches. It cannot tell
that a piece belongs one layer lower. That is your judgment.

## Splitting a file

- Give a part of a screen its own component when a name makes it clearer, even
  if it is used once.
- Split a component that owns two or more distinct UI regions, even under 150
  lines. Keep the pieces next to it. Share one only when a second caller
  wants it.
- At about 350 lines of real code (blank lines and comments do not count), ask
  whether the file does too much. The check fails at 450.
- When the check fails on a file you touched, split it by what each part does:
  a view's sections into `ui/`, the algorithm into `model/` or `server/`. Keep
  the behavior and run the tests.
- Do not split generated code, tests or data tables to meet a number.

## Styling and data

- Use the design tokens (colors, spacing, radius). Plain values such as `0`,
  `auto` and `100%` need no token.
- Load data through the entity's query options: in the route loader for the
  first paint, and through the entity's hook in components. Use no `useEffect`
  fetch.
- Keep apart: parsing a server function's result, business calculations, and
  display.
- Add no fallback for a missing server function without a real need.
- Run `pnpm run check`, fix what it prints, and read the diff. A check must not
  change files that you did not touch.
