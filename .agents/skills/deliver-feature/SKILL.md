---
name: deliver-feature
description: Take a big feature from an agreed plan and design to tested, reviewed code, in small steps. Use for work across frontend and backend or with several steps, not small edits.
---

# Deliver a feature

Read the project's instructions when present and the agreed plan, design and API. If a
decision is missing, use `plan-feature` or `design-interface` for that part
only. Don't redo work that's already approved. Follow any project-specific
rules for retries, review and the final report.

1. **Plan the tasks.** Write a short list of small tasks in the order they
   depend on each other, using [task.md](references/task.md). Each task says
   which requirement it meets, where the code goes, what it reuses, what it
   won't do, and how it's checked.
2. **Decide how you'll know it works, before coding.** Write the scenarios a
   user or API call can observe. API tests can come before the code; unit and
   component tests can grow with it. A test that fails only because the code
   doesn't exist yet proves nothing.
3. **Build in thin slices.** Each slice works end to end. Follow the project's
   coding conventions when present. Run tasks in
   parallel only when they don't depend on each other and don't touch the same
   files.
4. **Check once, at the end.** Each helper runs its own small checks. Put all
   the pieces together, then run the project's verification checks once.
   After any fix, run again the checks
   it affects.
5. **Review, then report** the feature as ready, blocked, or not checked.

## When you're stuck

Hand over the goal, the code change, the real error output, what you tried,
what you still suspect, and what the environment needs. Handing it to someone
else doesn't give the task more tries.

## Changing agreed tests or contracts

Change an agreed API, contract or test only when it's shown to be wrong, or the
user changed the requirement. Say why and which requirements it affects. Never
weaken a failing test just to make it pass.
