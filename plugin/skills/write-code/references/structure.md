# Where code goes

One TanStack Start app on Bun. The browser side follows Feature-Sliced Design
(FSD): layers under `src/`, each layer made of slices, each slice made of
segments. Server-only code lives in `src/server/`, by business area.

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
design/                   tokens.css, shadcn.css, promoted from the studio
e2e/                      Playwright journeys
```

## Layers

Folders from top to bottom. Code may import from layers below it, never from
above, and never from a sibling slice on the same layer:

```
routes → views → widgets → features → entities → shared
```

- `routes/`: a route file exports `Route` from `createFileRoute` with its
  loader and renders one view. No markup, no logic. A loader calls
  `queryClient.ensureQueryData` with the entity's query options.
- `views/<screen>/`: one screen. Lays out widgets and features. Private parts
  in `ui/`, screen state in `model/`.
- `widgets/<block>/`: a self-contained block two screens could show.
- `features/<action>/`: what a user does: `cancel-order`, `filter-orders`.
  `ui/` holds the form or button, `model/` the state and validation, `api/`
  the server function the action calls.
- `entities/<thing>/`: what the product is about: `order`, `customer`.
  `schema.ts` holds the zod shapes and `as const` unions both sides use,
  `api/<thing>.functions.ts` the reads, `<thing>.queries.ts` the TanStack
  Query options and hooks, `ui/` the thing's card, row or badge.
- `shared/`: `ui/` for shadcn parts and generic components, `lib/` for
  helpers with no business meaning, `config/` for constants.
- `server/<area>/`: the logic behind the server functions, one folder per
  business area (`orders/`, `customers/`), not one `services/` folder for
  everything. Start with `<area>.service.server.ts` and
  `<area>.repository.server.ts`; add files only when a folder gets crowded.
- `server/shared/`: `db/` (drizzle client, `schema.ts`, `migrations/`),
  `auth/`, `errors.server.ts`, `clock.server.ts`, `env.server.ts`.

Segments inside a slice are `ui/`, `model/`, `api/`, `lib/`. Create only the
ones the slice needs.

`features/a` never imports `features/b`. What two features share lives one
layer down, in an entity or in `shared/`.

## Server and browser

- `*.server.ts` is server-only: it may read the database, env and secrets. The
  build never bundles it to the browser.
- `*.functions.ts` holds `createServerFn` wrappers. Any layer may import one.
  **Only `*.functions.ts` files may import `server/**`**; the check refuses
  every other import of it.
- A wrapper holds no logic: middleware, `inputValidator(schema)`, one call into
  a `server/<area>` function. The logic sits in `server/` so `bun test` can
  call it without the framework ([backend.md](backend.md)).
- Server routes (a route file with `server.handlers`) are only for callers
  outside the app: a webhook, a mobile app, a partner. The UI never calls one.

## Import rules

- Between slices, import only through the slice's `index.ts`. Never reach into
  its inner files.
- Inside one slice, import files directly, not through its own `index.ts`
  (that creates import loops).
- A slice's public `index.ts` is intentional. Don't "fix" it away, and don't
  add one to a folder that has no outside callers.
- Keep a component's styles next to it. Group files by what they do, not by
  file type.

The check enforces the layer direction and the deep reaches. It cannot tell
you that a piece belongs one layer lower; that's the judgment call.

## Splitting a file

- Give a part of a screen its own component when a name makes it clearer, even
  if it's used once.
- Split a component that owns two or more distinct UI regions, even under 150
  lines. Keep the pieces next to it; no shared atom until a second caller wants
  it.
- Around 350 lines of real code (blank lines and comments don't count), ask
  whether the file does too much. The check fails at 450.
- When the check fails on a file you touched, split it by what each part does:
  one server function file per area, a view's sections into `ui/`, the
  algorithm into `model/` or `server/`. Keep behavior the same and run the
  tests.
- Don't split generated code, tests or data tables just to hit a number.

## Styling and data

- Use the design tokens (named values for colors, spacing, radius). Plain
  values like `0`, `auto` and `100%` don't need tokens.
- Load data through the entity's query options: in the route loader for the
  first paint, through the entity's hook in components. No `useEffect` fetch.
- Keep apart: parsing a server function's result, business calculations, and
  display.
- Don't add a fallback for a missing server function unless there's a real
  need.
- Checks must not quietly change files you didn't touch. Run `bun run check`,
  fix what it prints, and look over the diff.
