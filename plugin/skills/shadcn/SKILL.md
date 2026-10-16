---
name: shadcn
description: Manages shadcn/ui components in a React app — adding, composing, styling, forms, icons, base vs radix. Use when writing or changing React screens built from shadcn components, running `shadcn init` or `shadcn add`, or in any project with a components.json file.
user-invocable: false
allowed-tools: Bash(npx shadcn@latest *), Bash(pnpm dlx shadcn@latest *), Bash(bunx --bun shadcn@latest *)
---

# shadcn/ui

shadcn/ui adds components as source code to the project through the CLI.

> **IMPORTANT:** Run each CLI command with the project's package runner:
> `npx shadcn@latest`, `pnpm dlx shadcn@latest` or `bunx --bun shadcn@latest`.
> Choose it from the project's `packageManager`. The examples use
> `npx shadcn@latest`. Replace it with the correct runner.

## Current Project Context

```json
!`npx shadcn@latest info --json`
```

The JSON above holds the project config and the installed components. Run `npx shadcn@latest docs <component>` to get the documentation and example URLs of a component.

## Principles

1. **Use existing components first.** Run `npx shadcn@latest search` to check the registries before you write custom UI. Check community registries too.
2. **Compose. Do not reinvent.** Settings page = Tabs + Card + form controls. Dashboard = Sidebar + Card + Chart + Table.
3. **Use built-in variants before custom styles.** Example: `variant="outline"`, `size="sm"`.
4. **Use semantic colors.** Example: `bg-primary`, `text-muted-foreground`. Never use raw values such as `bg-blue-500`.

Reason: existing components, variants and tokens follow the theme of the project. Custom code does not.

## Critical Rules

Always apply these rules. Each links to a file with Incorrect/Correct code pairs.

### Styling & Tailwind → [styling.md](./rules/styling.md)

- **`className` for layout, not styling.** Never override component colors or typography.
- **No `space-x-*` or `space-y-*`.** Use `flex` with `gap-*`. For vertical stacks, `flex flex-col gap-*`.
- **Use `size-*` when width and height are equal.** `size-10` not `w-10 h-10`.
- **Use `truncate` shorthand.** Not `overflow-hidden text-ellipsis whitespace-nowrap`.
- **No manual `dark:` color overrides.** Use semantic tokens (`bg-background`, `text-muted-foreground`).
- **Use `cn()` for conditional classes.** Don't write manual template literal ternaries.
- **No manual `z-index` on overlay components.** Dialog, Sheet, Popover, etc. handle their own stacking.

### Forms & Inputs → [forms.md](./rules/forms.md)

- **Forms use `FieldGroup` + `Field`.** Never use raw `div` with `space-y-*` or `grid gap-*` for form layout.
- **`InputGroup` uses `InputGroupInput`/`InputGroupTextarea`.** Never raw `Input`/`Textarea` inside `InputGroup`.
- **Buttons inside inputs use `InputGroup` + `InputGroupAddon`.**
- **Option sets (2–7 choices) use `ToggleGroup`.** Don't loop `Button` with manual active state.
- **`FieldSet` + `FieldLegend` for grouping related checkboxes/radios.** Don't use a `div` with a heading.
- **Field validation uses `data-invalid` + `aria-invalid`.** `data-invalid` on `Field`, `aria-invalid` on the control. For disabled: `data-disabled` on `Field`, `disabled` on the control.

### Component Structure → [composition.md](./rules/composition.md)

- **Items always inside their Group.** `SelectItem` → `SelectGroup`. `DropdownMenuItem` → `DropdownMenuGroup`. `CommandItem` → `CommandGroup`.
- **Use `asChild` (radix) or `render` (base) for custom triggers.** Check `base` field from `npx shadcn@latest info`. → [base-vs-radix.md](./rules/base-vs-radix.md)
- **Dialog, Sheet, and Drawer always need a Title.** `DialogTitle`, `SheetTitle`, `DrawerTitle` required for accessibility. Use `className="sr-only"` if visually hidden.
- **Use full Card composition.** `CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`. Don't dump everything in `CardContent`.
- **Button has no `isPending`/`isLoading`.** Compose with `Spinner` + `data-icon` + `disabled`.
- **`TabsTrigger` must be inside `TabsList`.** Never render triggers directly in `Tabs`.
- **`Avatar` always needs `AvatarFallback`.** For when the image fails to load.

### Use Components, Not Custom Markup → [composition.md](./rules/composition.md)

- **Use existing components before custom markup.** Check if a component exists before writing a styled `div`.
- **Callouts use `Alert`.** Don't build custom styled divs.
- **Empty states use `Empty`.** Don't build custom empty state markup.
- **Toast follows the project base.** Use `toast` from the `toast` component for
  Base UI projects. Use `toast()` from `sonner` for Radix and React Aria
  projects.
- **Use `Separator`** instead of `<hr>` or `<div className="border-t">`.
- **Use `Skeleton`** for loading placeholders. No custom `animate-pulse` divs.
- **Use `Badge`** instead of custom styled spans.

### Icons → [icons.md](./rules/icons.md)

- **Icons in `Button` use `data-icon`.** `data-icon="inline-start"` or `data-icon="inline-end"` on the icon.
- **No sizing classes on icons inside components.** Components handle icon sizing via CSS. No `size-4` or `w-4 h-4`.
- **Pass icons as objects, not string keys.** `icon={CheckIcon}`, not a string lookup.

### CLI

- **Never decode preset codes or build preset URLs manually.** Use `npx shadcn@latest preset decode <code>`, `preset url <code>`, or `preset open <code>`. For project-aware preset detection, use `npx shadcn@latest preset resolve`.
- **Apply preset codes directly with the CLI.** Use `npx shadcn@latest apply <code>` for existing projects, or `npx shadcn@latest init --preset <code>` when initializing.

## Key Patterns

These patterns are the most common signs of correct shadcn/ui code. For edge cases, read the linked rule files above.

```tsx
// Form layout: FieldGroup + Field, not div + Label.
<FieldGroup>
  <Field>
    <FieldLabel htmlFor="email">Email</FieldLabel>
    <Input id="email" />
  </Field>
</FieldGroup>

// Validation: data-invalid on Field, aria-invalid on the control.
<Field data-invalid>
  <FieldLabel>Email</FieldLabel>
  <Input aria-invalid />
  <FieldDescription>Invalid email.</FieldDescription>
</Field>

// Icons in buttons: data-icon, no sizing classes.
<Button>
  <SearchIcon data-icon="inline-start" />
  Search
</Button>

// Spacing: gap-*, not space-y-*.
<div className="flex flex-col gap-4">  // correct
<div className="space-y-4">           // wrong

// Equal dimensions: size-*, not w-* h-*.
<Avatar className="size-10">   // correct
<Avatar className="w-10 h-10"> // wrong

// Status colors: Badge variants or semantic tokens, not raw colors.
<Badge variant="secondary">+20.1%</Badge>    // correct
<span className="text-emerald-600">+20.1%</span> // wrong
```

## Component Selection

| Need                       | Use                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| Button/action              | `Button` with appropriate variant                                                                   |
| Form inputs                | `Input`, `Select`, `Combobox`, `Switch`, `Checkbox`, `RadioGroup`, `Textarea`, `InputOTP`, `Slider` |
| Toggle between 2–5 options | `ToggleGroup` + `ToggleGroupItem`                                                                   |
| Data display               | `Table`, `Card`, `Badge`, `Avatar`                                                                  |
| Navigation                 | `Sidebar`, `NavigationMenu`, `Breadcrumb`, `Tabs`, `Pagination`                                     |
| Overlays                   | `Dialog` (modal), `Sheet` (side panel), `Drawer` (bottom sheet), `AlertDialog` (confirmation)       |
| Feedback                   | `toast` (Base UI), `sonner` (Radix/Aria), `Alert`, `Progress`, `Skeleton`, `Spinner`                 |
| Command palette            | `Command` inside `Dialog`                                                                           |
| Charts                     | `Chart` (wraps Recharts)                                                                            |
| Layout                     | `Card`, `Separator`, `Resizable`, `ScrollArea`, `Accordion`, `Collapsible`                          |
| Empty states               | `Empty`                                                                                             |
| Menus                      | `DropdownMenu`, `ContextMenu`, `Menubar`                                                            |
| Tooltips/info              | `Tooltip`, `HoverCard`, `Popover`                                                                   |

## Key Fields

The injected project context has these key fields:

- **`aliases`** → use the actual alias prefix for imports (e.g. `@/`, `~/`), never hardcode.
- **`isRSC`** → when `true`, components using `useState`, `useEffect`, event handlers, or browser APIs need `"use client"` at the top of the file. Always reference this field when advising on the directive.
- **`tailwindVersion`** → `"v4"` uses `@theme inline` blocks; `"v3"` uses `tailwind.config.js`.
- **`tailwindCssFile`** → the global CSS file where custom CSS variables are defined. Always edit this file, never create a new one.
- **`style`** → component visual treatment (e.g. `nova`, `vega`).
- **`base`** → primitive library (`radix` or `base`). Affects component APIs and available props.
- **`iconLibrary`** → determines icon imports. Use `lucide-react` for `lucide`, `@tabler/icons-react` for `tabler`, etc. Never assume `lucide-react`.
- **`resolvedPaths`** → exact file-system destinations for components, utils, hooks, etc.
- **`framework`** → routing and file conventions (e.g. Next.js App Router vs Vite SPA).
- **`packageManager`** → use this for any non-shadcn dependency installs (e.g. `pnpm add date-fns` vs `npm install date-fns`).
- **`preset`** → resolved preset code and values for the current project. Use `npx shadcn@latest preset resolve --json` when you only need preset information.

See [cli.md — `info` command](./cli.md) for the full field reference.

## Component Docs, Examples, and Usage

Run `npx shadcn@latest docs <component>` to get the URLs of the documentation, examples and API reference of a component. Fetch the URLs to get the content.

```bash
npx shadcn@latest docs button dialog select
```

**When you create, fix, debug or use a component, run `npx shadcn@latest docs` and fetch the URLs first.** The docs give the correct API and usage patterns. Do not guess them.

## Workflow

Copy this checklist into the reply and tick each step:

```text
shadcn progress:
- [ ] 1 Project context read
- [ ] 2 Installed components checked
- [ ] 3 Component found
- [ ] 4 Docs and examples read
- [ ] 5 Component installed or updated
- [ ] 6 Imports of third-party components fixed
- [ ] 7 Added files reviewed
```

1. **Get the project context.** It is injected above. Run `npx shadcn@latest info` to refresh it.

   Done when you know the `base`, `iconLibrary`, `aliases` and installed components.

2. **Check the installed components.** Read the `components` list in the context, or list the `resolvedPaths.ui` directory. Do not import a component that is not added. Do not add a component again.

   Done when you know which components are missing.

3. **Find the component.** Run `npx shadcn@latest search`.

   Done when you have the name of the registry item.

4. **Get the docs and examples.** Run `npx shadcn@latest docs <component>` and fetch the URLs. Run `npx shadcn@latest view` to browse an item that is not installed. Run `npx shadcn@latest add --diff` to preview changes to an installed component.

   Done when you have read the documentation of each component you use.

5. **Install or update.** Run `npx shadcn@latest add`. To update an existing component, preview with `--dry-run` and `--diff` first (see [Updating Components](#updating-components)).

   Done when the CLI reports the files written.

6. **Fix the imports of third-party components.** Components from community registries (for example `@bundui`, `@magicui`) can hold hardcoded paths such as `@/components/ui/...`. These paths can differ from the project's aliases. Run `npx shadcn@latest info` to get the correct `ui` alias (for example `@workspace/ui/components`). Rewrite the imports. The CLI rewrites imports only in its own UI files.

   Done when each import in the added non-UI files resolves.

7. **Review the added files.** Read each file of an added component or block. Look for missing sub-components (for example `SelectItem` without `SelectGroup`), missing imports, wrong composition and violations of the [Critical Rules](#critical-rules). Replace each icon import with the project's `iconLibrary`. Example: the item uses `lucide-react` and the project uses `hugeicons`. Swap the imports and the icon names. If you find a problem, fix it and read the file again.

   Done when the files have no violation.

Two rules apply at any step.

- **Name the registry.** When the user asks for a block or component with no registry (for example "add a login block"), ask which registry to use. Do not choose one for the user. Registry names look like `@shadcn`, `@tailark` or `owner/repo`.
- **Ask before you switch a preset.** Ask the user to choose: **overwrite**, **partial**, **merge** or **skip**. Then use the matching command.

  Done when the user has chosen and the command has run.

Reason: a wrong guess of the registry installs code from a source the user did not pick.

### Preset commands

- **Inspect the current preset**: `npx shadcn@latest preset resolve`. Add `--json` for structured values.
- **Inspect the incoming preset**: `npx shadcn@latest preset decode <code>`. Run `preset url <code>` or `preset open <code>` to share the preset or open the preset builder.
- **Overwrite**: `npx shadcn@latest apply <code>`. It overwrites the detected components, fonts and CSS variables.
- **Partial**: `npx shadcn@latest apply <code> --only theme,font`. It updates only the chosen preset parts. It does not reinstall UI components. Valid values are `theme` and `font`, alone or comma-separated. `icon` is not supported, because an icon change can need a full reinstall and transforms.
- **Merge**: run `npx shadcn@latest init --preset <code> --force --no-reinstall`. Run `npx shadcn@latest info` to list the installed components. For each installed component, run `--dry-run` and `--diff` and [merge it by hand](#updating-components).
- **Skip**: run `npx shadcn@latest init --preset <code> --force --no-reinstall`. It updates only the config and CSS. It leaves the components as they are.

Run preset commands inside the user's project directory. `apply` works only in an existing project with a `components.json` file. The CLI keeps the current base (`base` or `radix`) from `components.json`. In a scratch or temp directory (for example for `--dry-run` comparisons), pass `--base <current-base>`. Preset codes do not encode the base.

## Updating Components

Use `--dry-run` and `--diff` to merge upstream changes into a component that has local changes.

1. **List the affected files.** Run `npx shadcn@latest add <component> --dry-run`.

   Done when you have the list of files.

2. **Read each diff.** For each file, run `npx shadcn@latest add <component> --diff <file>`.

   Done when you have seen the upstream and local changes of each file.

3. **Decide per file.**
   - No local changes: overwrite the file.
   - Local changes: read the local file. Apply the upstream updates. Keep the local changes.
   - The user says "just update everything": confirm first. Then use `--overwrite`.

   Done when each file has a decision and the decision is applied.

**NEVER** fetch raw files from GitHub by hand. Use the CLI. **NEVER** use `--overwrite` without the explicit approval of the user.

Reason: `--overwrite` deletes the local changes of the user.

## Quick Reference

```bash
# Create a new project.
npx shadcn@latest init --name my-app --preset base-nova
npx shadcn@latest init --name my-app --preset a2r6bw --template vite

# Create a monorepo project.
npx shadcn@latest init --name my-app --preset base-nova --monorepo
npx shadcn@latest init --name my-app --preset base-nova --template next --monorepo

# Initialize existing project.
npx shadcn@latest init --preset base-nova
npx shadcn@latest init --defaults  # shortcut: --template=next --preset=nova (base style implied)

# Apply a preset to an existing project.
npx shadcn@latest apply a2r6bw
npx shadcn@latest apply a2r6bw --only theme
npx shadcn@latest apply a2r6bw --only font
npx shadcn@latest apply a2r6bw --only theme,font

# Inspect preset codes and project preset state.
npx shadcn@latest preset decode a2r6bw
npx shadcn@latest preset url a2r6bw
npx shadcn@latest preset open a2r6bw
npx shadcn@latest preset resolve
npx shadcn@latest preset resolve --json

# Add components.
npx shadcn@latest add button card dialog
npx shadcn@latest add @magicui/shimmer-button
npx shadcn@latest add owner/repo/item
npx shadcn@latest add --all

# Preview changes before adding/updating.
npx shadcn@latest add button --dry-run
npx shadcn@latest add button --diff button.tsx
npx shadcn@latest add @acme/form --view button.tsx
npx shadcn@latest add owner/repo/item --dry-run

# Search registries.
npx shadcn@latest search @shadcn -q "sidebar"
npx shadcn@latest search @tailark -q "stats"
npx shadcn@latest search owner/repo -q "login"
npx shadcn@latest search                          # all configured registries
npx shadcn@latest search @shadcn -q "menu" -t ui  # filter by item type

# Get component docs and example URLs.
npx shadcn@latest docs button dialog select

# View registry item details (for items not yet installed).
npx shadcn@latest view @shadcn/button
npx shadcn@latest view owner/repo/item
```

**Named presets:** `nova`, `vega`, `maia`, `lyra`, `mira`, `luma`
**Templates:** `next`, `vite`, `start`, `react-router`, `astro` (all support `--monorepo`) and `laravel` (not supported for monorepo)
**Preset codes:** Version-prefixed base62 strings (e.g. `a2r6bw` or `b0`), from [ui.shadcn.com](https://ui.shadcn.com).

## Detailed References

Open the file that matches the task.

- [rules/forms.md](./rules/forms.md) — FieldGroup, Field, InputGroup, ToggleGroup, FieldSet, validation states
- [rules/composition.md](./rules/composition.md) — Groups, overlays, Card, Tabs, Avatar, Alert, Empty, Toast, Separator, Skeleton, Badge, Button loading
- [rules/icons.md](./rules/icons.md) — data-icon, icon sizing, passing icons as objects
- [rules/styling.md](./rules/styling.md) — Semantic colors, variants, className, spacing, size, truncate, dark mode, cn(), z-index
- [rules/base-vs-radix.md](./rules/base-vs-radix.md) — asChild vs render, Select, ToggleGroup, Slider, Accordion
- [cli.md](./cli.md) — Commands, flags, presets, templates
- [customization.md](./customization.md) — Theming, CSS variables, extending components
- [agents/openai.yml](./agents/openai.yml) — display name and short description for agent listings
