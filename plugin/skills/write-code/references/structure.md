# Where code goes

## Frontend layers

Folders from top to bottom. Code may import from folders to its right, never to
its left:

```
app  →  pages  →  features  →  entities  →  shared
```

- `app/`: app start-up, routes, providers, the page shell.
- `pages/`: thin route files that just render a feature.
- `features/<feature>/<screen>/`: one screen. Its private parts go in `ui/`;
  its state, validation and data shaping go in `model/` when needed.
- `entities/<thing>/`: one business thing (e.g. orders): its types, API calls,
  response checks and data-loading hooks.
- `shared/`: things with no business meaning. `ui/` for basic components
  (button, dialog), `lib/` for generic helpers, `api/` for the HTTP client.

Import rules:

- Between folders on the same level, import only through the folder's
  `index.ts`. Never reach into its inner files.
- Inside one folder, import files directly, not through its own `index.ts`
  (that creates import loops).
- If lower code needs something from `app/` (like the logged-in user), move
  that piece down into a lower folder. Don't import `app/` from below.
- A feature or entity's public `index.ts` barrel is intentional. Don't "fix" it
  away. Don't add a barrel to a folder that has no outside callers.
- Keep a component's styles next to it. Group files by what they do, not by
  file type.

The ESLint preset checks the direction and the deep reaches. It cannot tell
you that a piece belongs one layer lower — that's the judgment call.

## Backend modules

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

- Make a shared package only for something both apps truly use (like request
  and response types) or pure logic with no framework code in it.
- The browser must never import server or database code.
- The server decides who may do what. Hiding a button is not access control.
- Before merging two date helpers, check they agree on: local time or UTC,
  timezone, date only or date and time, and what happens with bad input.

## Splitting a file

- Give a part of a screen its own component when a name makes it clearer, even
  if it's used once.
- Split a component that owns two or more distinct UI regions, even under 150
  lines. Keep the pieces next to it; no shared atom until a second caller wants
  it.
- Around 350 lines of real code (blank lines and comments don't count), ask
  whether the file does too much. The preset warns there and fails at 450.
- When the check fails on a file you touched, split it by what each part does:
  one API file per area, a screen's sections into `ui/` components, the
  algorithm into `model/`. Keep behavior the same and run the tests.
- Don't split generated code, tests or data tables just to hit a number.

## Styling and data

- Use the existing design system and its tokens (named values for colors,
  spacing and sizes). Plain values like `0`, `auto` and `100%` don't need
  tokens.
- Follow the project's CSS naming and breakpoint helpers. `.agents/PROJECT.md`
  says which convention the project uses.
- Load data only through the entity's API calls and hooks. Keep these apart:
  checking server responses, fallbacks for older APIs, business calculations,
  and display.
- Don't add a fallback for a missing endpoint unless there's a real need.
- Checks must not quietly change files. Fix the files you touched and look over
  the diff.
