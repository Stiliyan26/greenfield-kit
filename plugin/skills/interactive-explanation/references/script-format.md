# script.json

One file per explainer at `temp/explainers/<slug>/script.json`. Mermaid is a
plain string with `\n` line breaks. All text follows the ASD-STE100 rules in
SKILL.md. Never put timings in the script: a scene lasts as long as its
narration plus 0.9 s, or its clip if that is longer.

## Top level and page sections

| Key | Required | Shape | Shows |
| --- | --- | --- | --- |
| `mode` | no (default `"pr"`) | `"task"` or `"pr"` | Budget and required keys (SKILL.md) |
| `slug`, `title`, `subtitle?`, `prUrl?` | `slug`, `title` | strings | Header. `prUrl` also gives the review map its base branch |
| `base` | no | branch name | The review map diffs against it. Default: the PR's base branch, else `main` |
| `description` | yes | a sentence or 2–5 strings | What it does |
| `impact` | yes | one sentence | Header, under the title |
| `sketches` | PR: 1–3 | `{ kind, heading, text, source, diff?, file?, highlight? }[]`, `kind` is `files`, `components`, `calls`, `pseudo` or `code` | Summary, under the description. `source` is the sketch with `\n` line breaks. With `diff: true`, each line starts with `+`, `-` or a space. `code` needs `file`; `highlight` lists 1-based lines |
| `beforeAfter` | when behaviour changed | `{ before, after, note? }`, both Mermaid flowcharts | Two stacked flowcharts: Before muted, After in brand colours |
| `diagrams` | PR: 1–3 | `{ type, heading, mermaid, steps?, note? }[]`, `type` is `sequence`, `component`, `state` or `flowchart` | How it works. `steps` is a numbered list, for example migration steps |
| `database` | schema touched | `{ intro?, tables: string[], relations?: { table, column, meaning }[] }` | Data model: the ER is generated from [schema facts](#schema-facts), plus a relations table. `relations` adds what each foreign key means |
| `screens` | UI changed | `{ shot: "<feature>/<step>", caption }[]` | Review map: each shot with its changed components boxed, from the journey run. No plain screenshot shows anywhere |
| `evidence` | no | `{ label, before, after }[]`, each side `{ output }` | Evidence: before and after side by side. `output` is a test run or console output, shown as text |
| `outcome` | yes | `string[]` | What people can do now, with decisions: `"… (Q7 in plan.md)."` |
| `risks` | PR | `{ door: { type, text? }, blastRadius: { scope, text? }, items?: { area, text }[], mermaid?, deploy?: string[] }`, `type` is `one-way` or `two-way` | Merge danger: door and blast radius (also as chips in the header), one row per area, an impact flowchart, numbered deploy steps |
| `tests` | PR | `{ summary?, items: { name, proves }[] }` | In Evidence: a summary line, then a table with each spec and what it proves |
| `journey`, `architecture` | PR: one or both | `{ scenes: Scene[] }` | The videos. Leave a key out to skip that video |

## Scene kinds

Every scene has an `id` (unique across both videos, lowercase with dashes), a
`kind`, a `narration`, and an optional `caption` (a short line at the bottom).

| kind | Fields | Shows |
| --- | --- | --- |
| `title` | `headline`, `sub?` | Opens each video |
| `before-after` | `heading`, `before: string[]`, `after: string[]` | Two columns of 2–4 items each |
| `clip` | `clip` (a recorded clip id), `heading?` (the URL bar), `step?` (for example `STEP 2 OF 5`) | The recorded step in a browser frame. Holds the last frame while the narration runs on |
| `files` | `heading`, `tree: { path, status: added \| changed \| removed \| kept, note? }[]` | Files with status pills, about 14 rows at most |
| `diagram` | `heading`, `nodes: { id, label, sub?, x, y, width?, kind?: client \| server \| db \| plain }[]`, `edges?: { from, to, label? }[]` | Boxes on a 100×56 grid (x right, y down; a box is 22 wide by default). Edges draw in order |
| `code` | `heading?`, `file`, `code`, `highlight?: number[]` (1-based) | Code with line numbers; highlighted lines get the brand rail |
| `bullets` | `heading`, `kicker?`, `items: string[]` | 2–6 points, for "what changed" and "decisions" |

## Example

```json
{
  "mode": "pr",
  "slug": "cancel-order",
  "title": "Staff can cancel an order",
  "prUrl": "https://github.com/acme/app/pull/53",
  "description": ["Staff cancel an open order from the list or the detail page", "The customer gets one email"],
  "impact": "A wrong order is stopped in seconds, with no call to support.",
  "sketches": [
    { "kind": "calls", "heading": "What a cancel runs", "text": "The server function checks the owner before it writes.", "diff": true,
      "source": " OrderRow\n+  CancelOrderDialog\n+    cancelOrder({ orderId })\n+      ordersRepository.cancel(orderId, ownerId)\n+      sendCancelEmail(customer)" }
  ],
  "beforeAfter": {
    "before": "flowchart LR\n  S[Staff] -->|email support| X[Support edits the row]:::removed\n  X -.->|next day| C[Customer told]",
    "after": "flowchart LR\n  S[Staff] -->|Cancel + confirm| F[cancelOrder]:::added\n  F --> R[(orders.status = cancelled)]:::added\n  F --> M[One email to the customer]:::added"
  },
  "diagrams": [
    { "type": "sequence", "heading": "How a cancel reaches the database",
      "mermaid": "sequenceDiagram\n  participant UI as Orders list\n  participant F as cancelOrder\n  participant DB as Postgres\n  UI->>F: { orderId }\n  F->>DB: update where id and ownerId\n  DB-->>F: 1 row\n  F-->>UI: order (cancelled)" }
  ],
  "database": {
    "intro": "An order belongs to one customer. Cancelling sets its status and keeps the row.",
    "tables": ["orders", "customers"],
    "relations": [
      { "table": "orders", "column": "customer_id", "meaning": "The customer who placed the order and gets the email." }
    ]
  },
  "screens": [{ "shot": "cancel-order/2-confirm-dialog", "caption": "Confirm before the order is cancelled." }],
  "evidence": [
    { "label": "Staff cancel an open order",
      "before": { "output": "✗ cancel-order.spec: no Cancel button on the row" },
      "after": { "output": "✓ cancel-order.spec (9 tests)" } }
  ],
  "outcome": ["Staff cancel an order in two clicks.", "A cancelled order keeps its row and history (Q7 in plan.md)."],
  "risks": {
    "door": { "type": "two-way", "text": "The migration only adds a status value, so a revert keeps every row." },
    "blastRadius": { "scope": "Orders", "text": "The orders list and the order emails." },
    "items": [{ "area": "Data", "text": "The migration adds the status value. Existing rows are unchanged." }],
    "deploy": ["Merge the pull request.", "Run the database migration in production."]
  },
  "tests": { "summary": "Unit: 48 pass. Server functions: 31 pass. End-to-end: 9 pass.", "items": [{ "name": "cancel-order.spec", "proves": "Cancel from the list and the detail; a viewer sees no button." }] },
  "journey": {
    "scenes": [
      { "id": "j-title", "kind": "title", "headline": "Staff can cancel an order", "narration": "This video shows how staff cancel an order." },
      { "id": "j-cancel", "kind": "clip", "clip": "cancel-from-list", "heading": "Orders", "step": "STEP 1 OF 3",
        "caption": "The row shows the new status at once.",
        "narration": "Staff press Cancel and confirm. Before, they wrote to support and waited a day." }
    ]
  },
  "architecture": {
    "scenes": [
      { "id": "a-flow", "kind": "diagram", "heading": "Cancelling an order",
        "nodes": [
          { "id": "dialog", "label": "CancelOrderDialog", "x": 16, "y": 20, "kind": "client" },
          { "id": "fn", "label": "cancelOrder", "sub": "cancelOrderForUser()", "x": 60, "y": 20, "kind": "server" }
        ],
        "edges": [{ "from": "dialog", "to": "fn", "label": "{ orderId }" }],
        "narration": "The dialog only asks for confirmation. The server function checks the owner and updates the row in one statement." }
    ]
  }
}
```

## Schema facts

`database.command` gets the table names as arguments and prints this JSON. It
must read the schema from code, without a database connection.

```json
{ "tables": [{
  "name": "orders",
  "columns": [{ "name": "customer_id", "type": "uuid", "nullable": false, "primary": true, "unique": false,
                "foreignKey": { "table": "customers", "column": "id", "onDelete": "RESTRICT" },
                "default": null, "comment": null }],
  "uniques": [], "indexes": [], "checks": []
}] }
```

## Component boxes

The project's evidence helper writes `<step>.components.json` next to each
`<step>.png`: every rendered component instance and where it sits on the shot.
The review map boxes the ones declared (exported) in changed files.

```json
{ "scale": 1,
  "components": [{ "name": "OrderRow", "x": 603, "y": 435, "width": 604, "height": 27, "isOnTop": true }] }
```

`x`, `y`, `width` and `height` are CSS pixels on the full page; `scale` is the
device pixel ratio of the shot. `isOnTop` is false when a modal or an overlay
covers the component. In a React app, walk the fiber tree from the root
container's `stateNode.current` (dev build) to get the names.
