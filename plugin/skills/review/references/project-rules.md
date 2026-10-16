# The project's own review rules

The checklist is generic. Put what only this project knows in
`.claude/review/`, one small file per topic. The reviewer reads the files
that exist before it starts. Point to the real source (a permissions doc, a
scope doc, an ADR). Do not copy it.

Every file here is optional. Most projects start with none.

Reason: one source keeps the rules true.

| File | Used by | Holds |
| --- | --- | --- |
| `config.json` | the skill | Reviewer model, fix model, may the review run the app, default depth, caps (config.md) |
| `roles.md` | checklist: access, tests, plan mode | Roles, who may see and change what, where access lives in the code, known open questions |
| `scope.md` | checklist: scope, plan mode | What's in and out of the current stage or milestone, and what not to guess |
| `paging.md` | checklist: data, access | Page styles, sizes and limits; filter order |
| `conventions.md` | checklist: fit, contract, data, UI | Only the rules on top of `write-code`: API contract rules, migration rules, framework choices, naming |
| `triage.json` | `scripts/triage.mjs` | Paths to leave out of every review (triage.md) |

Templates are in `assets/project-rules/`. Copy the ones the project needs
into `.claude/review/`. Fill them from the project's real docs. Leave out a
file that has nothing to say.

If a rules file is missing, the reviewer uses the checklist's general checks.
It writes under "Not run" that the project has no rules file for that part.

## Writing them

- Keep each file short. A reviewer reads its files on every review.
- Write facts, not advice: "Only Admin marks an invoice paid", not "be careful
  with payments".
- Say what not to flag. Open questions and pending decisions are not problems.
- If the code and the rules disagree, the rules win until the user says
  otherwise. Never change a rules file only to match the code.
