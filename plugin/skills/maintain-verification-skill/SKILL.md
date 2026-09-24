---
name: maintain-verification-skill
description: Check that a project's verify skill and feature map still match the app - read every feature's code, drive every feature once live, and fix only the skill's own files. Use after features change, or for "audit the verify skill".
---

<!-- Adapted from pstack (github.com/cursor/plugins, MIT, (c) 2026 Lauren Tan). -->

# Maintain a verification skill

A feature map goes stale as soon as the app changes. This pass keeps a skill
made by `create-verification-skill` true. The unit is the feature: read every
feature's code, and drive every feature once in the running app.

## Outcome

End with exactly one, and say which:

- **clean:** every feature was read and driven; nothing to change.
- **changed:** one set of proven fixes to the skill's own files.
- **blocked:** say exactly what stopped the pass.

## What you may edit

Only the verify skill's own folder: its `SKILL.md`, `features/`, and the
scripts it owns. Never product code. Some of those scripts may be shared with
the test suite (for HRise, `e2e/scripts/run.mjs` also runs CI): after changing
one, run the full suite too. When the app no longer does what the map
says, decide which it is:

- The map is out of date: fix the map.
- The app is broken: report it to the user, and keep the map as it was.

## Steps

1. **Find the skill.** Usually `.agents/skills/verify-*/`. None: stop and point
   to `create-verification-skill`. Several: ask which.
2. **Tidy the index.** The features README lists exactly the feature files
   that exist. Fix missing, extra or dead entries.
3. **Read the code, in parallel.** One read-only helper per feature file. Each
   explains how the feature works from the code, flags where the map is out of
   date with `file:line`, and returns one recipe for driving it. Helpers never
   drive the app or edit files.
4. **Merge.** Every feature file has a returned summary. Spot-check the flagged
   drift. Look at recent commits for user-facing features missing from the map;
   name the source file before calling one missing.
5. **Drive it live.** Required even when the code looks clean. Use the skill's
   own Launch steps. Drive every feature at least once. Throughout:
   - Run doctor before the first drive and after any failed drive.
   - Evidence survives every cleanup. Check it at its folder; don't assume.
   - Stop what a failed try started before the next try.
   A doctor failure caused by the skill itself is drift: fix it and retry
   once. A feature you can't reach needs the missing requirement named (role,
   setting, data) and the route you tried.
6. **Sort what you found.**
   - Wrong or missing description: fix the map.
   - Working behavior the scripts can't drive: fix the script, then drive it
     live again.
   - Broken app behavior: report it; not part of this change.
7. **Finish.** changed: re-read every changed file and hand over one change.
   clean or blocked: no change; report the outcome and what was covered.

Keep short run notes (features covered, unreachable ones, drift found) in
`temp/verification/`. Don't commit them.
