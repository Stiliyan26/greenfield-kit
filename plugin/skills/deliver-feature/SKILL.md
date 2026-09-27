---
name: deliver-feature
description: Take a big feature from an agreed plan and design to tested, reviewed code, in small steps. Use for work across frontend and backend or with several steps, not small edits.
---

# Deliver a feature

Read the project's instructions when present and the agreed plan, design and API. If a
decision is missing, use `plan-feature` or `design-interface` for that part
only. Don't redo work that's already approved. Follow any project-specific
rules for retries, review and the final report.

**Code.** Where code goes and how it's written is the `write-code` skill. Read
it before the first file, and run its ESLint preset on the files you touched
before you call a slice done.

**Design.** If the project has `DESIGN.md`, read it before any UI task. Build
screens from its approved screens and `design/tokens.css`: every color, font
and radius is a `var(--…)` from that file. Build screens from the
components already made from its Components table (shadcn/ui parts themed by
`design/shadcn.css`, and custom parts). If they don't exist yet, build them
first with `greenfield-mode`'s
[components.md](../greenfield-mode/references/components.md) and let the user
check the gallery. Don't invent a look, use a component
kit's own theme, or copy raw values. Before a UI task is done, run
`python3 <greenfield-mode>/scripts/check_tokens.py --tokens design/tokens.css <changed files>`
and fix what it prints. `<greenfield-mode>` is that skill's folder, in
`.agents/skills/` or `~/.agents/skills/`. If a task needs a look the approved
design doesn't cover, stop that part and use `design-interface`.

1. **Plan the tasks.** Write a short list of small tasks in the order they
   depend on each other, using [task.md](references/task.md). Each task says
   which requirement it meets, where the code goes, what it reuses, what it
   won't do, and how it's checked.
2. **Decide how you'll know it works, before coding.** Write the scenarios a
   user or API call can observe. API tests can come before the code; unit and
   component tests can grow with it. A test that fails only because the code
   doesn't exist yet proves nothing.
3. **Build in thin slices.** Each slice works end to end. Follow `write-code`
   and the project's own rules in `.agents/PROJECT.md`. Run tasks in parallel
   only when they don't depend on each other and don't touch the same files.
4. **Check once, at the end.** Each helper runs its own small checks. Put all
   the pieces together, then run the project's checks from `.agents/PROJECT.md`
   once: type check, lint, unit tests.
   - Look for an end-to-end suite before you say there isn't one: a `test:e2e`
     script, an `e2e/` folder, `playwright.config.*`, `cypress.config.*`. If
     one exists, run it and report its summary line.
   - Drive the feature in a real browser the way a user would — the project's
     `verify-<app>` skill if it has one, otherwise Playwright. Save the action
     and the state it produced, not just the last screen, and check the side
     effects (saved rows, sent messages) as well as the screen.
   - For screens, capture desktop and phone and compare them with the approved
     screens in `DESIGN.md`. Then ask the `design-critic` agent to score the
     captures. You may not grade your own screens. Under 70, or any score of 1,
     means fix it before the user sees it.
   After any fix, run again the checks it affects. A check that was skipped,
   failed, or couldn't run is not a pass; name it.
5. **Review, then report.** Run the `review` skill on the branch. For a
   small change, the single `reviewer` agent is enough; it can't run
   commands, so give it the check results you got. Fix what the review puts
   under "Act on"; for the rest, say what you're leaving and why. Then report
   the feature as ready, blocked, or not checked.

## When you're stuck

Hand over the goal, the code change, the real error output, what you tried,
what you still suspect, and what the environment needs. Handing it to someone
else doesn't give the task more tries.

## Changing agreed tests or contracts

Change an agreed API, contract or test only when it's shown to be wrong, or the
user changed the requirement. Say why and which requirements it affects. Never
weaken a failing test just to make it pass.
