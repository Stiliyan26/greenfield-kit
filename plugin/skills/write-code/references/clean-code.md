# Clean code

Use these habits to make a file read from top to bottom, in any language. The
examples are TypeScript. The rules are not. The formatter handles spacing. The
check command handles import order, nesting depth, file size and casing. This
file holds what a tool cannot judge.

## Contents

- Stepdown: helpers below the caller
- Scannable first
- Narrow parameters
- Object literals hold end results only
- Flat control flow
- Repeat the shape? Use a config and iterate
- Blank lines between siblings
- Names
- Comments

## Stepdown: helpers below the caller

Put the primary export first and its private helpers below it. The call order
then reads from top to bottom.

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

Exception: define a constant before you use it.

## Scannable first

Make the exported function show its intent in a few seconds.

| Prefer | Avoid |
| --- | --- |
| Filter or derive **before** the main loop | Guards buried inside loops |
| Happy path at the top of the unit | Guard branches mixed through the body |
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

Give a helper the one field it reads, not the parent object. Pass the full
object only when the helper uses several of its fields.

```ts
// ❌ takes the report, reads only report.employeeId
findProfile(report, profiles);

// ✅
findProfile(report.employeeId, profiles);
```

## Object literals hold end results only

Put only computed values in an object literal: identifiers or plain property
reads. Put ternaries, template strings and function calls in named locals above
it.

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

`contact.id` and `contact.isPrimary` are fine inline. They are already end
results.

## Flat control flow

| Limit | Rule |
| --- | --- |
| Ternaries | One `? :` per expression. The check refuses nested ternaries |
| Ternary layout | Put the condition, the `?` branch and the `:` branch on separate lines when you assign or return the value |
| `if` / `for` nesting | Depth 2 (`for` → `if` is fine, `for` → `if` → `if` is not) |

Flatten with an early return, an extracted helper or a lookup map. Work out
complex values in named variables before you build an object.

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

Three lines of repetition are better than an early abstraction. Add the config
when a fourth case arrives or when the blocks must stay in sync.

## Blank lines between siblings

Put a blank line between block-level sibling statements and members: methods in
a class, sequential blocks in a function, sibling JSX.

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

For consecutive declarations, keep lines that **feed each other** together (a
derivation chain, or one value and its setter). Put a blank line between
**unrelated** lines. Each blank line means "a new idea starts here".

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

A tight cluster of tiny related lines is fine when a blank line would hurt
more than help.

## Names

- Use named exports. Use a default export only in a file that a framework
  requires.
- Add no `I` prefix to an interface. Write types and components in
  `PascalCase`, functions and variables in `camelCase`, constants in
  `SCREAMING_SNAKE_CASE`.

### Names say what and whose

Make each declaration say **what it is** and **what it is about**, without a
look at its definition.

| Declaration | Form | ❌ | ✅ |
| --- | --- | --- | --- |
| Variable | subject noun | `data`, `result`, `listed` | `skusInOrder`, `overdueInvoices` |
| Boolean | `is` / `has` / `can` / `should` / `was` + condition | `pending`, `active`, `seenOpen` | `isSaving`, `hasSelectedCustomers`, `wasOpen` |
| Collection | plural of its element | `list`, `items`, `arr` | `customers`, `orderIds` |
| Set / Map | element + role or key | `map`, `lookup` | `skusInOrder`, `customerById` |
| Function / method | verb + the thing it acts on | `handle`, `process`, `doIt`, `run` | `cancelOrder`, `buildInvoiceRows`, `toOrderSummary` |
| Class / module | role noun with the subject | `Manager`, `Helper`, `Utils` | `OrdersRepository`, `InvoiceTotalsCalculator` |
| Type / interface | subject + role | `Data`, `Options`, `IUser` | `CreateOrderInput`, `OrderLine` |
| Enum or union | singular subject; members in `PascalCase` | `Status` (of what?) | `OrderStatus.Shipped` |
| Constant | `SCREAMING_SNAKE` with the subject (and unit) | `DEFAULT`, `LIMIT`, `TIMEOUT` | `ORDER_LINES_MAX`, `LOGIN_ATTEMPTS_MAX`, `EXIT_MS` |
| Parameter or lambda argument | the element it is | `x`, `c`, `item`, `e` | `customer`, `invoice`, `event` |

- **Name the noun, not the state.** A bare participle or adjective (`listed`,
  `gaining`, `chosen`, `active`) is not a name. Say what: `skusInOrder`,
  `customersGained`, `selectedCustomers`.
- **Add the subject to a bare category word.** `data`, `items`, `value`,
  `result`, `state`, `info`, `config`, `options`, `selection`, `handler`,
  `manager`, `helper` and `utils` say nothing alone. Write `customerSelection`,
  `invoiceTotals`, `retryOptions`.
- **Keep the verb honest.** `fetch*` is an async API call. `find*` is a lookup.
  `read*` is a sync local read. `parse*` turns raw data into typed data. `to*`
  is a conversion. `build*` makes a new value from parts. `handle*` and
  `process*` hide what happens.
- **Name the container when two sources are in scope.** If `order.lines` and
  `catalog` both hold products, write `catalogProductsNotInOrder`.
- **Put units and formats in the name** when the type does not carry them:
  `timeoutMs`, `priceCents`, `startDateIso`.
- **Write no abbreviations,** except the ones the domain already uses (`id`,
  `url`, `api`). Use a single letter only for a tiny lambda or a loop index.
- **Use one word per concept** across files. Do not mix `customer`, `client`
  and `buyer`.

Test: read the line where the name is used, with the definition out of view.
If you cannot say what the name holds or does, rename it. Drop the subject only
when the file, class or type already shows it (`lines` inside `OrderLines`,
`findById` on `OrdersRepository`).

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

The stack's UI file holds the names for UI-only code: state pairs, hooks, props,
handlers and mutations.

### Names match behavior

Make a name, its parameters and its types describe what the body does **now**.
When behavior shrinks, rename the code or remove the leftovers. After you
delete a flag or a branch, drop the type fields that nobody uses and rename the
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

Make a storage helper name its medium. Then the call site does not need the
body to show where the data goes. Write `readTokenFromLocalStorage`,
`writeTokenToLocalStorage` and `clearTokenFromLocalStorage`, not `getToken` and
`setToken`.

## Comments

Write no essay comments. Do not restate what the code says. Prefer a name that
shows the intent over JSDoc on an obvious field. Write a comment only to say
*why*, not *what*.
