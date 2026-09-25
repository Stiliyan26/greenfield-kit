# Working agreement

These rules apply in every project. This project's facts, commands and paths
are in `.agents/PROJECT.md`.

## Talking to the user

- Plain words, like one person to another. If you need a technical term, say
  what it means.
- Answer or result first. Details after, only if needed.
- Keep it short and say each thing once. Lists as bullets, one per line.
- Ask only when the answer would change the result a lot. Keep working on other
  parts while you wait.
- Don't ask again for permission the user already gave.

## Writing documents

For plans, READMEs, PR descriptions and skill files:

- Use the plain word: "use", not "leverage" or "utilize".
- Say who does what: "the server checks the role", not "the role is checked".
- No filler like "it is important to note" or "in order to".
- Name the file, command or number, not "the platform" or "the toolchain".
- One idea per sentence.

## Show where facts come from

When an answer depends on a fact, list where it came from under **Sources** at
the end, one short line each:

- Code: file and line, e.g. `src/orders/order.service.ts:42`.
- Docs: link plus one short quote. Prefer official docs over blogs and forums.
- Ran it: the command and what it printed.
- Memory: say "from memory, not checked". Never pass a guess off as checked.

## Before changing code

- Look for what already exists, by name and by what it does. Read it and the
  places that use it before reusing it.
- Follow the `write-code` skill for where code goes and how it's written, and
  run its ESLint preset on the files you touched. Keep the app's existing look;
  don't invent a new visual style for an ordinary feature.
- Stay within what the user asked. If something else needs changing, say so
  instead of doing it. Every changed line should trace back to the request.
- Remove imports and functions your own change left unused. Mention older dead
  code instead of deleting it.
- Ask first before sending messages, publishing, deleting data, or running
  migrations on a real database.
- Never show secrets or open files that hold them (like `.env`). Never guess
  passwords. Don't edit generated files or installed packages.

## Doing the work

- Pick the recipe for the task: new product or full design restart →
  `greenfield-mode`; big feature → `plan-feature` if there's no plan yet, then
  `deliver-feature`; new screen or look within an agreed product →
  `design-interface`. A question only → answer it read-only, with sources,
  and change no code.
- Copy the recipe's steps into your to-do list. A step you skip stays there
  with `skip: <reason>`.
- Work in small steps that each work on their own.
- Share code only when the pieces really mean the same thing, not just because
  they look alike.
- Run the project's checks from `.agents/PROJECT.md`: type check, lint, unit
  tests. A check that was skipped, failed, or couldn't run is not a pass; say
  so.
- Look for an end-to-end suite before you say there isn't one (`test:e2e`,
  `e2e/`, `playwright.config.*`, `cypress.config.*`). If one exists and the
  change could affect it, run it and report the summary line.
- For a change to a screen or a flow, drive it in a real browser with
  Playwright the way a user would, and save the screenshots. Code that
  compiles, or one screenshot of one state, doesn't prove a feature works.
  If the project has a `verify-<app>` skill, use it.
- Keep screenshots and test output in the project's evidence folder until the
  user has seen them. Don't delete them when you finish.
- If the same fix fails twice, stop. Explain what's blocking and show the
  evidence instead of trying the same thing again. When two fixes built on
  the same idea failed, question that idea before a third.
- Long unattended run (for example Claude Code's `/loop`): first write "done" as a check that can
  pass or fail. Each round, make one change, check it, keep it or undo it.
  Log each decision in `temp/verification/<run>/decisions.tsv` (time,
  decision, why, evidence, result). Never loosen the goal to finish.
- For a big or risky change, have the `reviewer` agent check it when you can.
- Start helper agents yourself when it helps: for parts that don't depend on
  each other, or a big search. Keep work that needs the user in the chat.

## Finish

After a task that changed files, end with a report readable in under a minute:

1. **What it does now**: one or two sentences, for a user, not a coder.
2. **Files touched**: one bullet each, with a few words on why.
3. **Impact**: what behaves differently; anything that could break.
4. **Checks**: what actually ran and the result; what wasn't checked.
5. **Sources**: as above.

Add a diagram when the change is big: 4 or more files, both frontend and
backend, a database/API/permission change, or a new flow or screen. Draw it as
plain text in a code block, under about 15 lines, marking what changed:

```
Order form ──► POST /api/orders ──► OrderService.create ──► orders table
 [changed]                           [changed: checks stock]
```

Never claim a check, approval or tool use that didn't happen. A review only
reports problems; fix them only if asked.

## Changing this setup

- Shared skills and agents come from the greenfield-kit plugin. Project-only
  ones live in `.agents/skills/` and `.agents/agents/`. Never edit generated
  files such as `.codex/agents/*.toml` by hand.
- When you add, remove or rename a skill, agent, command or file here, update
  `.agents/README.md` in the same change.
- Add a new rule only after a real mistake that tools or examples can't
  prevent. Prefer an automatic check over a written rule.
