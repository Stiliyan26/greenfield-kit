# Direction

Where greenfield-kit is going, every decision behind the current pipeline,
and how it joins up with Call OS. Written so a new session can continue
without this history. Facts about the current state are in
`.agents/PROJECT.md`; the skills themselves are the source of truth for how
each stage runs.

## The one idea

A solo services builder should be able to turn a client conversation into a
proven app with their time spent only on decisions: what the client meant,
which design, which plan, whether it's done. Everything else is agents, and
every step leaves evidence: a citation, a capture, a check, a trace.

## The whole loop

```
 CALL OS (Business-Freedom-OS)                GREENFIELD-KIT (this plugin)
 the evidence layer                            the build pipeline

 client call ─► transcript (who said what,     BRIEF ─► FRAME ─► DESIGN ─► APPROVE
   timestamps) ─► analysis ─► feature lock ─►     ─► PLAN ‖ PROMOTE ─► FOUNDATION
   ICP ─► BRIEF.md with citations                 ─► FEATURES (waves) ─► PROVE ─► demo
        ▲                                                            │
        └──────────── delivery call ─► new feature lock ◄────────────┘
```

Call OS produces the input: a brief whose confirmed lines each cite a call
and a timestamp. The kit consumes it and produces the app. The delivery call
goes back into Call OS, and the loop runs again. Today the join is manual:
the user gives the evidence in chat when starting `greenfield-mode`.

## The pipeline, stage by stage

```
 0  EVIDENCE     calls, notes, the user's words ──► BRIEF.md
                 confirmed lines cite their source (call + timestamp, a message) · suggested · unknown
                        │
 1  FRAME        roles · screen list · data shapes · difficult states · sample data
    you + AI     feasibility (privacy, integrations). Ask only what changes the design.
                        │
 2  DESIGN       one model (or up to three) designs every screen in React + shadcn, in the studio
    studio       3 sizes · light and dark · sample data · checks + design critic ──► you tune, comment
                 ══════════════ APPROVE ══════════════
                 → DESIGN.md · design/{fonts,tokens,shadcn}.css · the approved code IS the front end
                        │
            ┌───────────┴────────────┐
 3B PLAN     with you, one decision   │  3A PROMOTE (background agent)
    you +    at a time                │  the approved variant becomes web/, one route per screen,
    Agent B  → plan.md                │  pixel-checked against the studio (3 sizes × light/dark, <1%),
             → API contract           │  motion pass with design-animations. Sample data, no API yet.
             → features/*.md          │
             → review, plan mode      │  a screen change during planning → back to the studio,
             → you approve            │  re-approve, promote again. Never straight into web/.
            └───────────┬────────────┘
                        │  JOIN: plan approved AND web/ accepted
 3C FAN-OUT SETUP  accept the feature split · model per agent · full-stack or FE+BE · agents at once · runtime
                        │
 4  FOUNDATION   the lead alone, sequential: DB schema · auth · API skeleton from the contract
                 shared/ (entities, helpers, UI parts used by ≥2 features) + shared/INDEX.md
                 the app shell = the promoted web/
                        │
 5  FEATURES     waves, one agent per feature file, own worktree and branch each
                 agent: read INDEX → scenarios fail first → tests + code → green → review → report
                 missing shared thing → requests/<feature>-<name>.md → lead adds, pushes → agent rebases
                 lead: answers requests; merges one at a time: rebase → all tests → review → merge
                        │
 6  PROVE        review on the whole app → the verification skill drives every feature's scenarios → evidence
                 done-when ticked · client demo
                        │
 7  LOOP         delivery call → /process-call → new feature lock → new feature file → back to 3
                 (or 2 when a screen changes)
```

### What the user is asked, per stage

Two kinds: fixed questions every project gets, and conditional ones the
brief triggers. Never ask what the brief, the evidence or the code already
answers. Planning asks one decision at a time; building asks almost nothing.

| Stage | Fixed | Conditional (only if the brief raises it) |
| --- | --- | --- |
| 0 Evidence | Which calls, notes or messages are in scope; keep or drop an item with no evidence | — |
| 1 Frame | Roles, first device, brand or examples liked and disliked, language and scripts | Sensitive data (recordings, money): local or cloud; integrations to reach; multi-tenant later |
| 2 Design | How many models design and which ones; then only studio actions: pick, tune, comment, Approve | What a model reports missing in the data; a taste line after a repeated reject |
| 3B Plan | Mode (you lead / the AI proposes); then, biggest first: data model, storage, auth and roles, API shape, external services, timezone, v1 scope; per screen: how data loads, what is optimistic, validation and errors, empty and denied states, route guards | Each real choice the brief creates (a transcription provider, video storage, search), always with 2–3 options, the tradeoff, a recommendation; offline, keyboard-first |
| 3C Fan-out | Accept the split; model per agent; full-stack or FE+BE; how many agents at once; runtime | Merge a feature that is too small, split one that is too big; which features the client sees first |
| 4 Foundation | Nothing | A contract conflict; a shared part the plan missed |
| 5 Features | Only blockers: a request the lead can't answer from the plan, a done-when line that turned out impossible | — |
| 6 Prove | Which features to demo; accept, or send named done-when lines back | A scenario provable only with real client data or access |

### Where the review skill runs

| Stage | Review |
| --- | --- |
| 2 Design | the design critic (scores captures; under 70 or any 1 means revise first) |
| 3B Plan | `review` in plan mode on plan + contract + feature files, before the user approves |
| 5 Features | `review` by the feature agent on its own diff before it reports done; `review` at every merge by the lead |
| 6 Prove | `review` on the whole app, before the verification run and the demo |

## The decisions behind it, and why

| Decision | Why |
| --- | --- |
| **The approved design is the code.** Models design in React + shadcn inside the studio; approval promotes that code; a pixel check proves it. | The old flow drew HTML mock-ups and then rebuilt every part in React (Call OS: 10 screens → 89 parts, an hour of agent time, seven places where the rebuild had to guess). Building twice is waste and drift. |
| **The studio keeps its live tokens.** shadcn's variables point at the studio's tokens, so palettes, tuning and dark work with no rebuild. | Exploration stays fast; what the user sees is what promotion ships, because the approved `design/shadcn.css` uses the same mapping. |
| **The studio lives in `design-interface`, not `greenfield-mode`.** | One skill owns one tool. `greenfield-mode` is the pipeline only. |
| **Design before plan, frame before design.** | The plan walks each approved screen action by action; planning during design means re-planning after every change. Roles, screens and data shapes must exist before the design, so framing is the part of planning that comes first. |
| **Approve is the fork.** Promotion in the background, planning with the user. | Promotion needs no decisions; planning needs only the user. Neither waits for the other. |
| **A contract joins them.** The plan outputs TypeScript types / OpenAPI, not prose. | Backend and front-end wiring can then be built apart, by different agents, and still meet. |
| **Feature files are the hinge.** One file per feature: requirement and done-when IDs, screens, owns, uses, depends on, scenarios, driving, gotchas. | The same file serves the plan (split), the build (the agent's brief and ownership) and the proof (`verify`'s map). Written once. |
| **Foundation before fan-out.** The lead builds the schema, auth, the skeleton, `shared/` and `INDEX.md` alone. | Otherwise five agents each create the schema and the helpers, and the merge is a mess. |
| **Worktrees, fixed, for anything that writes code.** A shared directory only for read-only agents. | Two agents in one checkout overwrite each other; tests run against half-written code; no feature can merge alone. Every source in 2026 lands on worktree-per-task. |
| **Coordination is files and git.** Feature files, ownership lists, `requests/`, merge order. | The kit runs in three CLIs and the runtimes are experimental and change monthly. A task list or messaging is optional on top. |
| **The runtime is a question at fan-out.** Claude Code agent teams, Codex multi-agent, Cursor Projects, plain worktrees. Defaults: teams in Claude Code, worktrees elsewhere. | Teams give a lead, a task list and messaging (best fit); Codex caps at 6 threads; Cursor Projects merges in its own way and hasn't published pricing; plain worktrees work everywhere. |
| **Shared code: the lead defines, agents look up, gaps go through requests.** `INDEX.md` before any helper; never a local copy; a merge that duplicates is refused. | Duplication happens when two agents are allowed to write the same kind of code. Ownership prevents it; messaging only helps with the leftovers. |
| **E2E: written before, green per feature, run together after.** | Scenarios come from done-when lines in the plan, so the agent never defines its own done. Running them all on the merged app catches feature A breaking feature B. |
| **Reporting: digest first, `STATUS.md`, a trace.** | The user reads AI all day; reading is the cost. They want to see what an agent did (tools, Playwright, agents spawned, tests run), not its reasoning. |
| **Review: one reviewer per feature that proves by running; the report is files the user ticks; fix agents from the ticks.** | The HRise review used 15 agents, paraphrased the snippets, asked nothing and ran nothing; the user rewrote it by hand. One reviewer per feature can read a feature end to end and run it; a file per feature with the real code, options and tick boxes lets the user decide, and the ticks tell the fix agents what to do. |
| **Kept:** `design-animations` (a motion pass on the promoted screens), `shadcn` trimmed to React needs, `review`, `write-code`, `refactor`, `setup-project`, PartyFox example. **Removed:** `bro`, `reflect`, the components gallery, shadcn chat/registry/MCP/evals. | Keep what a stage uses. |

## What the kit is now (0.10.4)

- `design-interface`: the studio engine, the studio app template (Vite +
  React + Tailwind 4 + shadcn, every part installed), the scripts
  (`init_studio.py`, `check_variant.py`, `check_components.mjs`,
  `check_tokens.py`, `capture.mjs`, `promote_variant.py`,
  `compare_screens.mjs`, `test_studio.mjs`, `test_app.mjs`), and the
  references (studio.md, new-project.md, variant-brief.md, promote.md,
  choose-a-look.md, visual-quality.md, greenfield.md).
- `greenfield-mode`: the pipeline (SKILL.md) plus `features.md` and
  `coordination.md`.
- `plan-feature`: two modes; outputs plan.md, the contract, the feature
  files; asks the per-screen behaviour questions; plan-mode review before
  approval.
- `deliver-feature`: the feature agent's brief.
- `review`: gates, then one reviewer per feature that proves by running; writes
  `reviews/<date>-<target>/` (README plus a file per feature) for the user to
  tick; fix agents work from the ticks; the reviewer re-proves each fix.
- `create-verification-skill` / `maintain-verification-skill`: create the
  project's verify skill once; later audit it against the code and keep the map true.
- `setup-project`: the working agreement (digest-first replies, `STATUS.md`,
  the trace) and the Codex/Cursor install.
- Tested end to end: the engine (`test_studio.mjs`, 97 checks) and the app
  flow (`test_app.mjs`, 17 checks: init, a React variant, build, checks,
  approve, promote, compare). Not yet run on a real project: the plan with
  feature files, the fan-out, requests, the verification skills.

## Next

1. **Run it for real on Call OS** (`Business-Freedom-OS/call-os/README.md`
   has the order). Every gap becomes a general fix here, proven by the
   checks. Expected gaps: the plan-mode review on feature files, the first
   fan-out with agent teams, the request loop, the verification skills reading feature
   files, the ownership check at merge (today a rule the lead applies by
   reading the diff; may become a script).
2. **Speed without losing quality.** The lead (a strong model) writes briefs,
   integrates, runs the checks and reports; workers run in parallel in their
   own worktrees: a faster model for fully specified work (path rewrites,
   docs from an outline, boilerplate, tests from a spec), the strong model
   for judgment work (engine code, briefs). Quality lives in the checks and
   the review, not in which model typed the file. A serial debug loop
   (build → test → fix) doesn't parallelise; there the win is a faster loop
   (cache npm installs between test runs).
3. **The join with Call OS.** `greenfield-mode` stage 0 reads a brief that
   Call OS wrote instead of chat text: `BRIEF.md` with source links that
   open the call at the timestamp. Then feature locks from Call OS become
   feature files directly, and the delivery call closes the loop without
   retyping. An MCP or a file contract, decided when Call OS has an API.
4. **The Workbench.** A local app over Claude Code, Codex and Cursor that
   shows the pipeline as it runs: stages as boxes, agents as tiles with their
   `STATUS.md` and trace, decisions waiting on the user, the studio
   embedded. The plugin stays the engine; the app is a shell that reads the
   same files the agents write, so nothing depends on it. Views, in order:
   a read-only run view from `STATUS.md` and the feature files; starting and
   steering agents from it; the plan canvas (the user's answers fill
   diagrams: tables, endpoints, screens, tasks); Call OS's inbox and Ask
   inside it.

## Selling it

Later, and only after it has built real client apps and other builders ask.
The services-first rule in Business-Freedom-OS holds: productise when three
clients ask for the same thing.
