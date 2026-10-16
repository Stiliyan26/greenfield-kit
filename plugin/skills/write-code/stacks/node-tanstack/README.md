# Stack: node-tanstack

TypeScript (strict) on Node.js 24 LTS with pnpm. Vite+ toolchain (Vite,
Vitest, Oxlint, Oxfmt). TanStack Start with TanStack Router, Query, Table and
Form. Zod. React with Tailwind CSS and shadcn/ui. PostgreSQL with Drizzle ORM.
Better Auth. Vitest and Playwright. knip for dead code. GitHub Actions for CI.
Docker compose for deploy.

Keep a file that the framework needs in a fixed place there
(`src/routes/`, `src/router.tsx`).

| File | Read it when |
| --- | --- |
| [references/structure.md](references/structure.md) | You choose a folder, split a file, or draw the line between server and browser code |
| [references/typescript.md](references/typescript.md) | You need constants as closed unions, or the import order |
| [references/react-components.md](references/react-components.md) | You write hooks, JSX, conditionals or names, or split a component |
| [references/react-screens.md](references/react-screens.md) | You split a screen, or wire routes, server calls, forms and errors |
| [references/backend.md](references/backend.md) | You write server functions, access checks, queries, migrations or sessions |
| [references/tests.md](references/tests.md) | You write unit, repository, server-function or e2e tests |
| [references/checks.md](references/checks.md) | You install or change `pnpm run check`, or add a rule to it |

1. **Install the checks** once for each project:

   ```
   python3 <skill-root>/stacks/node-tanstack/install_checks.py <project-root>
   ```

   Done when the script prints no error.

`pnpm run check` runs oxlint, oxfmt, `tsc --noEmit`, knip and a four-rule
ESLint config. `pnpm run check:fix` fixes what it can.
