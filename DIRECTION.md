# Direction

Where greenfield-kit is going, and how it joins up with Call OS. Facts about
the current state are in `.agents/PROJECT.md`; this file is about intent.

## The one idea

A solo services builder should be able to turn a client conversation into a
proven app with their time spent only on decisions: what the client meant,
which design, which plan, whether it's done. Everything else is agents, and
every step leaves evidence: a citation, a capture, a check, a trace.

## Two halves of one loop

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
the user pastes or points at the evidence when starting `greenfield-mode`.

## What the kit is now (0.9.0)

- The approved design is the code. A model designs in React + shadcn inside
  the studio; approval promotes that code into the app and a pixel check
  proves it. No component rebuild, no gallery.
- After approval the work forks: planning with the user, promotion in the
  background.
- Building is parallel by construction: one feature file per feature, one
  agent per feature in its own worktree, `shared/` owned by the lead,
  requests instead of shared edits, one merge at a time, waves from
  dependencies. Files and git coordinate; a runtime's task list or messaging
  is optional on top.
- Proof is the feature files' scenarios, written in the plan, green per
  feature, run together at the end by `verify`.
- The user is asked at fixed points, one decision at a time, and follows the
  run through `STATUS.md` and traces, not transcripts.

## Next

1. **Run it for real on Call OS.** Every gap becomes a general fix here.
   Expected gaps: the plan-mode review on feature files, the first fan-out
   with agent teams, the request loop, verify reading feature files.
2. **The join with Call OS.** `greenfield-mode` stage 0 reads a brief that
   Call OS wrote, instead of chat text: `BRIEF.md` with source links that
   open the call at the timestamp. Then feature locks from Call OS become
   feature files directly, and the delivery call closes the loop without
   retyping. This is an MCP or a file contract, decided when Call OS has an
   API.
3. **The Workbench.** A local app over Claude Code, Codex and Cursor that
   shows the pipeline as it runs: stages as boxes, agents as tiles with their
   `STATUS.md` and trace, decisions waiting on the user, the studio embedded.
   The plugin stays the engine; the app is a shell. It reads the same files
   the agents write, so nothing depends on it. Views, in order: a read-only
   run view from `STATUS.md` and the feature files; then starting and
   steering agents from it; then the plan canvas (the user's answers fill
   diagrams: tables, endpoints, screens, tasks); then Call OS's inbox and
   Ask inside it.

## Selling it

Later, and only after it has built real client apps and other builders ask.
The services-first rule in Business-Freedom-OS holds: productise when three
clients ask for the same thing.
