---
description: Refine one greenfield-kit skill in one round - audit, decisions, one diff, apply, verify
argument-hint: <skill-name>
---

Refine the skill `plugin/skills/$ARGUMENTS/` in one round: one report with
decisions and a diff, my approval, then apply and verify. Do not edit
anything before I approve.

## Standards (apply all of them in the first pass)

1. **skill-creator-plus.** Run its validator and mark every read rule in
   its `references/audit-checklist.md`. Report each rule by its plain name
   and what it changes ("One rule, one place: …"), never by ID alone.
2. **Prompt audit (`/claude-api prompt-audit`).** Find text that does not
   help the agent do the task: things the model does by default, repeats,
   rules without a reason, fossils from older models. Keep what only the
   author knows: facts, contracts, reasons, hard judgment calls. Length is
   not cruft.
3. **ASD-STE100** for every rule and step an agent must follow: one
   instruction per sentence, imperative, active voice, at most 20 words,
   one word for one meaning, no "-ing" forms except names, the reason in
   its own "Reason:" line. Tables and examples keep their shape. The
   frontmatter description is routing text: keep the words users type.
4. **Low coupling.**
   - Stack words (TanStack, React, Bun, drizzle, zod, Postgres, Playwright,
     FSD paths) belong only in `write-code` and the stack skills. A process
     skill uses kit words: server function, end-to-end test, the project's
     checks.
   - Name only the skill you hand off to. Never name your caller.
   - Each fact has one owner. Point at the owner; do not copy it. The skill
     that writes a file owns its format.
   - Do not tell the agent to read the project's `CLAUDE.md`. Claude Code
     loads it every session.
5. **Runtime facts.** No agent teams. Agents are background subagents or
   `claude -p`. An agent cannot message the lead while it works: it writes
   files and a report, then stops. One working copy, one feature branch, no
   worktrees, stash or reset; agents commit by path. The lead writes the
   feature file from the reports.
6. **Every step** ends with "Done when", and the checklist has a way back
   ("If X fails, go back to step N").

## Round 1: report, then stop

1. Read the whole skill: SKILL.md, every reference, every script. Read who
   names it (`grep -rn '`$ARGUMENTS`' plugin README.md`) and the files it
   names.
2. Run:
   - `python3 .claude/skills/skill-creator-plus/scripts/validate_skill.py plugin/skills/$ARGUMENTS`
   - `python3 tools/check_refs.py`
   - a count of stack words in the skill
3. Check every fact you would keep or write against the repo: each path,
   skill name, command, flag, error class and quoted word (for example a
   verdict) exists as written. A fact you cannot check is a guess; mark it.
4. Report, in this order:
   - **Decisions for me**, first. Only design questions that change the
     pipeline, each with your recommendation in one line.
   - **Findings**, one table: principle (plain name) · `file:line` ·
     problem · fix.
   - **One diff** in ```diff blocks with every proposed change.
   - **What moves or goes**, one line each: every removed line says where
     its content now lives, or why nothing needs it.
5. Stop. Do not edit.

## Round 2: after I approve

1. Apply the approved changes. Nothing else; list other needed edits.
2. Diff every touched file against `git show HEAD:<file>`. Confirm no fact
   was dropped by accident: each removal is in the "moves or goes" list.
3. Run, and show the output:
   - the skill validator: 0 errors, 0 warnings
   - `python3 tools/check_refs.py`: 0 errors, coupling warnings not higher
   - `claude plugin validate ./plugin --strict` and `claude plugin validate . --strict`
   - longest STE sentence (20 words or fewer)
   - `grep -rniE "partyfox|hrise" plugin/skills/$ARGUMENTS`: no project names
4. Update the README row and any skill that pointed at moved text.
5. Finish with the card from `CLAUDE.md` "Final reply". Under it, list the
   principles used, each by plain name with what it changed. Say what was
   not run (for example a fresh-session test).
