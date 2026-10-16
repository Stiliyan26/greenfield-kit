# React screens

How to split a screen, wire it to routes and server calls, and keep it fast.
react-components.md holds the component rules.

## Contents

- Splitting a screen into components
- Routes, server calls, roles, icons
- Forms and data
- Errors
- Performance
- Pragmatism
- Design

## Splitting a screen into components

Start from the screen and its data, as react.dev's "Thinking in React" does:
*"Separate your UI into components, where each component matches one piece of
your data model."* Draw the tree before you write code.

1. **One piece of data, one component.** An order is an `OrderCard`, a customer
   is a `CustomerRow`, an invoice line is an `InvoiceLine`. A thing that has a
   name in the data has a component.
2. **A list and its item are two components.** `CustomerList` renders
   `CustomerRow` for each customer. `StepList` renders `Step`.
3. **The same thing on two screens is one component.** An order on the
   dashboard and in "My orders" is one `OrderCard` with a `size` prop, not two
   drawings. Make different looks of one thing props (`status="overdue"`,
   `size="compact"`), typed as closed unions, not new components.
4. **Layout takes children.** Make the page shell, page header, section and
   card components that take `children` (or named slots) and know nothing about
   the content: `<PageShell><PageHeader title actions />…</PageShell>`.
5. **Name a small shared piece when it repeats:** a status tag, a date range, a
   money amount, a person's avatar and name. Use one component, so that a
   change lands once.
6. **Routes and views wire, parts render.** The route file loads data in its
   loader. The view passes it down and holds no markup beyond the layout
   components.
7. **Stop at one job.** Split when a component owns two regions or its name
   needs "and". Do not wrap a single styled element that appears once and has
   no behavior. A class is enough.

## Routes, server calls, roles, icons

- Make a route file in `src/routes/` export `Route` from `createFileRoute`,
  with a `loader` that calls `queryClient.ensureQueryData(orderQueries.list())`
  and a component that renders one view. Put nothing else there.
- Use `<Link to="/orders/$orderId" params={{ orderId }}>` and `navigate({ to })`.
  The router types them from the route tree, so a path typo fails `tsc`. Add no
  route constants.
- Never call an HTTP path from the browser. A component or hook calls the
  entity's query hook (`useOrders()`). A feature's action calls its server
  function through `useServerFn(cancelOrder)`. Both import a `*.functions.ts`.
  Nothing else reaches the server.
- Read the current user through the one session hook in `entities/user`
  (`useSession()`, `useRole()`). Never read `user.role` at a call site or add a
  parallel helper. Compare with the `Role` enum. Use the shared role helpers
  (`canManageOrders(role)`) instead of repeating
  `role === Role.Manager || role === Role.Admin`.
- Take reusable icons from the icon set that the design names (`lucide-react`
  by default). A one-off decorative mark may stay inline.
- Keep basic shared components free of roles.

## Forms and data

- Send server data through TanStack Query: query options in the entity's
  `<thing>.queries.ts`, read in the loader and in hooks. After a save,
  invalidate the queries that it changed.
- Use TanStack Form with the entity's zod schema. The same schema validates on
  the server.
- Use TanStack Table. Send sorting, filters and paging to the server function.
  Never compute them over a full list in the browser.
- Keep filters and the page number in the URL where the screen already does.
- Give a list that can grow a pager or "load more", wired to the paged server
  function. Never fetch everything and `slice` in the browser.
- Reset to page 1 when search or filters change, and send the same terms to the
  server.
- Debounce typing before it reaches the network. Fire dropdown filters at once.
  Pick the delay from the project's scale. Ask when you do not know it:

  | Delay | When |
  | --- | --- |
  | 100–150 ms | Filtering a small list already in memory (under about 100 items). Not for a server search |
  | 250–300 ms | The default: search-as-you-type against the server |
  | 400–500 ms | Heavy queries, very large result sets, or a slow network |

- Make a response check match the real API. Never hide broken data behind
  made-up defaults.
- Keep content on screen while it reloads. Never let a double click send a form
  twice.
- Keep native keyboard behavior: real buttons with the right `type`, visible
  focus.

## Errors

- For an expected, local failure, use `try/catch` plus UI state, or the
  mutation's `onError`.
- For an unexpected render failure, use an error boundary around a meaningful
  subtree.
- Use the project's boundary library if it has one. Do not add a new boundary
  for each ticket.

## Performance

Apply these rules to data hooks, lists, providers and heavy children. Skip them
for renames and moves.

- Run independent work in parallel (`Promise.all`, parallel Query hooks). Check
  cheap sync guards before you await.
- Read entities through Query hooks, not through `useEffect` plus `useState`
  fetches in a screen.
- Derive values during render. Never copy a derivable value into state. Never
  sync derived state with an effect.
- Use the functional `setState` when the next value depends on the previous
  one. Lazy-init an expensive `useState`: `useState(() => compute())`.
- Put interaction logic in event handlers. Use effects only to sync with
  external systems.
- Do not add `useMemo` and `useCallback` by default. Use `startTransition` or
  `useDeferredValue` for non-urgent updates when the team already uses them.
- Hoist static JSX and default object props out of render when they cause
  needless child updates.
- Import heavy libraries directly, not through a barrel. Dynamically import
  heavy optional UI (export, PDF, large editors) that is off the critical path.
- Version anything that you persist to local or session storage, and keep it
  small.

## Pragmatism

- Ship a clear, slightly imperfect solution, not a principle-pure rewrite that
  does not fit the screen.
- In a review, name the principle, show the bad and the good version, and say
  when bending the rule is right.
- Do not refactor for its own sake while you add a feature.

## Design

With an approved `DESIGN.md`, use shadcn/ui for the parts that its Components table gives to shadcn/ui. Theme them only with `design/shadcn.css`, never with shadcn's own theme.
