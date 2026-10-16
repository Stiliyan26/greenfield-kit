# TypeScript specifics

These rules add to clean-code.md: constants as closed unions, and who sorts
the imports.

## Contents

- No magic strings
- Import order

## No magic strings

Define a literal that names a concept once, and reference it everywhere: route
path, role, status, storage key, query key, event name, error message.

| Kind | Where it lives |
| --- | --- |
| UI route paths | TanStack Router's typed `to` (`/orders/$orderId`). The router checks them, so no constant is needed |
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

Test: if a rename means a grep for a string, make the string a constant. Keep a
one-off literal that names nothing (a label, a delimiter) inline. Do not
mirror an existing enum in a constants file.

## Import order

Do not sort by hand. `pnpm run check:fix` sorts imports into the six groups
in `eslint.config.mjs`.
