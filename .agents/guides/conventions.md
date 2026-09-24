# Code conventions

My defaults for React/TypeScript and NestJS projects. Files a framework needs in
a fixed place (like `main.ts`) stay there. If you break a rule, say why.

## Where frontend code goes

Folders from top to bottom. Code may import from folders to its right, never to
its left:

```
app  →  pages  →  features  →  entities  →  shared
```

- `app/`: app start-up, routes, providers, the page shell.
- `pages/`: thin route files that just render a feature.
- `features/<feature>/<screen>/`: one screen. Its private parts go in `ui/`; its
  state, validation and data shaping go in `model/` when needed.
- `entities/<thing>/`: one business thing (e.g. orders): its types, API calls,
  response checks and data-loading hooks.
- `shared/`: things with no business meaning. `ui/` for basic components
  (button, dialog), `lib/` for generic helpers, `api/` for the HTTP client.

Import rules:

- Between folders on the same level, import only through the folder's
  `index.ts`. Never reach into its inner files.
- Inside one folder, import files directly, not through its own `index.ts`
  (that creates import loops).
- If lower code needs something from `app/` (like the logged-in user), move that
  piece down into a lower folder. Don't import `app/` from below.
- Keep a component's styles next to it. Group files by what they do, not by
  file type.

## Where backend code goes

- One folder (Nest module) per business area, e.g. `orders/`. Not one big
  `controllers/` and `services/` folder for everything.
- Start with the module, controller and service, plus DTO and entity files as
  needed. Add `services/`, `dto/`, `entities/`, `model/` subfolders only when
  the folder gets crowded.
- `common/` for generic helpers, `config/` for settings, `database/` for
  migrations and seed data.
- Other areas use only a module's public parts. No import loops.
- One server app. Don't split it into separate services without a real reason.

## Frontend and backend together

- Make a shared package only for something both apps truly use (like request and
  response types) or pure logic with no framework code in it.
- The browser must never import server or database code.
- The server decides who may do what. Hiding a button is not access control.
- Before merging two date helpers, check they agree on: local time or UTC,
  timezone, date only or date and time, and what happens with bad input.

## Frontend code

- Server data goes through TanStack Query; after a save, refresh the data it
  changed. Forms use React Hook Form with Zod.
- Keep filters and page number in the URL where the screen already does.
- Don't copy values you can work out into state, or keep them in sync with an
  effect.
- A response check must match the real API. Don't hide broken data behind
  made-up defaults.
- Keep useful content on screen while it reloads. A double click must not send a
  form twice.
- Keep native keyboard behavior: real buttons with the right `type`, visible
  focus.
- Basic shared components don't know about roles or permissions.
- If the design isn't settled, use `design-interface`; for animation, use
  `design-animations`. Don't invent a new look while coding.

## Backend code

- Controllers stay thin: check the request, then call a service.
- Check input at the edge with DTOs. Choose what you send back; never return
  database entities as they are.
- Keep the existing error codes. Never turn an error into an empty success, or
  hide it.
- Check access on the server, using the logged-in user and the record's scope.
  Test refused and out-of-scope requests through the API, not just the UI.
- Lists: in the database query, first limit to what the user may see, then
  filter and sort, then page. See [pagination.md](pagination.md).
- Writes that must all succeed together go in a transaction. Load related data
  in batches, not one query per row.
- Imports, resets and scripts must be safe to run twice and to rerun after a
  crash halfway (like `import-employees` and the leave-year reset).
- Schema changes go in a reviewed migration; never auto-sync the schema in
  production. Writing a migration doesn't mean you may run it.
- Use the existing config and logging. Keep pure business rules testable without
  HTTP or database setup.
- A mocked unit test doesn't prove the real API works. Check it with a real
  request.

## Writing code

- Main function or component at the top of the file, its helpers below.
  Exception: a constant must be defined before it's used.
- Inside a hook, keep this order: context and state, router, data and forms,
  computed values, event handlers, return.
- Named exports. Clear verb names: `fetch`, `find`, `read`, `parse`. No `I`
  prefix on interfaces. Name storage helpers after the storage they use.
- No `as` casts unless the value was checked first. Check outside data (API
  responses, URL params, config) once, where it comes in.
- Model states as a union with a `kind` field, not a bundle of optional fields
  that allows impossible combinations.
- When a new case would grow an if/else chain or add a second flag that must
  stay in sync, use a table, map or state machine instead (like leave
  statuses).
- Fix a crash at its cause. No null check just to silence it.
- Return early instead of nesting. No nested `? :`. Work out complex values in
  named variables before building an object.
- Leave formatting and import order to the formatter and linter; don't fight
  them.

## Reuse and file size

- Reuse existing components and helpers straight away.
- Give a part of a screen its own component when a name makes it clearer, even
  if it's used once.
- When an API, helper or import path changes, update every caller and delete
  the old one in the same change. No re-export shims.
- Share a helper only when the uses really mean the same thing. Never merge
  different behaviors behind a true/false flag just because the code looks similar.
- Around 350 lines of real code (not counting blank lines and comments), check
  whether the file does too much.
- The hard limit is 450. `npm run check:architecture` enforces it, together with
  the import rules, before every commit and on every pull request. Files already
  over it are listed in `scripts/code/architecture-baseline.json` and may not grow.
- When the check fails on a file you touched, fix it in the same change: split
  the file by what each part does (e.g. one API file per area, a screen's
  sections into `ui/` components), or fix the import. Keep behavior the same and
  run the tests. Never add the file to the baseline to get past the check.
- When a fix makes a baseline file smaller or removes a problem, run
  `npm run check:architecture -- --tighten` and commit the updated baseline.
  Tighten only removes or lowers entries.
- Don't split generated code, tests or data tables just to hit a number.
- Group a folder when it holds many unrelated files. `npm run check:structure`
  is the exact rule; don't make up another number.

## Styling and data

- Use the existing design system and its tokens (named values for colors,
  spacing and sizes). Plain values like `0`, `auto` and `100%` don't need tokens.
- Follow the project's CSS naming and breakpoint helpers (see `project.md`).
- Load data only through the entity's API calls and hooks. Keep these apart:
  checking server responses, fallbacks for older APIs, business calculations,
  and display.
- Don't add a fallback for a missing endpoint unless there's a real need.
- Checks must not quietly change files. Fix the files you touched and look over
  the diff.
