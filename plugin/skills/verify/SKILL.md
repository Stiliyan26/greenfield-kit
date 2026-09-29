---
name: verify
description: Prove the real app works the way a user uses it - start it, drive every feature from the plan's feature files, save evidence, and keep those files true as the app changes. Use after features merge, before a demo, for "verify the app", or for "audit the verify skill".
---

<!-- Adapted from pstack (github.com/cursor/plugins, MIT, (c) 2026 Lauren Tan). -->

# Verify the app

Every project needs one scripted way to start the real app, use each feature
the way a user would, and save proof. The feature map is the plan's feature
files (`docs/plans/<project>/features/*.md`): their Scenarios, "How to get to
it", "Driving it" and Gotchas sections. This skill writes the project's
`.agents/skills/verify-<app>/SKILL.md` once (how to launch, check and drive
this app), then runs and maintains it. [example.md](references/example.md)
shows a finished one; copy its shape, never its values.

## Mode: create (no `verify-<app>` skill yet)

Answer these from the code. Ask the user only what the code can't tell you.

- **Surface:** what does a user touch? Web UI, API, CLI. Pick the main one
  and note the others.
- **Start:** how does the app start locally? Prefer the repo's own commands.
  Note ports, settings, seed data and logins.
- **Drive:** how can an agent use it from a script? Existing tools first
  (Playwright specs, API test helpers). Only then a generic one.
- **Proof:** what can be saved? Screenshots, response bodies, exit codes,
  database rows, logs.
- **Isolation:** can two copies run side by side? If not, say so in the
  skill. Refusing to drive a shared copy beats breaking someone's session.

If the app doesn't start as it is, fix that first or report exactly why.

Write `.agents/skills/verify-<app>/SKILL.md` with `name: verify-<app>` and a
`description` that names the app and the surface. Fill every section from
what you found, no placeholders:

- **Launch:** the exact start command, how to tell it's ready, how to stop it.
- **Doctor:** one read-only check that this copy is worth driving: process
  up, right build, our ports, login works. Run it first, and again whenever
  something looks off.
- **Drive:** real selectors and commands from this repo. Prefer stable
  handles: roles and names, labels, routes. Never screen positions.
- **Evidence:** what to save and where. The real user path, not test-only
  shortcuts. Save the action and the resulting state, not only the last
  screen. Check side effects as well as the screen.
- **Cleanup:** stop only what this run started, never by process name.
  Cleanup removes the app and scratch data, never the evidence.
- **Features:** point at `docs/plans/<project>/features/`. No second map.

Then run it once: launch, doctor, drive ONE feature, save evidence, clean up.
Check the evidence is still there. A skill that was never run is a draft.

## Mode: run (the skill exists; after a merge or before a demo)

1. Launch and doctor.
2. Drive **every** feature file's scenarios on the merged app, in order.
   Save evidence per feature under `temp/verification/<run>/<feature>/`.
3. Report one line per feature: proven, failed (which scenario, what was
   seen), or unreachable (the missing role, setting or data, and the route
   tried). A failed scenario is a bug for the lead, not a map edit.
4. Clean up. Evidence stays.

## Mode: maintain (the app changed; "audit the verify skill")

The unit is the feature. End with exactly one outcome and say which:
**clean** (every feature read and driven, nothing to change), **changed** (one
set of proven fixes to the skill's own files and the feature files' Driving
and Gotchas sections), or **blocked** (what stopped the pass).

1. Tidy: every feature file is real and listed; no dead entries.
2. Read the code, in parallel: one read-only helper per feature file. Each
   explains how the feature works from the code, flags where the Driving
   section is out of date with `file:line`, and returns one recipe for
   driving it. Helpers never drive the app or edit files.
3. Merge the summaries. Spot-check the flagged drift. Look at recent commits
   for user-facing features with no feature file; name the source file before
   calling one missing.
4. Drive every feature live, as in run mode. A doctor failure caused by the
   skill itself is drift: fix it and retry once.
5. Sort: wrong or missing description → fix the file; working behaviour the
   scripts can't drive → fix the script and drive again; broken app
   behaviour → report it, not part of this change.

You may edit only the verify skill's own folder and the feature files'
Driving and Gotchas sections. Never product code, never a Scenario. Keep
short run notes in `temp/verification/`; don't commit them.
