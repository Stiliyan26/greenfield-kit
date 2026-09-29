# Review: pipeline-docs · 2026-09-29

These are the documents an agent or the user follows to run the greenfield pipeline:
- the pipeline itself (greenfield-mode, coordination, features);
- the stage skills (plan-feature, deliver-feature, verify, design-interface and its references, shadcn, design-animations where promote points at it);
- the working agreement template;
- the repo's README, DIRECTION, PROJECT.md and the design-in-shadcn plan;
- the six manifests and the `.agents/skills/verify` symlink.

Files reviewed: 34, about 2,500 lines. Ran: nothing (this reviewer ran on the old read-only agent definition, no shell). Read tools.txt: manifests agree at 0.10.0, both `plugin validate` passed, check_agnostic clean. Manifest versions and descriptions match README ("Version 0.10.0", the same one-line description in all six). All four review placements (plan, own diff, merge, whole app) agree across greenfield-mode, DIRECTION, deliver-feature, plan-feature and review/SKILL.md.

<a id="p200"></a>
## 200. A screen change after promotion can't be promoted again, and the pixel check can't be re-run · Important

**Context.** Stage 3A (and the stage 7 loop) turns the approved studio variant into `web/`, then proves it with a pixel compare. The docs send the agent back to that step three times: after fixing a mismatch, after the motion pass, and after a screen changes in the studio.

**Impact.** The only command promote.md gives is `promote_variant.py … --check`, and it refuses as soon as `web/` exists. So the documented re-checks fail. A background agent either stops or guesses `compare_screens.mjs` arguments from studio.md. For a screen change during planning or in stage 7, "move it first" means moving the whole `web/` aside, which in stage 7 holds every merged feature. A fresh promotion then drops all of that wiring from the app. No doc says how to promote only the changed screens.

**Why.** The docs describe re-promotion and re-checking. The script supports one first-time copy only: no update mode, no `--screens`.

**Current code** (`plugin/skills/design-interface/references/promote.md:35-36`, `:42-43`, `:60-61`)

```
   Then it installs, type-checks and builds. It refuses to overwrite an
   existing `web/`; move it first.
```
```
   or a screen that reads the URL. Fix the cause in the app, never by editing
   the `design/` files, and run the check again.
```
```
  rule. A new part or a changed look goes back to the studio for a new
  revision, then a new promotion of the changed screens.
```

`plugin/skills/greenfield-mode/SKILL.md:43-45`:
```
while 3B runs with the user in chat. A screen change during planning goes
back through the studio: re-approve, and 3A promotes the changed screens
again. It never goes straight into `web/`. The join is: plan approved and
```

**Proved by.** `plugin/skills/design-interface/scripts/promote_variant.py:114-116`:
```
    out = root / args.out
    if out.exists():
        parser.error(f"{out} exists; move it first")
```
The parser (`:90-96`) has no option to update screens. Not run: `node plugin/skills/design-interface/scripts/test_app.mjs --keep`, then `python3 plugin/skills/design-interface/scripts/promote_variant.py <kept project> --check` twice. The second run should print "… exists; move it first".

**Fix options**

- **A (recommended).** In promote.md, give the re-check its own command, and add an update mode to the script:
  ```
  Re-check (after a fix or the motion pass):
  node <design-interface>/scripts/compare_screens.mjs --app web --studio-url <studio url> --variant <id> --out temp/verification/promote
  Changed screens after a re-approval:
  python3 <design-interface>/scripts/promote_variant.py . --screens <id,id> --check
  (copies only src/design/screens/<id>.tsx and the parts they import; never touches the rest of web/)
  ```
  Cost: about 30 lines in promote_variant.py plus a test_app step. Doc lines in promote.md and greenfield-mode.
- **B.** Docs only: the re-check line as in A. For changed screens, promote to `--out web-next` and have the lead copy the changed `src/design/` files across by hand. Cost: 6 doc lines. Hand-copying can drift, which the pixel check then has to catch.

**Test to add.** "After a re-approval that changes one screen, promoting again updates that screen in web/ and leaves feature code untouched; the compare passes."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p201"></a>
## 201. Every feature diff breaks the rule the lead merges by · Important

**Context.** In stage 5, each feature agent works in its own worktree and may edit only its feature file's Owns list. At merge, the lead sends back any diff that touches anything else.

**Impact.** The same skill tells the agent to write three things outside Owns:
- its feature file (Driving, Gotchas, Status);
- the `reviews/<date>-<feature>/` folder;
- `requests/<feature>-<name>.md`.

A lead that follows coordination.md literally refuses every feature. A lenient lead has no rule for what is allowed, so a real out-of-scope edit gets waved through with the rest.

**Why.** The Owns rule was written for product code. The pipeline files each agent must produce were never exempted.

**Current code** (`plugin/skills/deliver-feature/SKILL.md:33-34`)

```
- Edit only the files and folders your feature file's **Owns** list names.
  The lead refuses a diff that touches anything else.
```

**Proved by.** `plugin/skills/deliver-feature/SKILL.md:67-72`:
```
5. **Fill in the feature file.** Write its Driving section (preconditions,
   each user action with its exact command and what you should see) and any
   Gotchas, so `verify` can run it later. Set Status to review.
6. **Review, then report.** Run the `review` skill on your own diff. It
   writes `reviews/<date>-<feature>/`. You own the feature, so you tick and fix
```
and `plugin/skills/greenfield-mode/references/coordination.md:41-43`:
```
  for duplicates against `INDEX.md`), then merge. A diff that touches files outside the
  feature's Owns list, or adds a helper `INDEX.md` already covers, is sent
  back, not merged.
```
The example Owns list has none of those paths (`features.md:18-19`).

**Fix options**

- **A (recommended).** Add the same sentence to deliver-feature's rules and coordination's merge step:
  ```
  Besides its Owns list, a feature branch may change only: its own feature file's
  Driving, Gotchas, Status and Trace sections, its own reviews/<date>-<feature>/
  folder, and its own requests/<feature>-*.md files.
  ```
  Cost: 2 short paragraphs.
- **B.** The agent puts Driving, Gotchas and review results in its report, and the lead writes them after merge. Cost: more lead work in every wave, and the review record isn't committed by its owner.

**Test to add.** "A feature branch that changes only its Owns files, its feature file's own sections and its review folder is accepted at merge; one that edits another feature's file is refused."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p202"></a>
## 202. A feature agent's request for a shared helper never reaches the lead · Important

**Context.** When a feature needs something in `shared/`, it writes a request file and carries on. The lead reads `requests/`, adds the item, pushes, and tells the agent to rebase. This file loop is the fallback that "works everywhere" (plain worktrees).

**Impact.** The agent writes the request inside its own worktree, on its own branch, uncommitted. The lead's checkout has no such file, so the lead sees nothing and the agent waits or works around it. If the lead does find it and "marks the request answered" in its own checkout, the agent's rebase conflicts on the same file.

**Why.** The docs name the folder but not which checkout or branch it lives in, or how it reaches the lead.

**Current code** (`plugin/skills/greenfield-mode/references/coordination.md:33-38`)

```
  edits it. Before writing any helper or part it reads `INDEX.md`. When
  something is missing it writes `docs/plans/<project>/requests/<feature>-<name>.md`
  (what, why, the signature it needs) and continues with the rest of its
  feature. No local copies, ever.
- **The lead** reads `requests/`, adds the item to `shared/` and `INDEX.md`,
  pushes, marks the request answered, and tells the agent to rebase.
```

**Proved by.** `plugin/skills/greenfield-mode/SKILL.md:50-51`: "Worktrees for every agent that writes code". `plugin/skills/deliver-feature/SKILL.md:32`: "Work in your own worktree on your own branch." A file written in a worktree is only in that worktree's directory. Not run: create two worktrees, write the request in one, then `ls docs/plans/*/requests/` in the other.

**Fix options**

- **A (recommended).** One requests folder outside the branches. The lead gives each agent the absolute path of the main checkout's `docs/plans/<project>/requests/` at spawn. The agent writes there and never commits it. The lead answers in the same file and commits it on main with the shared change. Cost: 3 lines in coordination and 2 in deliver-feature.
- **B.** The request goes into the agent's report or runtime message, and the lead writes the file on main. Cost: the plain-worktree runtime has no messaging, so the agent must stop to report.

**Test to add.** "In plain worktrees, a request written by a feature agent is visible to the lead without a merge, and answering it causes no rebase conflict."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p203"></a>
## 203. No doc says where `shared/` is or who owns the promoted screens · Important

**Context.** After promotion, `web/` holds the approved screens in `src/design/screens/` and parts in `src/design/parts/`. Foundation adds `shared/` with `INDEX.md`. Feature files list what each agent owns. `write-code` defines the layers app → pages → features → entities → shared.

**Impact.** A feature agent must wire the promoted `orders` screen to real data. That screen is `web/src/design/screens/orders.tsx`, but the example Owns list gives it `src/features/orders/**`, so it can't touch the screen. It must guess whether to copy the screen (a duplicate) or edit a file it doesn't own. The lead has the same problem with `shared/`:
- is it the repo root, `web/shared/` or `web/src/shared/`?
- coordination puts every entity used twice in it, but write-code says shared holds nothing with business meaning and entities go in `entities/`.

Two leads would build two different layouts, and triage's Owns grouping and the dependency-cruiser gate (`src/shared/`) only match one of them.

**Why.** The promoted layout (`src/design/`) and the coordination layout (`shared/`, `src/features/`) were written separately, and nothing maps one onto the other.

**Current code** (`plugin/skills/greenfield-mode/references/coordination.md:20-24`)

```
2. Build `shared/`: every entity, helper and UI part that two or more feature
   files use. The approved design already gives the parts
   (`web/src/design/parts/`).
3. Write `shared/INDEX.md`: one line per item, name, what it does, import
   path. Agents grep this before writing anything.
```

`plugin/skills/greenfield-mode/references/features.md:17-19`:
```
- Screens: `orders`, `order-detail` (approved studio screens; routes in web/)
- Owns: `src/features/orders/**`, `src/entities/order/**`, endpoints `GET /orders`,
  `POST /orders/:id/cancel`, table `orders`
```

**Proved by.** `plugin/skills/write-code/references/structure.md:16-19`:
```
- `entities/<thing>/`: one business thing (e.g. orders): its types, API calls,
  response checks and data-loading hooks.
- `shared/`: things with no business meaning. `ui/` for basic components
  (button, dialog), `lib/` for generic helpers, `api/` for the HTTP client.
```
`plugin/skills/design-interface/scripts/promote_variant.py:122` copies the variant to `out / "src" / "design"`. `plugin/skills/review/assets/gates/dependency-cruiser.frontend.cjs:35` assumes `^src/shared/`.

**Fix options**

- **A (recommended).** Add a "web/ after foundation" block to coordination.md:
  ```
  web/src/design/parts/     approved parts; lead-owned, listed in INDEX.md
  web/src/design/screens/   approved screens; a feature owns its screens' files here
                            (put them in Owns) and wires them to data from its entity
  web/src/entities/<thing>/ lead-owned when two features use it, else the feature's
  web/src/shared/           lead-owned; ui/, lib/, api/ (write-code); INDEX.md lives here
  ```
  Make features.md's Owns example include `web/src/design/screens/orders.tsx`. Cost: about 10 doc lines.
- **B.** Promotion moves screens into write-code's `features/<f>/<screen>/` and parts into `shared/ui/`. Cost: a promote_variant rewrite, and features don't exist yet when promotion runs.

**Test to add.** "Given the example feature file and a promoted web/, every screen the feature lists is in its Owns globs, and shared/INDEX.md has one agreed path."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p204"></a>
## 204. The merge review is said to catch duplicate helpers, but the reviewer never reads the shared index · Important

**Context.** At every merge the lead runs the `review` skill on the feature's diff. Coordination relies on that review as the duplication check against `shared/INDEX.md`.

**Impact.** A feature that writes its own `formatMoney` next to the shared one passes review. The review skill, checklist and reviewer agent never mention `INDEX.md` or `shared/`. The reviewer searches "by name and by what it does", with no pointer to the index, so a differently named copy is missed. That is the duplication the whole ownership design exists to stop.

**Why.** Coordination describes a check that the rewritten review skill doesn't have.

**Current code** (`plugin/skills/greenfield-mode/references/coordination.md:39-41`)

```
- **Merge, one feature at a time,** in the wave's order: rebase on main, run
  every test and scenario, run the `review` skill on the diff (it checks
  for duplicates against `INDEX.md`), then merge. A diff that touches files outside the
```

**Proved by.** A grep for `INDEX|shared/` in `plugin/agents/*.md` and `plugin/skills/review/**` finds no `INDEX.md` anywhere. The only hits are Owns parsing in triage.mjs and `src/shared/` in a dependency-cruiser config. `plugin/skills/review/references/checklist.md:99-100` says only: "A helper, component or query that already exists wasn't written again. Search by name and by what it does before flagging."

**Fix options**

- **A (recommended).** In review/SKILL.md step 4, add to each reviewer's inputs: "`shared/INDEX.md` when it exists". In checklist Fit, add: "Read `shared/INDEX.md` first; a new helper or part that an index line already covers is a problem." Cost: 2 lines. This touches the review area, so coordinate with that reviewer.
- **B.** Drop the claim from coordination.md and have the lead grep INDEX.md names against the diff before merging. Cost: a manual step that is easy to skip.

**Test to add.** "A merge review of a diff that adds a helper with the same job as an INDEX.md line reports it."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p205"></a>
## 205. The verify example teaches the second feature map the skill forbids · Important

**Context.** `verify` writes the project's `verify-<app>` skill once and drives every feature from the plan's feature files. Its only worked example is `references/example.md`, which the skill says to copy "its shape, never its values". The file was carried over unchanged (100% rename) from the removed create-verification-skill.

**Impact.** An agent copying the example builds `verify-<app>/features/README.md` plus a feature file with a `Sub-features` section and "Driving it with Playwright". That is a second map beside `docs/plans/<project>/features/`. Maintain mode then keeps two maps, and features.md's sections (Scenarios, Driving it, Status) don't match the copied shape.

**Why.** The skill was rewritten around feature files, and the example wasn't.

**Current code** (`plugin/skills/verify/references/example.md:20-22`, `:93-101`)

```
Web app, driven with Playwright. The feature map is in
[features/README.md](features/README.md). Read the feature's file before you
drive it.
```
```
## `features/reviews.md`

````markdown
# Reviews

A signed-in reader writes one review per book, edits it, and deletes it. The
book's average rating updates on the book page.

## Sub-features
```

**Proved by.** `plugin/skills/verify/SKILL.md:15-16` and `:50`:
```
this app), then runs and maintains it. [example.md](references/example.md)
shows a finished one; copy its shape, never its values.
```
```
- **Features:** point at `docs/plans/<project>/features/`. No second map.
```
`plugin/skills/greenfield-mode/references/features.md:75-77`: "The verify map is these files. … No second feature map exists."

**Fix options**

- **A (recommended).** Rewrite the example's two parts:
  - the skill's intro becomes "Features: `docs/plans/bookshelf/features/`. Read the feature's file before you drive it.";
  - the second block becomes `docs/plans/bookshelf/features/reviews.md` in features.md's shape: Scenarios with D-ids, How to get to it, Driving it, Gotchas, Status, Trace.

  Add a Helpers note that `drive.mjs --feature` reads that file. Cost: about 40 lines.
- **B.** Cut the feature file from the example and link features.md for its shape. Cost: 25 lines removed, and the example no longer shows a Driving section.

**Test to add.** "A verify-<app> skill made by copying the example has no features/ folder of its own and points at docs/plans/<project>/features/."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p206"></a>
## 206. The design quality gate token-checks the built bundle instead of the models' code · Important

**Context.** Before the user sees any design, step 5 of design-interface runs the quality gate in visual-quality.md: capture, token check, variant check, critic. Since this range, `studio/candidates/` holds build output (`npm run build`), including the shared Tailwind and shadcn bundle in `candidates/assets/`.

**Impact.** An agent following visual-quality.md scans generated CSS and JS full of raw `oklch(…)` and Tailwind palette values. The check can never print the required `0 problems`: the gate blocks forever, or the agent learns to ignore it. It also never checks the `.tsx` a model actually wrote, where a real `bg-red-500` would be.

**Why.** The path in visual-quality.md is left over from hand-written HTML candidates. The other four docs were updated; this one wasn't.

**Current code** (`plugin/skills/design-interface/references/visual-quality.md:35-39`)

```
3. Run the token check. It must print `0 problems`:

   ```
   python3 <studio-scripts>/check_tokens.py --project studio/project.json studio/candidates
   ```
```

**Proved by.** `plugin/skills/design-interface/references/studio.md:177-179` (build writes `studio/candidates/<id>/<screen>.html …, the shared studio/candidates/assets/`). `plugin/skills/design-interface/scripts/check_tokens.py:20-21` scans `.css`/`.js` and skips only `node_modules, dist, build, …`. `design-interface/SKILL.md:75-76`, `studio.md:291`, `variant-brief.md:102` and `.agents/PROJECT.md:40` all say `studio/app/src/variants`. Not run: `node plugin/skills/design-interface/scripts/test_app.mjs --keep`, then `python3 plugin/skills/design-interface/scripts/check_tokens.py --project <kept>/studio/project.json <kept>/studio/candidates`.

**Fix options**

- **A (recommended).** Change the command to match the rest:
  ```
  python3 <studio-scripts>/check_tokens.py --project studio/project.json studio/app/src/variants
  ```
  Cost: 1 line.

**Test to add.** "The quality-gate token check on a clean React variant prints 0 problems, and on a variant with bg-red-500 in a screen names that file."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p207"></a>
## 207. The shadcn skill tells agents to pull parts and presets the approved design forbids · Important

**Context.** This range changed the shadcn skill's description to trigger "when writing or changing React screens built from shadcn components … or in any project with a components.json file". Every promoted `web/` and every studio app has a components.json. The pipeline says the approved design fixes the parts and the theme: a missing part goes back to the studio, and `shadcn init --force` or `apply` must never run in `web/`.

**Impact.** A feature agent building a screen in `web/` loads the shadcn skill. Its first principle sends the agent to search community registries before writing UI. Its workflow installs parts with `add`, and its preset section runs `apply` or `init --force`, which rewrites `src/index.css` and drops the approved theme. The look drifts from the approved design with no studio round-trip, and the pixel compare isn't re-run in stage 5.

**Why.** The skill was trimmed (chat, registry authoring) and re-triggered, but its general shadcn workflow wasn't reconciled with the pipeline's rules.

**Current code** (`plugin/skills/shadcn/SKILL.md:24`, `:175-176`, `:183-186`)

```
1. **Use existing components first.** Use `npx shadcn@latest search` to check registries before writing custom UI. Check community registries too.
```
```
4. **Get docs and examples** — run `npx shadcn@latest docs <component>` to get URLs, then fetch them. Use `npx shadcn@latest view` to browse registry items you haven't installed. To preview changes to installed components, use `npx shadcn@latest add --diff`.
5. **Install or update** — `npx shadcn@latest add`. When updating existing components, use `--dry-run` and `--diff` to preview changes first (see [Updating Components](#updating-components) below).
```
```
   - **Overwrite**: `npx shadcn@latest apply <code>`. Overwrites detected components, fonts, and CSS variables.
   - **Partial**: `npx shadcn@latest apply <code> --only theme,font`. …
   - **Merge**: `npx shadcn@latest init --preset <code> --force --no-reinstall`, …
   - **Skip**: `npx shadcn@latest init --preset <code> --force --no-reinstall`. …
```

**Proved by.** `plugin/skills/design-interface/references/promote.md:65-66`: "Never run `shadcn init --force` or `shadcn apply` in `web/`: both rewrite the theme in `src/index.css`." `plugin/skills/greenfield-mode/SKILL.md:61`: "A part or a look the approved design doesn't have goes back to the studio." `variant-brief.md:32-33`: "Every shadcn part is installed; never run `shadcn add` …".

**Fix options**

- **A (recommended).** Add a short block at the top of the shadcn skill:
  ```
  ## In a project with DESIGN.md
  Every shadcn part is already installed and themed by design/shadcn.css. Never run
  add from another registry, apply, or init --force. A part that isn't installed,
  or a look change, goes back to the studio (design-interface). Use docs for APIs.
  ```
  Cost: 5 lines.
- **B.** Narrow the description so it doesn't trigger in `web/`. Cost: loses the composition, forms and styling rules exactly where screens are built.

**Test to add.** "An agent adding a screen in a promoted web/ with DESIGN.md never runs shadcn add/apply/init and the pixel compare still passes."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p208"></a>
## 208. The working agreement tells the agent to tick review decisions the user must tick · Important

**Context.** `.agents/INSTRUCTIONS.md` is copied into every project and applies to every agent. The review skill writes problem files whose Decision lines only the user ticks. The one exception is a feature agent reviewing its own diff.

**Impact.** In any project, an agent that runs the review before merging reads "you tick what to fix, then say 'fix'" and ticks the Decision lines itself. It then fixes what it chose. The user's decision step, the core of the new review, is skipped silently.

**Why.** The sentence is written to the agent ("you"), but it describes the user's step.

**Current code** (`plugin/skills/setup-project/templates/.agents/INSTRUCTIONS.md:83-84`)

```
- Before merging, run the `review` skill. It writes `reviews/`; you tick
  what to fix, then say "fix".
```

**Proved by.** `plugin/skills/review/SKILL.md:131-132`: "The user edits the Decision line of each problem … Don't tick for them." The only exception is `:184` ("The feature agent is also the fixer; it ticks its own Decision lines"). `greenfield-mode/SKILL.md:66` also says "the user ticks".

**Fix options**

- **A (recommended).**
  ```
  - Before merging, run the `review` skill. It writes `reviews/`; the user
    ticks what to fix, then says "fix". Never tick for them (a feature agent
    reviewing its own diff is the one exception).
  ```
  Cost: 2 lines.

**Test to add.** "After a review in a set-up project, the agent stops at 'Tick the Decision lines, then say fix' and leaves every Decision line unticked."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p209"></a>
## 209. Codex in this repo still runs the removed lens-and-judge reviewer · Important

Same cause as [#309 in review-skill.md](review-skill.md#p309), which also proposes a `--check` mode so the gates catch the drift. Decide there. This reviewer's extra point: the PROJECT.md check "After changing an agent, regenerate `.codex/agents/`" was removed in this range and should come back.

**Status.** merged into #309

<a id="p210"></a>
## 210. No stage sets up the project commands, working agreement and e2e suite that later stages run · Important

**Context.** greenfield-mode runs a new product from nothing. Later stages lean on project files:
- the lead keeps `STATUS.md` "(the working agreement says how)";
- feature agents run "the project's checks from `.agents/PROJECT.md`" and an e2e suite;
- the review runs "the gate command from `.agents/PROJECT.md`".

Those files come from `setup-project`, which greenfield-mode never names.

**Impact.** In a fresh repo, stages 0–5 run without the working agreement, so the digest, STATUS.md and trace rules aren't loaded. At stage 5, every wave-1 agent looks for `.agents/PROJECT.md` commands and an e2e config that don't exist. Each sets up Playwright on its own (outside Owns, conflicting at merge) or reports "not checked". The first review has no gate command.

**Why.** Foundation lists schema, auth, skeleton, shared and the shell, but not the project's tooling. No stage runs setup-project.

**Current code** (`plugin/skills/greenfield-mode/SKILL.md:35`)

```
| **4 Foundation** | you, alone, sequential | Nothing, unless a contract conflict appears | Schema, auth, the API skeleton from the contract, `shared/` with `INDEX.md`, the app shell = the promoted `web/` |
```

**Proved by.** `plugin/skills/deliver-feature/SKILL.md:45-47` and `:57-58` (scenarios as e2e tests in "the project's suite"; "Run the project's checks from `.agents/PROJECT.md`"). `plugin/skills/review/SKILL.md:40`: "Run the project's gate command from `.agents/PROJECT.md`". `plugin/skills/setup-project/SKILL.md:10-20` is the only thing that creates `.agents/INSTRUCTIONS.md` and `PROJECT.md`. A grep for `setup-project` in `plugin/skills/greenfield-mode/` finds nothing.

**Fix options**

- **A (recommended).** Stage 0 starts with: "No `.agents/PROJECT.md`: run `setup-project` first." Foundation's Produces gains: "`.agents/PROJECT.md` Commands filled (dev, type check, lint, unit, `test:e2e`, gates); the e2e suite set up with one passing smoke test, so wave 1 only adds specs." Cost: 2 table cells.

**Test to add.** "On a fresh repo, after stage 4 the commands in PROJECT.md run and the e2e smoke test passes before any feature agent starts."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p211"></a>
## 211. Promotion's pixel check points at a fixed studio address the studio doesn't use · Important

**Context.** Stage 3A runs in the background right after Approve, with "the studio running". The studio was started in design step 9 of new-project.md.

**Impact.** new-project.md starts the studio without `--port`, so it runs on a random free port. promote.md's only command compares against `http://127.0.0.1:4173`. The background agent gets connection errors on every capture. It either reports the promotion as failed or starts a second studio and guesses a port. Neither doc tells it to use the printed URL.

**Why.** Two docs start and use the same server with different assumptions about its port.

**Current code** (`plugin/skills/design-interface/references/promote.md:24-27`)

```
1. With the studio running, from the project root:

   ```
   python3 <design-interface>/scripts/promote_variant.py . --check --studio-url http://127.0.0.1:4173
```

**Proved by.** `plugin/skills/design-interface/references/new-project.md:36`: "9. Start `python3 studio/server.py` and give the user the URL." `plugin/skills/design-interface/assets/studio-engine/studio_server.py:451`: `parser.add_argument("--port", type=int, default=0, help="Local port (default: choose a free one)")`.

**Fix options**

- **A (recommended).** In promote.md: `--studio-url <the URL the studio printed>`. In new-project step 9: `python3 studio/server.py --port 4173` (so `npm run dev`'s `STUDIO_URL` default also matches, studio.md:184-186). Cost: 2 lines.

**Test to add.** "Following new-project then promote.md word for word, the compare reaches the studio on the first run."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p212"></a>
## 212. Feature agents can't find the token checker in a normal plugin install · Important

**Context.** Before any UI task is done, deliver-feature requires `check_tokens.py` from the design-interface skill. A feature agent doesn't have design-interface loaded, so the doc tells it where that folder is.

**Impact.** README installs the kit as a plugin in Claude Code, Codex and Cursor. Its skills then live in the tool's plugin cache, not in `.agents/skills/` (setup-project copies no skills) or `~/.agents/skills/` (only after `sync_global --push`). The agent looks in the two named places, finds nothing, and skips a required check ("not checked") or searches the disk.

**Why.** The hint predates plugin installs. The studio stub already knows the cache paths, but this doc doesn't.

**Current code** (`plugin/skills/deliver-feature/SKILL.md:24-26`)

```
`python3 <design-interface>/scripts/check_tokens.py --tokens design/tokens.css <changed files>`
and fix what it prints. `<design-interface>` is that skill's folder, in
`.agents/skills/` or `~/.agents/skills/`. If a task needs a screen or a part
```

**Proved by.** `plugin/skills/design-interface/assets/studio-content/server.py:27-32` searches `~/.claude/plugins`, `~/.codex/plugins` and `~/.cursor/plugins` for the same skill. README.md:43-50 and :66 install through plugins (`~/.codex/plugins/cache/greenfield-kit/…`). `plugin/skills/setup-project/scripts/setup_project.py:19` copies only `templates/`.

**Fix options**

- **A (recommended).** "`<design-interface>` is the folder two levels above the path in `studio/.engine-path` (written by `init_studio.py`); otherwise the design-interface skill in the installed plugin, `.agents/skills/` or `~/.agents/skills/`." Cost: 2 lines, and the same wording in promote.md.
- **B.** Have `promote_variant.py` copy `check_tokens.py` into `web/scripts/` and add `npm run check:tokens`. Cost: about 5 script lines. One command then works in every tool, and PROJECT.md can list it as a gate.

**Test to add.** "In a project using the Claude Code plugin install, a feature agent runs check_tokens.py with the path the doc gives."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p213"></a>
## 213. The plan template saves to a different folder than every stage that reads it · Later

**Context.** plan-feature's template says where the plan, contract and feature files go. greenfield-mode, features.md, deliver-feature and verify all read `docs/plans/<project>/…`.

**Impact.** In an existing project, a big feature planned later with plan-feature lands in `docs/plans/<feature>/features/`. `verify` drives only `docs/plans/<project>/features/*.md`, so that feature's scenarios are never driven, and run mode still reports every feature "proven".

**Why.** The template kept its per-feature folder name when feature files were added.

**Current code** (`plugin/skills/plan-feature/references/plan.md:3-6`)

```
Save to the plan folder named in `.agents/PROJECT.md`, or
`docs/plans/<feature>/plan.md`. The contract and the feature files sit next to
it: `docs/plans/<feature>/contract.ts` (or `openapi.yaml`) and
`docs/plans/<feature>/features/<slug>.md`.
```

**Proved by.** `plugin/skills/verify/SKILL.md:11-12`: "The feature map is the plan's feature files (`docs/plans/<project>/features/*.md`)". `greenfield-mode/SKILL.md:33` names `docs/plans/<project>/plan.md`.

**Fix options**

- **A (recommended).** verify reads `docs/plans/*/features/*.md` (as triage.md:15 already does). The template says `docs/plans/<project or feature>/`. Cost: 2 lines.
- **B.** Every plan goes to `docs/plans/<project>/`, with the plan file named by feature. Cost: one folder gets crowded over many plans.

**Test to add.** "verify's run mode lists feature files from every plan folder."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p214"></a>
## 214. A feature's status never reaches "merged" or "proven" · Later

**Context.** Each feature file has a Status line (`proposed · ready · building · review · merged · proven`) and a Trace that "the agent that did it" appends. The planned Workbench and the user read these to see where each feature is.

**Impact.** Only deliver-feature sets a status ("review"). No doc tells plan-feature to set proposed or ready, or the lead to set building or merged. verify, which proves the feature, may edit only Driving and Gotchas. So every feature shows "review" forever and has no verify trace line.

**Why.** The statuses were listed without giving each one an owner.

**Current code** (`plugin/skills/greenfield-mode/references/features.md:51-58`)

```
## Status

proposed · ready · building · review · merged · proven

## Trace

One line per phase, appended by the agent that did it: what ran, what it
found, how long.
```

**Proved by.** `plugin/skills/verify/SKILL.md:86-87`: "You may edit only the verify skill's own folder and the feature files' Driving and Gotchas sections." A grep for `merged|proven|ready|building` as a status in plan-feature, coordination and verify finds nothing.

**Fix options**

- **A (recommended).** Name the setter next to each value in features.md:
  - proposed and ready: plan-feature;
  - building and review: the feature agent;
  - merged: the lead at merge;
  - proven: verify.

  Let verify also edit Status and Trace. Cost: 3 lines.

**Test to add.** "After verify's run mode, every driven feature file shows Status proven and a verify line in Trace."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p215"></a>
## 215. The new-product design guide points at the old home of the model brief · Later

**Context.** greenfield.md is design-interface's guide for a new product's fair comparison between models. The model brief moved from greenfield-mode to design-interface in this range.

**Impact.** An agent looking for the brief opens `greenfield-mode/references/variant-brief.md`, which no longer exists. It also reads that greenfield-mode still owns part of the studio flow, which DIRECTION says it no longer does.

**Why.** The line sits outside the hunk that updated this file.

**Current code** (`plugin/skills/design-interface/references/greenfield.md:13-16`)

```
Up to three models each design the whole product, as `design-interface`
describes. Every model gets the same brief, screen list, data, taste log and
reference notes, filled in from greenfield-mode's `variant-brief.md`, and
designs freely: structure and look. The studio shows every screen at
```

**Proved by.** Glob `plugin/skills/greenfield-mode/**` has only SKILL.md, `references/{coordination,features}.md` and `agents/openai.yaml`. DIRECTION.md:108 says "The studio lives in `design-interface`, not `greenfield-mode`."

**Fix options**

- **A (recommended).** "…filled in from [variant-brief.md](variant-brief.md), and…". Cost: 1 line.

**Test to add.** "No file under plugin/ names greenfield-mode's variant-brief, studio, new-project or components references."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p216"></a>
## 216. README says every agent keeps the root status file current · Later

**Context.** README's Building section tells the user how progress is reported. greenfield-mode gives `STATUS.md` to the lead. The working agreement has other agents append to "the feature file or `STATUS.md` it worked on". Feature agents may edit only their Owns list.

**Impact.** A user or agent reading the README expects each feature agent to update root `STATUS.md` from its worktree. If they do, every merge conflicts on that file, and the Owns rule refuses the diff.

**Why.** The README flattened "lead keeps STATUS.md; each agent traces its own file" into one sentence.

**Current code** (`README.md:122`)

```
- Every agent keeps `STATUS.md` current and leaves a trace of what it ran, so you follow the run without reading transcripts.
```

**Proved by.** `plugin/skills/greenfield-mode/SKILL.md:9-10`: "You keep `STATUS.md` at the project root current". `INSTRUCTIONS.md:108-109`: "Every agent appends its own trace line to the feature file or `STATUS.md` it worked on." `deliver-feature/SKILL.md:33-34` (Owns only).

**Fix options**

- **A (recommended).** "- The lead keeps `STATUS.md` current; every agent appends a trace line (what it ran) to its own feature file, so you follow the run without reading transcripts." Cost: 1 line.

**Test to add.** "README, greenfield-mode and INSTRUCTIONS name the same owner for STATUS.md."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p217"></a>
## 217. The repo profile points at a status file this range deleted · Later

**Context.** `.agents/PROJECT.md` is the repo's own facts for any agent working on the kit.

**Impact.** An agent told that "`STATUS.md` tracks the current rebuild" looks for it, finds nothing, and may create a new one or report the repo as inconsistent.

**Why.** The line was added in the same range that deleted `STATUS.md`.

**Current code** (`.agents/PROJECT.md:21`)

```
- `docs/plans/` holds this repo's own plans. `STATUS.md` tracks the current rebuild.
```

**Proved by.** plan.json → skipped: `{ "path": "STATUS.md", "why": "deleted" }`. Glob `STATUS.md` at the repo root finds nothing.

**Fix options**

- **A (recommended).** "- `docs/plans/` holds this repo's own plans." Cost: 1 line.

**Test to add.** "Every file PROJECT.md names exists."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p218"></a>
## 218. README's pipeline leaves out the plan review and the whole-app review · Later

**Context.** README's pipeline block is the first thing a user reads. greenfield-mode, DIRECTION and plan-feature run the review before the plan is approved and on the whole app before verify.

**Impact.** A user following the README expects no review of the plan and goes straight from merge to verify. They don't expect `reviews/<date>-plan/` or the stage 6 review to tick.

**Why.** Only the stage 5 review made it into the README diagram.

**Current code** (`README.md:28-33`)

```
3B Plan      with you, one decision at a time ──► plan.md + API contract + features/*.md
             join: plan approved and web/ accepted
4 Foundation the lead alone: schema, auth, API skeleton, shared/ + INDEX.md
5 Features   waves of agents, one per feature file, each in its own worktree
             scenarios fail first ──► tests + code ──► green ──► review ──► the lead merges one at a time
6 Prove      verify drives every feature's scenarios on the merged app ──► demo
```

**Proved by.** `plugin/skills/greenfield-mode/SKILL.md:33` ("the `review` skill on the plan files writes `reviews/<date>-plan/`") and `:37` ("`review` on the whole app, then `verify`"). DIRECTION.md:95-100.

**Fix options**

- **A (recommended).** 3B: "… + features/*.md ──► review (you tick) ──► you approve". 6: "review on the whole app ──► verify drives …". Cost: 2 lines.

**Test to add.** "README, DIRECTION and greenfield-mode list the same four review points."

**Decision.** [ ] fix now: A · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

<a id="p219"></a>
## 219. The repo's studio-page check asks for a 1024-wide capture that is never taken · Later

**Context.** PROJECT.md's check for a studio page change: capture it with `--studio` and look at three widths.

**Impact.** The agent can't find a 1024 capture. It either reports the check as incomplete every time or takes a manual screenshot outside the script.

**Why.** The line was rewritten in this range but kept an old width list.

**Current code** (`.agents/PROJECT.md:56`)

```
3. For a change to the studio page, start the PartyFox studio, capture it with `--studio`, look at the captures at 1440, 1024 and 390, and ask the `design-critic` agent to score them. Under 70 means revise first.
```

**Proved by.** `plugin/skills/design-interface/scripts/capture.mjs:39-40` only pushes `studio…__1440` and `studio__390` jobs.

**Fix options**

- **A (recommended).** "look at the captures at 1440 and 390". Cost: 1 line.
- **B.** Add a 1024 job to capture.mjs. Cost: 1 line of code, one more screenshot per run.

**Test to add.** "Every width PROJECT.md asks to inspect is a file capture.mjs --studio writes."

**Decision.** [ ] fix now: A / B · [ ] later · [ ] not a problem · [ ] explain more

**Status.** open

## Not run

- No shell in this session, so none of these ran: `ls`, `test -e`, `claude plugin validate ./plugin --strict`, `claude plugin validate . --strict`, `python3 tools/check_manifests.py`, `python3 tools/check_agnostic.py`. Relied on tools.txt (all passed). Symlinks were checked by reading through them.
- #200: `node plugin/skills/design-interface/scripts/test_app.mjs --keep`, then `python3 plugin/skills/design-interface/scripts/promote_variant.py <kept> --check` twice.
- #206: `python3 plugin/skills/design-interface/scripts/check_tokens.py --project <kept>/studio/project.json <kept>/studio/candidates`.
- #209: `git ls-files .codex` and `python3 plugin/skills/setup-project/scripts/codex_agents.py --project . && git diff .codex/`.
- #202: two worktrees, write a request in one, `ls docs/plans/*/requests/` in the other.
- The review-skill side of #204 (checklist, SKILL.md) belongs to the review reviewer. Only the coordination claim is judged here.

## Already there

- `plugin/skills/shadcn/SKILL.md:16-18`: `` !`npx shadcn@latest info --json` `` is Claude Code-only injection. In Codex and Cursor it is literal text, so "The JSON above" is empty. This conflicts with "everything in plugin/ works in all three".
- `plugin/skills/shadcn/cli.md:238-250`: the `build` (custom registry) command survives the registry removal. Harmless, but off-scope for "trimmed to React needs".
