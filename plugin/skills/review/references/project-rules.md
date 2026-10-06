# The project's own review rules

The checklist is generic. What only this project knows goes in
`.claude/review/`, one small file per topic; the reviewer reads the ones
that exist before it starts. Point to the real source (a permissions doc, a
scope doc, an ADR) instead of copying it, so there's one truth.

Every file here is optional. Most projects start with none.

| File | Used by | Holds |
| --- | --- | --- |
| `config.json` | the skill | Reviewer model, fix model, may the review run the app, default depth, caps ([config.md](config.md)) |
| `roles.md` | checklist: access, tests, plan mode | Roles, who may see and change what, where access lives in the code, known open questions |
| `scope.md` | checklist: scope, plan mode | What's in and out of the current stage or milestone, and what not to guess |
| `paging.md` | checklist: data, access | Page styles, sizes and limits; filter order |
| `conventions.md` | checklist: fit, contract, data, UI | Only the rules on top of `write-code`: API contract rules, migration rules, framework choices, naming |
| `triage.json` | `scripts/triage.mjs` | Paths to leave out of every review ([triage.md](triage.md)) |

Templates: [assets/project-rules/](../assets/project-rules/). Copy the ones the
project needs into `.claude/review/`, then fill them from the project's real
docs. Leave out a file that has nothing to say.

A missing rules file changes nothing: the reviewer uses the checklist's
general checks and says under "Not run" that the project has no rules file
for that part.

## Writing them

- Short. A reviewer reads its files on every review.
- Facts, not advice: "Only Admin marks an invoice paid", not "be careful with
  payments".
- Say what not to flag: open questions and decisions still pending are not
  problems.
- When the code and the rules disagree, the rules win until the user says
  otherwise. Never change a rules file just to match the code.
