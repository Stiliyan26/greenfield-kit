---
name: write-code
description: How to write and place code in any project - the rules a person must judge (reuse, names, scannable files, impossible states, nothing left behind, the approved look), then the project's stack file for the folders, the server side, tests and the mechanical checks. Use when writing or changing application code.
---

# Write code

Every skill talks in roles: screen, server function, table, test layer, check command. The project's `.claude/stack.json` maps each role to a real tool and command. This skill holds the rules that need a person. It then opens the stack's own files for the rest.

1. **Read `.claude/stack.json`** in the project root. Its `name` picks a folder under `stacks/`. Its `commands` give the check, test and install commands. Its `paths` give the folders.

   Done when you know the stack name and the check command.

2. **Open the stack folder.** `stacks/<name>/` holds the folder layout, language style, UI rules, server rules, test layers and checks. Read the file that the task needs (table below).

   Done when you have read the file for the code you are about to write.

3. **Run the check-fix command (`commands.checkFix`) after each edit.** Run the check command before you call the task done. If it prints a problem, fix it and run it again.

   Done when the check command prints nothing.

The reason: a reviewer must not find what a tool can find. Break a rule below only with a reason, and say the reason.

## The rules that need a person

- **Reuse before you write.** Search for what exists, by name and by what it does. Read it and its callers first. A second copy drifts from the first.
- **Share only real sameness.** Keep apart two pieces that look alike but mean different things. Never merge different behaviors behind a true/false flag. Each caller then pays for the other's branch.
- **Write clean code.** Names, scannable files, narrow parameters and flat control flow follow [references/clean-code.md](references/clean-code.md). Read it with the stack file.
- **Fix a crash at its cause.** Add no null check only to silence it. Add no retry or cast that hides a deeper problem.
- **Check outside data once, where it comes in.** Parse server function input, URL params and env with the stack's validator at the edge. Cast a value only after you check it.
- **Make impossible states impossible.** Model a state as a union with a `kind` field, not a bundle of optional fields. A new case must not grow an if/else chain or add a flag that must stay in sync. Use a table, map or state machine instead.
- **Leave nothing behind.** When a function, helper or import path changes, update every caller in the same change. Delete the old one. Keep no re-export shim and no old path, because the next reader cannot tell which path is live.
- **Do not invent a look.** Take colors, fonts and radius from the approved design tokens (`paths.design` in the stack file). `DESIGN.md` says which parts come from the UI library. If the approved design lacks what you need, stop. Ask the user for the missing screen or part.
- **Add what the UI library has.** Add a primitive that the stack's UI library ships with its CLI, into the shared UI folder. When the library lacks a composition, build it once as a reusable part. Never write a third copy or a hand-written dropdown.

Reason: a tool cannot judge these rules. A person who reads the code can.

## Stacks

One folder per stack. The stack file's `name` picks the folder. Today:

| Stack           | Folder                                                  | Files                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node-tanstack` | [stacks/node-tanstack/](stacks/node-tanstack/README.md) | [structure](stacks/node-tanstack/references/structure.md), [typescript](stacks/node-tanstack/references/typescript.md), [react-components](stacks/node-tanstack/references/react-components.md), [react-screens](stacks/node-tanstack/references/react-screens.md), [backend](stacks/node-tanstack/references/backend.md), [tests](stacks/node-tanstack/references/tests.md), [checks](stacks/node-tanstack/references/checks.md) |

To add a stack, copy a folder and rewrite each file for the new tools. Add a row here.
