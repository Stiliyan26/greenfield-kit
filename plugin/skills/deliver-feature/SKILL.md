---
name: deliver-feature
description: Build one feature from its feature file - scenarios first, then tests and code until they pass, in your own worktree, owning only the files the feature lists, reusing shared parts and requesting what is missing. Use for a feature from an approved plan, or a big change across frontend and backend; not for small edits.
---

# Deliver a feature

You build one feature, usually as one of several agents running at the same
time. Read the feature file (`docs/plans/<project>/features/<slug>.md`), the
plan and its contract, `shared/INDEX.md`, and `DESIGN.md`. If a decision is
missing, don't guess and don't ask the user mid-feature: write the question
in your report, and the lead updates the plan. Don't redo work that's
already approved.

**Code.** Where code goes and how it's written is the `write-code` skill. Read
it before the first file, and run its ESLint preset on the files you touched
before you call a slice done.

**Design.** Build screens from the promoted routes in `web/`, the parts in
`web/src/design/parts/` and the shadcn parts `DESIGN.md` lists, with
`design/tokens.css` names: every color, font and radius is a `var(--…)` or a
shadcn class name from that file. Don't invent a look or copy raw values.
Before a UI task is done, run
`python3 <design-interface>/scripts/check_tokens.py --tokens design/tokens.css <changed files>`
and fix what it prints. `<design-interface>` is that skill's folder, in
`.agents/skills/` or `~/.agents/skills/`. If a task needs a screen or a part
the approved design doesn't cover, stop that part and report it; it goes
back to the studio.

## Rules while several agents build

- Work in your own worktree on your own branch. Never `git stash`.
- Edit only the files and folders your feature file's **Owns** list names.
  The lead refuses a diff that touches anything else.
- Never edit `shared/`, the schema or the contract. Before writing any
  helper or part, read `shared/INDEX.md`; if it's there, import it. If it's
  missing, write `docs/plans/<project>/requests/<feature>-<name>.md` with
  what you need, why, and the signature, then continue with the rest of the
  feature. Never keep a local copy of something that belongs in shared.
- When the lead answers a request, rebase and replace what you were waiting
  on.

## Steps

1. **Scenarios first.** The feature file's Scenarios section is your
   definition of done. Turn each one into an end-to-end test (the project's
   suite: `test:e2e`, `e2e/`, `playwright.config.*`) before writing code.
   They fail now; that's expected. Never weaken one to make it pass; a
   scenario that turns out wrong is a plan change and says so in your report.
2. **Plan the tasks.** A short list of small tasks in the order they depend
   on each other, using [task.md](references/task.md). Each task says which
   requirement it meets, where the code goes, what it reuses, what it won't
   do, and how it's checked.
3. **Build in thin slices** against the contract. Each slice works end to
   end. Unit and component tests grow with the code. Run tasks in parallel
   only when they don't depend on each other and don't touch the same files.
4. **Check once, at the end.** Run the project's checks from
   `.agents/PROJECT.md`: type check, lint, unit tests, then your scenarios.
   Drive the feature in a real browser the way a user would (the project's
   `verify-<app>` skill if it has one, otherwise Playwright), at desktop and
   phone. Save the action and the state it produced, not just the last
   screen, and check the side effects (saved rows, sent messages). Compare
   screens with the approved ones in `DESIGN.md`; ask the `design-critic`
   agent to score the captures. Under 70, or any score of 1, means fix it
   first. A check that was skipped, failed, or couldn't run is not a pass;
   name it.
5. **Fill in the feature file.** Write its Driving section (preconditions,
   each user action with its exact command and what you should see) and any
   Gotchas, so `verify` can run it later. Set Status to review.
6. **Review, then report.** Run the `review` skill in quick mode on your
   branch. Fix what it puts under "Act on"; say what you're leaving and why.
   Report: ready, blocked, or not checked, with the trace of what you ran.

## When you're stuck

Hand over the goal, the code change, the real error output, what you tried,
what you still suspect, and what the environment needs. Handing it to someone
else doesn't give the task more tries.

## Changing agreed tests or contracts

Change an agreed API, contract or scenario only when it's shown to be wrong,
or the user changed the requirement. Say why and which requirements it
affects, in the report; the lead updates the plan. Never weaken a failing
test just to make it pass.
