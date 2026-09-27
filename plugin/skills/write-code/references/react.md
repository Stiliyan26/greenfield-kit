# React components and screens

Stack: React + TypeScript, a router, TanStack Query, React Hook Form with Zod.
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
6. **Pages wire, parts render.** A page component loads data and passes it
   down; it holds no markup beyond the layout components.
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

## Routes, API paths, roles, icons

- `<Route path>`, `navigate()`, `<Link to>` use the route constants from
  `app/routes` — never a hardcoded path. A new route goes into the matching
  domain file first, gets re-exported, then is used.
- HTTP calls use the path constants from `shared/api`, and only from an
  entity's `api.ts` — not from a component or a hook.
- Don't mix the two. UI routes and API paths are different lists.
- Read the current user's role through the project's one role helper from
  `app/auth`. Don't read `user.role` at call sites or invent a parallel helper.
- Reusable icons are `.svg` files: `features/<feature>/icons/` for a feature,
  `app/layout/icons/` for chrome. A one-off decorative mark may stay inline.
- Basic shared components don't know about roles or permissions.

The preset refuses inline `/api/…` strings in components and hooks.

## Forms and data

- Server data goes through TanStack Query. After a save, refresh the data it
  changed.
- Forms use React Hook Form with Zod.
- Keep filters and the page number in the URL where the screen already does.
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
  preset catches this one.
- Use the functional `setState` when the next value depends on the previous
  one. Lazy-init an expensive `useState`: `useState(() => compute())`.
- Interaction logic belongs in event handlers. Effects are for syncing with
  external systems.
- Don't sprinkle `useMemo` and `useCallback` by default. Reach for
  `startTransition` or `useDeferredValue` for non-urgent updates when the team
  already uses them.
- Prefer a ternary over `&&` when the left side can be `0`.
- Import heavy libraries directly rather than through a convenience barrel.
  Dynamically import genuinely heavy optional UI (export, PDF, large editors)
  when it isn't on the critical path.
- Version and keep small anything you persist to local or session storage.

## Design

If the design isn't settled, use `design-interface`; for motion, use
`design-animations`. Don't invent a new look while coding. With an approved
`DESIGN.md`, use shadcn/ui for the parts its Components table marks `shadcn`,
themed only by `design/shadcn.css`, never shadcn's own theme.
