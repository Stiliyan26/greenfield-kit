# The project's own review rules

The lenses are generic. What only this project knows goes in
`.agents/review/`, one small file per topic, and each lens reads only the
files it names. Point to the real source (a permissions doc, a scope doc, an
ADR) instead of copying it, so there's one truth.

Every file here is optional. Most projects start with none.

| File | Read by the lens | Holds |
| --- | --- | --- |
| `roles.md` | `access`, `tests`, `plan` | Roles, who may see and change what, where access lives in the code, known open questions |
| `scope.md` | `scope`, `plan` | What's in and out of the current stage or milestone, and what not to guess |
| `paging.md` | `data`, `access` | Page styles, sizes and limits; filter order |
| `conventions.md` | `fit`, `contract`, `data`, `ui` | Only the rules on top of `write-code`: API contract rules, migration rules, framework choices, naming |
| `triage.json` | `scripts/triage.mjs` | Extra path rules, paths to ignore, and a lower agent cap ([triage.md](triage.md)) |

Templates: [assets/project-rules/](../assets/project-rules/). Copy the ones the
project needs into `.agents/review/`, then fill them from the project's real
docs. Leave out a file that has nothing to say.

A lens whose file is missing still runs, with its general checks, and says
under "Not checked" that the project has no rules file for it.

## Writing them

- Short. A reviewer reads its file on every review.
- Facts, not advice: "Only Admin marks an invoice paid", not "be careful with
  payments".
- Say what not to flag: open questions and decisions still pending are not
  bugs.
- When the code and the rules disagree, the rules win until the user says
  otherwise. Never change a rules file just to match the code.
