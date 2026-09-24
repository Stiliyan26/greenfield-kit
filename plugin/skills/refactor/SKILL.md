---
name: refactor
description: Change the structure of code without changing what it does - lock in current behavior first, delete before adding, move in small steps, and prove nothing changed. Use for renames, moves, splits, merges and folder reorganizations.
---

<!-- Adapted from pstack's refactoring playbook (github.com/cursor/plugins, MIT, (c) 2026 Lauren Tan). -->

# Refactor

The structure changes. The behavior doesn't. If you find a bug or a missing
feature on the way, note it and handle it separately, after the refactor.

1. **Lock in current behavior first.** Find the tests that cover the area. If
   none do, add one that records today's output (a test or a saved API
   response) before moving anything. A type check and lint don't lock
   behavior.
2. **Name the target shape.** Say what the folders, files and types should
   look like if you built them today, per `.agents/guides/conventions.md`.
   The change must remove branches, duplicates or layers, not add indirection.
3. **Delete before adding.** In the code you're restructuring, remove dead
   code, wrappers that only pass the same arguments on, and unused exports
   first (`npm run knip` helps find them). List dead code elsewhere in the
   report instead of deleting it. Then build the new shape on the smaller
   base.
4. **Move in small steps.** Keep the tests green after each one. When an API
   or import path changes, update every caller and delete the old path in the
   same change. No re-export shims or parallel old and new paths. After a
   rename, search for the old name in strings, docs and tests too.
5. **Prove nothing changed.** Run the tests from step 1, `npm run gates`, the
   full browser suite (`npm run test:e2e`), and for screens a `verify-hrise`
   drive of the affected flow.
6. **Keep it only if it's easier to read.** If a reader can't find "where does
   X come from" faster than before, undo it.

**Report:** what moved, the tests that held it, the proof it behaves the
same, and anything you undid.
