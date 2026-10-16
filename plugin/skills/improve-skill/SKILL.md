---
name: improve-skill
description: Audits, creates and improves Agent Skills (folders with a SKILL.md) against Anthropic's skill authoring best practices, the Claude Code skills docs and the prompting guides for Claude Fable 5 and Opus 5.5. Reports every rule as pass, fail or not applicable with file and line evidence, checks that a skill stands alone and names no skill but its handoff, rewrites rules in Simplified Technical English, and changes nothing until the user approves. Use when the user asks to audit, review, check, score, improve, shorten, refactor or rewrite a skill or a folder of skills, to create a new skill or turn a repeated workflow into one, to update an old skill for newer models, to run the skill validator, or runs /improve-skill.
argument-hint: "[skill folder]"
license: MIT
---

# Improve a skill

A skill is a table of contents, not a manual. The description gets it
chosen. `SKILL.md` says what to do. Detail waits in reference files until a
step needs it.

## Rules for every mode

1. **Report before you change.** Start from evidence: the validator's
   output and a full read of the skill. Edit nothing until the user picks
   the changes. A direct request to fix a named problem is that approval.

   A skill change alters each future run. The user owns that call.

2. **Absorb, do not layer.** Fold new guidance into the rule it refines.
   Delete what it replaces. Write the reason, not the date.

   A good edit usually makes the skill shorter. A later editor can tell
   from the reason whether the rule still holds.

3. **Test before you delete.** Only a with-skill and a without-skill run
   proves that a line is dead weight. Method: references/testing.md, "Test
   before you delete".

   Newer models often do better with fewer instructions. A line that
   looks redundant may still steer the model.

4. **The scripts are the floor.** `scripts/validate_skill.py` and
   `scripts/check_refs.py` check what a script can check. The judgment
   rules in references/audit-checklist.md need a careful read.

5. **Each skill stands alone.** A skill works in any project and names no
   project. It names only the skill it hands off to. It does not repeat
   what the skill that controls the order says: when to run, what comes
   before or after.

   One skill controls the hierarchy. The others know only their own job,
   so each can be reused alone. Each name of another skill is a relation
   to maintain when either skill changes.

6. **Write rules in Simplified Technical English (ASD-STE100).**
   - One instruction per sentence, at most 20 words.
   - Imperative, active voice, no "-ing" forms.
   - One word for one meaning.
   - Numbered steps; each step ends with "Done when".
   - The reason goes in its own short paragraph.
   Keep tables and examples as they are.

   A rule that holds several instructions reads as ambiguous. Agents
   then follow it in different ways.

7. **No diff in chat.** Show a short summary of the changes per file. A
   few changed lines may go in a ```diff block; a whole file may not.

   The user reads long text slowly. A 400-line diff hides the decision.

## Pick the mode

| Mode | When | Output |
|---|---|---|
| AUDIT | Check, score or improve a skill or a folder of skills | A findings report, then only the approved edits |
| NEW | No skill covers the job yet | A new skill folder that passes the scripts and its test prompts |
| REFINE | A skill exists and new evidence arrived: a correction, a miss, a shipped result | The same skill, rewritten around the principle, usually shorter |

"Improve this skill" and `/improve-skill <folder>` mean AUDIT, then
REFINE with the approved changes.

## AUDIT

Copy this checklist into the reply and tick it off:

```text
Audit progress:
- [ ] 1 Scripts run on every skill in scope
- [ ] 2 Each skill read in full: SKILL.md, references, scripts
- [ ] 3 Every checklist rule marked pass, fail or N/A, with evidence
- [ ] 4 Report written
- [ ] 5 User chose which changes to apply
- [ ] 6 Approved changes applied
- [ ] 7 Scripts re-run with no new errors or warnings
```

1. **Run the scripts.**
   - `python3 scripts/validate_skill.py <skill-folder>` for one skill, or
     `--all <folder>` for a library. Add `--json` to parse the results.
   - `python3 scripts/check_refs.py <library root>`. The root holds
     `skills/`. Add `--handoffs <file>` when the project names one in its
     `CLAUDE.md`.
   For a library, audit in full the skills the user picks; by default the
   five with the most errors.

   Done when you have output for every skill in scope.

2. **Read the skill.** All of it: `SKILL.md`, each reference file, each
   script.

   Done when you can name the skill's job, its branches and what every
   file is for.

3. **Mark every rule.** Open references/audit-checklist.md. Script rules
   take the scripts' results. Read rules need evidence you can cite as
   file and line. Mark rule 5 (stands alone) and rule 6 (STE) above too.

   Done when no rule is unmarked.

4. **Write the report** in the format at the end of the checklist: the
   table with fails first, the changes ranked by impact, then anything
   that needs the user's decision. For each extra skill name, give a way
   to remove it: copy the one line it needs, or drop the name. The worked
   example in examples/ shows the bar.

   Done when the report has every fail with its line and its fix.

5. **Stop and ask.** End the turn with the numbered changes. Edit nothing
   until the user picks.

   Done when the user has answered.

6. **Apply the approved changes** by the REFINE steps. Before you delete
   instructions as too prescriptive (rule NM1), run the test in
   references/testing.md.

   Done when every approved change is in the files.

7. **Re-run the scripts.** `validate_skill.py`, `check_refs.py` and, in a
   plugin repo, `claude plugin validate <plugin folder> --strict`. Report
   each result, including any that failed or did not run. If a script
   shows a new error or warning, return to step 6.

   Done when each script reports no new error or warning.

## NEW

```text
New skill progress:
- [ ] 1 Evidence: the task done once without a skill, gaps noted
- [ ] 2 Three test prompts and a no-skill baseline
- [ ] 3 Shape, invocation and freedom chosen
- [ ] 4 Folder scaffolded
- [ ] 5 Frontmatter and body written
- [ ] 6 Scripts clean
- [ ] 7 Tests re-run in a fresh session
- [ ] 8 Audit checklist passed
```

1. **Evidence.** Do the task once with Claude and no skill, or read real
   past examples. Note what had to be explained.

   Done when you can list the gaps the skill must close.

2. **Tests first.** Write three prompts people would type and record the
   no-skill result (references/testing.md).

   Done when the baseline is written down.

3. **Shape.** Choose single file, bundle or router; who can invoke it; and
   the freedom for each step (references/authoring-guide.md).

   Done when each choice has a one-line reason.

4. **Scaffold.** Run `python3 scripts/init_skill.py <name> --path
   <skills-folder>`, with `--refs`, `--scripts` or `--user-invoked` as
   needed. It creates the folder and validates it.

   Done when the folder exists.

5. **Write.** Description first, then the body: the most important rules
   at the top, a checklist with a go-back line for multi-step work, detail
   in linked files. Replace every `[FILL: ...]` placeholder.

   Done when nothing is left to fill.

6. **Validate.** Run both scripts on the folder. Fix every error; fix or
   justify every warning. If an error remains, return to step 5.

   Done when both scripts report no error.

7. **Re-test.** Run the test prompts in a fresh session with the skill
   on. If one fails, return to step 5.

   Done when each prompt gives the result the skill promises.

8. **Audit.** Mark the checklist rules that need a read.

   Done when nothing fails.

## REFINE

1. **Name the evidence** in one line: what happened, what the user said,
   what shipped.

   Done when the line is written.

2. **Find the principle** that explains it. If you cannot name it, you
   are not ready to edit.

   Done when the principle is one sentence.

3. **Rewrite** every line the principle touches, in STE. Delete lines it
   makes redundant. If a shipped result contradicts an older rule, the
   shipped result wins; tell the user.

   Done when no line repeats the principle and no line contradicts it.

4. **Check.** Run both scripts. The file should not have grown; if it
   did, find what the new rule made redundant. If a script shows a new
   error, return to step 3.

   Done when both scripts report no new error.

## Resources

- [references/audit-checklist.md](references/audit-checklist.md) - every
  rule with its ID, why it matters, how to check it and its source, plus
  the report format and the failure modes. Open in AUDIT step 3, and
  before calling any skill done.
- [references/authoring-guide.md](references/authoring-guide.md) - how to
  write each part: frontmatter fields, description, structure, degrees of
  freedom, workflows, scripts, hooks, newer models. Open in NEW steps 3 to
  5 and in REFINE.
- [references/testing.md](references/testing.md) - evaluations,
  fresh-session baselines, Claude A and B, model sweeps, test before you
  delete. Open in NEW steps 2 and 7, and before cutting instructions.
- [examples/pdf-helper-report.md](examples/pdf-helper-report.md) - a
  finished audit report for the flawed sample skill in
  `examples/pdf-helper/`, built from the validator output in
  `examples/pdf-helper-validator-output.txt`. Open to see the bar for a
  report.
- `scripts/validate_skill.py` - run it, do not read it. `--help` lists
  the flags: `--all`, `--json`, `--ban-em-dash`.
- `scripts/check_refs.py` - run it. Finds each name of another skill,
  each dead link and each name of a deleted skill. `--help` shows the
  handoffs file format.
- `scripts/init_skill.py` - run it to scaffold a new skill.

Script paths are relative to this skill's folder (in Claude Code,
`${CLAUDE_SKILL_DIR}`). Use `python3`, or `python` on Windows. Python 3.8 or newer, standard library only, nothing
to install.
