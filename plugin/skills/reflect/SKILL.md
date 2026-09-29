---
name: reflect
description: After a task that went badly or needed corrections, find what should change in this AI setup so it doesn't happen again, and propose the edits for the user to approve. Runs only when the user types /reflect.
disable-model-invocation: true
---

<!-- Adapted from pstack's reflect skill (github.com/cursor/plugins, MIT, (c) 2026 Lauren Tan). -->

# Reflect

1. **Find what went wrong** in this conversation: user corrections, failed
   checks, steps redone, wrong guesses. Skip one-offs. One odd session is not
   a rule.
2. **For each lesson, pick the strongest fix,** in this order:
   - A check that fails automatically: a lint rule, a script in `gates`, a
     type.
   - A line in the skill or guide that was followed and still led here.
   - A new line in `.agents/INSTRUCTIONS.md`, only if it applies to every task.
3. **Keep only edits that would change a future decision.** Drop the rest.
4. **Show the list and wait.** For each: the lesson, the evidence (what
   happened in this chat), the exact edit and the file. Change nothing until
   the user picks which to apply.
5. **Apply the approved ones.** Update `.agents/README.md` if a skill or file
   was added or renamed, and run whatever check the project has for its agent
   setup.

**Reply:** applied edits, one line each, and the ones dropped with the reason.
