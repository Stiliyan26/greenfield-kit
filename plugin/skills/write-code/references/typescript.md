# Writing a TypeScript file

Habits that make a file read top to bottom. oxfmt handles spacing;
`bun run check` handles import order, nesting depth, file size and naming
([checks.md](checks.md)). This file is the part a tool can't judge, with the
shape each rule expects.

## Stepdown: helpers below the caller

The primary export first, its private helpers below it. Call order reads top
to bottom; details sink.

```ts
// ❌ helpers above
function mapUser(row: DbUser) { /* … */ }

export function findUser(id: string) {
  return mapUser(load(id));
}

// ✅ export first, helpers below
export function findUser(id: string) {
  return mapUser(load(id));
}

function mapUser(row: DbUser) { /* … */ }
```

Exception: a constant must be defined before it's used.

## Scannable first

Open a file: the exported function should reveal intent in a few seconds.

| Prefer | Avoid |
| --- | --- |
| Filter or derive **before** the main loop | Guards buried inside loops |
| Top of the unit is the happy path | Guard branches mixed through the body |
| `switch` or named pieces for variants | Long if/else trees of near-identical blocks |
| One job per function or class | Orchestration, branching and IO in one block |

```ts
// ❌ the filter is buried in the loop
for (const item of items) {
  if (!item.active) continue;
  results.push(format(item));
}

// ✅ derive first — the loop is pure work
const active = items.filter((item) => item.active);
for (const item of active) {
  results.push(format(item));
}
```

## Narrow parameters

A helper that reads one field takes that field, not the whole parent object.
Pass the full object only when several of its fields are actually used.

```ts
// ❌ takes the report, reads only report.employeeId
findProfile(report, profiles);

// ✅
findProfile(report.employeeId, profiles);
```

## Object literals hold end results only

When building an object literal, pass values that are already computed:
identifiers or plain property reads. Ternaries, template strings and function
calls go in named locals above it.

```ts
// ❌ work buried in the object
return {
  id: contact.id,
  label: contact.relationship ? labelFor(options, contact.relationship) : null,
  href: phone ? `tel:${phone.replace(/[^+\d]/g, "")}` : null,
  rows: detailRows(contact),
};

// ✅ derive first — the object is a flat assembly
const label = contact.relationship
  ? labelFor(options, contact.relationship)
  : null;
const href = phone ? `tel:${phone.replace(/[^+\d]/g, "")}` : null;
const rows = detailRows(contact);

return { id: contact.id, label, href, rows };
```

`contact.id` and `contact.isPrimary` are fine inline — they're already end
results.

## Flat control flow

| Limit | Rule |
| --- | --- |
| Ternaries | One `? :` per expression. Nested ternaries are refused by the check |
| Ternary layout | Condition, `?` branch and `:` branch each on their own line when the value is assigned or returned |
| `if` / `for` nesting | Depth 2 (`for` → `if` is fine, `for` → `if` → `if` is not) |

Flatten with an early return, an extracted helper or a lookup map.

```ts
// ❌ nested ternary
const label = status === "ok" ? "Ready" : status === "pending" ? "Wait" : "Fail";

// ❌ deeper than 2
for (const item of items) {
  if (item.active) {
    if (item.ready) results.push(item);
  }
}

// ✅ a map owns the branching
const label = STATUS_LABELS[status];

// ✅ early continue
for (const item of items) {
  if (!item.active || !item.ready) continue;
  results.push(item);
}
```

Return early instead of nesting. Work complex values out in named variables
before building an object.

## Repeat the shape? Use a config and iterate

```ts
// ❌
await mail.send(welcomeTemplate(user));
await mail.send(verifyTemplate(user));
await mail.send(digestTemplate(user));

// ✅
for (const template of templatesFor(user)) {
  await mail.send(template);
}
```

Three lines of repetition still beat an early abstraction. Reach for the config
when a fourth case arrives or the blocks must stay in sync.

## No magic strings

A literal that names a concept — route path, role, status, storage key, query
key, event name, error message — is defined once and referenced everywhere.

| Kind | Where it lives |
| --- | --- |
| UI route paths | TanStack Router's typed `to` (`/orders/$orderId`); the router checks them, so no constant is needed |
| Error codes, event names, metadata keys | `server/shared/errors.server.ts` or the area's `<area>.constants.ts` |
| Domain enums and option sets | The entity's `schema.ts`: `as const` plus a union, reused in zod |
| Query and mutation keys | Beside the hook that owns the cache |
| Storage keys | The module that owns the read and write |
| Seed and fixture IDs | A seed constants file, `as const` |

```ts
// ❌ inline status string, copied into zod and the UI
status: z.enum(["draft", "active"]);
if (order.status === "active") { /* … */ }

// ✅ one source
export const ORDER_STATUSES = ["draft", "active"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
status: z.enum(ORDER_STATUSES);

// ❌ inline role string
if (user.role === "admin") { /* … */ }

// ✅
if (user.role === UserRole.Admin) { /* … */ }
```

Test: if renaming it means grepping for a string, it should have been a
constant. A one-off literal that names nothing (a label, a delimiter) is fine
inline. Don't build a constants file that mirrors an enum you already have.

## Blank lines between siblings

A blank line between block-level sibling statements and members, so the
structure scans: methods in a class, sequential blocks in a function, sibling
JSX.

```ts
export async function createCustomer(input: CreateCustomerInput) {
  const customer = await customers.insert(input);

  await events.publish("customer.created", customer.id);

  return customer;
}

export function findCustomer(id: string) {
  return customers.findById(id);
}
```

Consecutive declarations: keep lines that **feed each other** together (a
derivation chain, or one value and its setter), and put a blank line between
**unrelated** ones. Each blank marks "a new idea starts here".

```ts
// ❌ four ideas in one wall
const skusInOrder = new Set(order.lines.map((line) => line.sku));
const productsNotInOrder = catalog.filter((product) => !skusInOrder.has(product.sku));
const customersGained = totalCustomers - segment.customerCount;
const isSaving = addLinesMutation.isPending || replaceLinesMutation.isPending;
const canSave = lineSelection.allProducts || selectedProducts.length > 0;

// ✅ grouped by relation
const skusInOrder = new Set(order.lines.map((line) => line.sku));
const productsNotInOrder = catalog.filter((product) => !skusInOrder.has(product.sku));

const customersGained = totalCustomers - segment.customerCount;

const isSaving = addLinesMutation.isPending || replaceLinesMutation.isPending;

const canSave = lineSelection.allProducts || selectedProducts.length > 0;
```

Tight clusters of tiny related lines are fine when a blank would hurt more than
help.

## Names

- Named exports. No default exports outside the files a framework requires.
- No `I` prefix on interfaces. Types and components are `PascalCase`, functions
  and variables `camelCase`, constants `SCREAMING_SNAKE_CASE`.

### Names say what and whose

Every declaration (variable, parameter, function, method, class, type, enum,
constant) says **what it is** and **what it is about**, without reading its
definition.

| Declaration | Form | ❌ | ✅ |
| --- | --- | --- | --- |
| Variable | subject noun | `data`, `result`, `listed` | `skusInOrder`, `overdueInvoices` |
| Boolean | `is` / `has` / `can` / `should` / `was` + condition | `pending`, `active`, `seenOpen` | `isSaving`, `hasSelectedCustomers`, `wasOpen` |
| Collection | plural of its element | `list`, `items`, `arr` | `customers`, `orderIds` |
| Set / Map | element + role or key | `map`, `lookup` | `skusInOrder`, `customerById` |
| Function / method | verb + the thing it acts on | `handle`, `process`, `doIt`, `run` | `cancelOrder`, `buildInvoiceRows`, `toOrderSummary` |
| Class / module | role noun with the subject | `Manager`, `Helper`, `Utils` | `OrdersRepository`, `InvoiceTotalsCalculator` |
| Type / interface | subject + role | `Data`, `Options`, `IUser` | `CreateOrderInput`, `OrderLine` |
| Enum or union | singular subject; members `PascalCase` | `Status` (of what?) | `OrderStatus.Shipped` |
| Constant | `SCREAMING_SNAKE` with the subject (and unit) | `DEFAULT`, `LIMIT`, `TIMEOUT` | `ORDER_LINES_MAX`, `LOGIN_ATTEMPTS_MAX`, `EXIT_MS` |
| Parameter or lambda argument | the element it is | `x`, `c`, `item`, `e` | `customer`, `invoice`, `event` |

- **Name the noun, not the state.** A bare participle or adjective (`listed`,
  `gaining`, `chosen`, `active`) is not a name. Say what: `skusInOrder`,
  `customersGained`, `selectedCustomers`.
- **No bare category words.** `data`, `items`, `value`, `result`, `state`,
  `info`, `config`, `options`, `selection`, `handler`, `manager`, `helper` and
  `utils` say nothing alone. Add the subject: `customerSelection`,
  `invoiceTotals`, `retryOptions`.
- **The verb is honest.** `get`, `find`, `read`, `fetch`, `build`, `to`,
  `parse` and `is` mean different things: `fetch*` is an async API call,
  `find*` a lookup, `read*` a sync local read, `parse*` raw to typed, `to*` a
  conversion, `build*` a new value from parts. `handle*` and `process*` hide
  what happens.
- **Say the container when two sources are in scope.** If `order.lines` and
  `catalog` both hold products, a derived value says which one:
  `catalogProductsNotInOrder`.
- **Units and formats go in the name** when the type doesn't carry them:
  `timeoutMs`, `priceCents`, `startDateIso`.
- **No abbreviations** except the ones the domain already uses (`id`, `url`,
  `api`). Single letters only for a tiny lambda or a loop index.
- **One concept, one word** across files: not `customer` here, `client` there
  and `buyer` elsewhere.

Test: read the line where the name is used, with the definition out of view.
If you can't say what it holds or does, rename it. A subject may be dropped
only when the file, class or type already makes it plain (`lines` inside
`OrderLines`, `findById` on `OrdersRepository`).

```ts
// ❌ of what? listed where? does what?
const listed = new Set(order.lines.map((l) => l.sku));
const gaining = totalCustomers - segment.customerCount;
const DEFAULT = 5;
async function handle(data: Data) { /* … */ }

// ✅ reads on its own at the call site
const skusInOrder = new Set(order.lines.map((line) => line.sku));
const customersGained = totalCustomers - segment.customerCount;
const LOGIN_ATTEMPTS_MAX = 5;
async function addLinesToOrder(input: AddOrderLinesInput) { /* … */ }
```

React-only names (state pairs, hooks, props, handlers, mutations) are in
[react.md](react.md#names-in-react).

### Names match behavior

A name, and its parameters and types, must describe what the body does
**now**. When behavior shrinks, rename it or remove the leftovers. After you
delete a flag or a branch, drop the type fields nobody uses and rename the
helpers that no longer match.

```ts
// ❌ says "all users", returns active ones
function findAllUsers() {
  return db.select().from(users).where(eq(users.active, true));
}

// ✅
function findActiveUsers() {
  return db.select().from(users).where(eq(users.active, true));
}
```

- A storage helper names its medium, so the call site doesn't have to open the
  body to learn where the data goes. Prefer `readTokenFromLocalStorage` /
  `writeTokenToLocalStorage` / `clearTokenFromLocalStorage` over bare
  `getToken` / `setToken`.

## Import order

Groups with a blank line between them, top to bottom:

1. Side-effect imports
2. Framework (React, `@tanstack/*`)
3. External packages
4. Internal layers, outer to inner (see [structure.md](structure.md))
5. Other relative parents (`../…`), then siblings (`./…`)
6. Assets and styles last (`.css`, `.scss`, `.svg`, images)

Don't hand-shuffle. `bun run check:fix` sorts them.

## Comments

No essay comments. Don't restate what the code already says. Prefer an
intention-revealing name over JSDoc on an obvious field. A comment earns its
place when it says *why*, not *what*.
