# React components

Stack: React and TypeScript on TanStack Start. structure.md says where files
go. clean-code.md says how to write the code.

These are guidelines. Break one when it makes the code worse, and say why.

## Contents

- Hook and state block order
- Blank lines between sibling JSX
- Conditional rendering
- Names in React
- Thin hooks
- One job per component
- Extend by props, not by editing internals
- Repeated siblings: config and map
- Closed unions for form selects

## Hook and state block order

Order the groups in a component or hook as below. Put a blank line between
groups.

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

Skip unused groups. Keep the order.

## Blank lines between sibling JSX

Put a blank line between block-level sibling JSX elements, as between sibling
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
raw field whose meaning is not plain at that spot.

- **Use a ternary, not `&&`.** `{count && <X />}` renders a stray `0`.
  `{count ? <X /> : null}` never does.
- **Keep JSX inline, not hoisted.** Do not move the element into a variable
  above `return` (`const addButton = cond ? <li>…</li> : null`). The reader
  must jump between two places, and the render order is hidden.
- **Name the condition.** Use one naming style in a block: if one item uses
  `showEmpty`, the others do too. Avoid `!` in a JSX condition. Name the
  positive intent (`canAddLines`, not `!order.isLocked`).
- **Return early only for a whole-component switch** (loading, error, not
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

These rules add to the naming rules in clean-code.md ("Names").

- **Hooks** start with `use` and name the thing and the action:
  `useAddOrderLines`, not `useAdd` or `useOrder`.
- **State and setter share the subject:** `[customerSelection,
  setCustomerSelection]`, not `[selection, setSelection]`. Booleans:
  `[isOpen, setIsOpen]`.
- **Props** of a domain component carry the subject (`removeTarget`,
  `otherCustomersCount`). Keep `value` and `onChange` bare only on generic
  inputs. A boolean prop reads as a question (`isOpen`, `isCompact`).
- **Handlers:** `onX` for a prop that the component receives. `handleX` or a
  verb phrase (`removeSingleLine`) for the local function. Never a bare
  `handle`.
- **Mutations:** `addLinesMutation`, not `addLines`, so that it does not read
  as a function that adds.

## Thin hooks

A hook wires React to units of logic. It does not host the algorithm. Make it
scan in seconds: state → data → derived → thin handlers → return. Put
filtering, selection math, formatting and multi-branch actions in `model/` or
in entity helpers.

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

Test: read only the hook body. If you see an implementation and not the
screen's wiring, extract it.

## One job per component

Split large components. Move data fetching out of the component body into hooks
and entity APIs. Move shared state into custom hooks.

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

Make a wrapper around a native element behave like that element. Extend and
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

Make leaf UI depend on callbacks and injected APIs, never on a concrete URL or
storage call. A form calls `onSubmit(email, password)`. The parent or hook owns
the request. Put no fixture or mock arrays in feature code.

## Repeated siblings: config and map

```tsx
{rows.map((row) => (
  <ReadRow key={row.key} label={row.label} value={row.value} />
))}
```

Put the builder in `model/` when the screen already has `ui/` and `model/`.

## Closed unions for form selects

Let one `as const` array next to the entity type own the list. Derive the type
from it. Reuse the same tuple in Zod and in the UI options. Do not list the
values again in the schema or the option array.

```ts
export const STATUS_VALUES = ["draft", "active"] as const;
export type Status = (typeof STATUS_VALUES)[number];

status: z.enum(STATUS_VALUES);

export const statusOptions = STATUS_VALUES.map((value) => ({
  value,
  label: statusLabels[value], // Record<Status, string>
}));
```
