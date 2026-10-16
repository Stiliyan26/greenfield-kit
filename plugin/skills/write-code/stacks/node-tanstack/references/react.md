# React components and screens

Stack: React + TypeScript on TanStack Start: TanStack Router, Query, Table
and Form, zod, shadcn + Tailwind.
Where files go is in [structure.md](structure.md); how to write the TypeScript
is in [typescript.md](typescript.md).

These are guidelines, not laws. Skip one if it makes the code worse, and say
why.

## Hook and state block order

Relative order inside a component or hook, with a blank line between groups:

1. Context and session
2. Local state (`useState`, `useReducer`)
3. Router and ambient (`useNavigate`, `useParams`, `useLocation`)
4. Data and forms (`useQuery`, entity hooks, `useForm`)
5. Derived values
6. Handlers
7. `return`

```tsx
function LoginScreen() {
  const { login } = useSession();

  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const { register, handleSubmit } = useForm(/* … */);

  const onSubmit = (values: LoginFormValues) => { /* … */ };

  return (/* … */);
}
```

Skip the groups you don't use; keep the relative order.

## Blank lines between sibling JSX

A blank line between block-level sibling JSX elements, as between sibling
statements.

```tsx
return (
  <section>
    <p className="text-muted-foreground">{formatToday()}</p>

    <h1>Welcome back{firstName ? `, ${firstName}` : ""}.</h1>

    <OrderSummary orderId={orderId} />
  </section>
);
```

## Conditional rendering

Keep a conditional element **inline, where it sits** in the JSX, as
`cond ? <X /> : null`. Name the condition **before `return`** as a boolean
(`showX`, `canX`, `hasX`, `isX`) when it is a negation, a compound check, or a
raw field whose meaning isn't plain at that spot.

- **Ternary, not `&&`.** `{count && <X />}` renders a stray `0`;
  `{count ? <X /> : null}` never does.
- **Inline, not hoisted JSX.** Don't move the element itself into a variable
  above `return` (`const addButton = cond ? <li>…</li> : null`). The reader
  has to jump between two places, and in a list the render order is no longer
  visible.
- **Named, not raw.** One naming style per block: if one item uses
  `showEmpty`, the others do too. Avoid `!` in a JSX condition; name the
  positive intent instead (`canAddLines`, not `!order.isLocked`).
- **Early return only for whole-component switches** (loading, error, not
  found, empty page), not for one item among siblings.

```tsx
// ❌ raw, negated and named conditions mixed in one list
<ul>
  {order.isDraft ? <DraftBadge /> : null}

  {order.lines.map(…)}

  {showEmpty ? <li>…</li> : null}

  {!order.isLocked ? <li><Button>Add line</Button></li> : null}
</ul>

// ✅ named before return, inline where each item sits
const showDraftBadge = order.isDraft;
const showEmpty = order.lines.length === 0;
const canAddLines = !order.isLocked;

return (
  <ul>
    {showDraftBadge ? <DraftBadge /> : null}

    {order.lines.map(…)}

    {showEmpty ? <li>…</li> : null}

    {canAddLines ? <li><Button>Add line</Button></li> : null}
  </ul>
);
```

## Names in React

The general naming rules are in [typescript.md](typescript.md#names). On top
of them:

- **Hooks** start with `use` and name the thing and the action:
  `useAddOrderLines`, not `useAdd` or `useOrder`.
- **State and setter share the subject:** `[customerSelection,
  setCustomerSelection]`, not `[selection, setSelection]`. Booleans:
  `[isOpen, setIsOpen]`.
- **Props** of a domain component carry the subject (`removeTarget`,
  `otherCustomersCount`). `value` and `onChange` stay bare only on generic
  inputs. Boolean props read as a question (`isOpen`, `isCompact`).
- **Handlers:** `onX` for a prop the component receives, `handleX` or a verb
  phrase (`removeSingleLine`) for the local function. Never a bare `handle`.
- **Mutations:** `addLinesMutation`, not `addLines`, so it doesn't read as a
  function that adds.

## Thin hooks

A hook wires React to units of logic. It does not host the algorithm. It should
scan in seconds: state → data → derived → thin handlers → return. Filtering,
selection math, formatting and multi-branch actions go in `model/` or entity
helpers.

```ts
// ❌ fat hook — derive, branch and IO inline
const selected = visible.filter((r) => selectedIds.includes(r.id));
const runBulk = async (action) => { /* 30-line switch */ };

// ✅ thin hook — one call per concern
const { selectedReports, allVisibleSelected } = deriveSelection(selectedIds, visible);
const runBulk = async (action) => {
  const message = await performBulkAction(action, targets, profiles);
  if (message) setActionMessage(message);
};
```

Ask: reading only the hook body, do you see the screen's wiring, or an
implementation? If the latter, extract.

## Splitting a screen into components

Start from the screen and its data, the way react.dev's "Thinking in React"
does: *"Separate your UI into components, where each component matches one
piece of your data model."* Draw the tree before writing code.

1. **One piece of data, one component.** An order is an `OrderCard`, a
   customer is a `CustomerRow`, an invoice line is an `InvoiceLine`. If a
   thing has a name in the data, it has a component.
2. **A list and its item are two components.** `CustomerList` renders
   `CustomerRow` for each customer; `StepList` renders `Step`. React's own
   example: `ProductTable` → `ProductCategoryRow`, `ProductRow`.
3. **The same thing on two screens is one component.** An order on the
   dashboard and in "My orders" is one `OrderCard` with a `size` prop, not two
   drawings. Different looks of one thing are props (`status="overdue"`,
   `size="compact"`), typed as closed unions, not new components.
4. **Layout takes children.** The page shell, page header, section and card
   are components that take `children` (or named slots) and know nothing about
   the content: `<PageShell><PageHeader title actions />…</PageShell>`.
5. **Small shared pieces get a name when they repeat across parts:** a status
   tag, a date range, a money amount, a person's avatar and name. One
   component, used everywhere, so a change lands once.
6. **Routes and views wire, parts render.** The route file loads data in its
   loader; the view passes it down and holds no markup beyond the layout
   components.
7. **Stop at one job.** Split when a component owns two regions or its name
   needs "and". Don't wrap a single styled element that appears once and has
   no behavior; a class is enough.

For a greenfield design, the model's `components` list in `variant.json` is
this tree, and `check_components.mjs` fails on a structure drawn more than
once that no component covers.

## One job per component

Split large components. Move data fetching out of the component body into hooks
and entity APIs. Extract shared state into custom hooks.

```tsx
// ❌ fetch, filter and render in one component
export function Products() {
  const [products, setProducts] = useState([]);
  const [filterRate, setFilterRate] = useState(1);

  useEffect(() => {
    axios.get("/products").then((res) => setProducts(res.data));
  }, []);

  const filtered = products.filter((p) => p.rating.rate > filterRate);
  // …100 lines of filter UI and cards
}

// ✅ each concern owns a unit
export function Products() {
  const { products } = useProducts();
  const { filterRate, handleRating } = useRateFilter();

  return (
    <>
      <Filter filterRate={filterRate} handleRating={handleRating} />

      {filterProducts(products, filterRate).map((product) => (
        <Product key={product.id} product={product} />
      ))}
    </>
  );
}
```

## Extend by props, not by editing internals

```tsx
// ❌ every new case edits the button
{role === "forward" && <ArrowRight />}
{role === "back" && <ArrowLeft />}

// ✅ the caller supplies the icon
export function Button({ text, icon, ...rest }: ButtonProps) {
  return <button {...rest}>{text}{icon}</button>;
}
```

A wrapper around a native element still behaves like that element: extend and
forward its props when substitutability matters.

```tsx
interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function SearchBar({ value, onChange, ...rest }: SearchBarProps) {
  return (
    <div>
      <SearchIcon />
      <input type="search" value={value} onChange={onChange} {...rest} />
    </div>
  );
}
```

Pass the field, not the whole object: `<Thumbnail imageUrl={product.image} />`,
not `<Thumbnail product={product} />`.

Leaf UI depends on callbacks and injected APIs, never on a concrete URL or
storage call. A form calls `onSubmit(email, password)`; the parent or hook owns
the request. Entity `fetch*` functions and data hooks are the seam. No fixture
or mock arrays in feature code.

## Repeated siblings: config and map

```tsx
{rows.map((row) => (
  <ReadRow key={row.key} label={row.label} value={row.value} />
))}
```

Put the builder in `model/` when the screen already has `ui/` and `model/`.

## Closed unions for form selects

One `as const` array next to the entity type owns the list. Derive the type,
and reuse the same tuple in Zod and in the UI options. Don't re-list the values
in the schema or the option array.

```ts
export const STATUS_VALUES = ["draft", "active"] as const;
export type Status = (typeof STATUS_VALUES)[number];

status: z.enum(STATUS_VALUES);

export const statusOptions = STATUS_VALUES.map((value) => ({
  value,
  label: statusLabels[value], // Record<Status, string>
}));
```

## Routes, server calls, roles, icons

- A route file in `src/routes/` exports `Route` from `createFileRoute`, with
  a `loader` that calls `queryClient.ensureQueryData(orderQueries.list())`
  and a component that renders one view. Nothing else lives there.
- `<Link to="/orders/$orderId" params={{ orderId }}>` and
  `navigate({ to })` are typed by the router from the route tree, so a path
  typo fails `tsc`. No route constants.
- The browser never calls HTTP paths. A component or hook calls the entity's
  query hook (`useOrders()`), and a feature's action calls its server function
  through `useServerFn(cancelOrder)`. Both import a `*.functions.ts`; nothing
  else reaches the server.
- Read the current user through the one session hook in `entities/user`
  (`useSession()`, `useRole()`). Don't read `user.role` at call sites or
  invent a parallel helper. Compare with the `Role` enum and use the shared
  role helpers (`canManageOrders(role)`) instead of repeating
  `role === Role.Manager || role === Role.Admin`.
- Reusable icons come from the icon set the design names (`lucide-react` by
  default). A one-off decorative mark may stay inline.
- Basic shared components don't know about roles or permissions.

## Forms and data

- Server data goes through TanStack Query: query options in the entity's
  `<thing>.queries.ts`, read in the loader and in hooks. After a save,
  invalidate the queries it changed.
- Forms use TanStack Form with the entity's zod schema; the same schema
  validates on the server.
- Tables use TanStack Table; sorting, filters and paging go to the server
  function, never computed over a full list in the browser.
- Keep filters and the page number in the URL where the screen already does.
- A list that can grow gets a pager or "load more" in the UI, wired to the
  paged server function. Never fetch everything and `slice` in the browser.
- A change of search or filters resets to page 1 and sends the same terms to
  the server.
- Debounce typing before it reaches the network; dropdown filters fire at
  once. Pick the delay from the project's scale, and ask when you don't know
  it:

  | Delay | When |
  | --- | --- |
  | 100–150 ms | Filtering a small list already in memory (under about 100 items). Not for a server search |
  | 250–300 ms | The default: search-as-you-type against the server |
  | 400–500 ms | Heavy queries, very large result sets, or a slow network |

- A response check must match the real API. Don't hide broken data behind
  made-up defaults.
- Keep useful content on screen while it reloads. A double click must not send
  a form twice.
- Keep native keyboard behavior: real buttons with the right `type`, visible
  focus.

## Errors

- Expected, local failures: `try/catch` plus UI state, or the mutation's
  `onError`.
- Unexpected render failures: an error boundary around a meaningful subtree.
- Use the project's boundary library if it has one. Don't invent a new boundary
  on every ticket.

## Performance

Apply these to data hooks, lists, providers and heavy children. Skip them for
pure renames and moves.

- Run independent work in parallel (`Promise.all`, parallel Query hooks). No
  accidental waterfalls. Check cheap sync guards before awaiting.
- Entity reads go through Query hooks, not ad-hoc `useEffect` plus `useState`
  fetches in a screen.
- Derive values during render. Don't copy a value you can work out into state,
  and don't sync derived state with an effect.
- Never define a component inside a component — it breaks reconciliation. The
  check catches this one.
- Use the functional `setState` when the next value depends on the previous
  one. Lazy-init an expensive `useState`: `useState(() => compute())`.
- Interaction logic belongs in event handlers. Effects are for syncing with
  external systems.
- Don't sprinkle `useMemo` and `useCallback` by default. Reach for
  `startTransition` or `useDeferredValue` for non-urgent updates when the team
  already uses them.
- Prefer a ternary over `&&` when the left side can be `0`
  ([Conditional rendering](#conditional-rendering)).
- Hoist static JSX and default object props out of render when they cause
  needless child updates.
- Import heavy libraries directly rather than through a convenience barrel.
  Dynamically import genuinely heavy optional UI (export, PDF, large editors)
  when it isn't on the critical path.
- Version and keep small anything you persist to local or session storage.

## Pragmatism

- Ship a clear, slightly imperfect solution over a principle-pure rewrite that
  doesn't fit the screen.
- When reviewing: name the principle, show the bad and the good version, and
  say when bending the rule is right.
- Don't refactor for its own sake while you add a feature.

## Design

If the design isn't settled, use `design-interface`; for motion, use
`design-animations`. Don't invent a new look while coding. With an approved
`DESIGN.md`, use shadcn/ui for the parts its Components table marks `shadcn`,
themed only by `design/shadcn.css`, never shadcn's own theme.
