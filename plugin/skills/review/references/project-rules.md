# The project's own review rules

The reviewers are generic. What only this project knows goes in
`.agents/review/`, one small file per topic, and each reviewer reads only its
own file. Point to the real source (a permissions doc, a scope doc, an ADR)
instead of copying it, so there's one truth.

| File | Read by | Holds |
| --- | --- | --- |
| `roles.md` | `review-access`, `review-tests` | Roles, who may see and change what, where access lives in the code, known open questions |
| `scope.md` | `review-scope` | What's in and out of the current stage or milestone, and what not to guess |
| `paging.md` | `review-data`, `review-access` | Page styles, sizes and limits; filter order |
| `conventions.md` | `review-fit`, `review-contract` | Only the rules on top of `write-code`: API contract rules, framework choices, naming |
| `triage.json` | `scripts/triage.mjs` | Extra path rules for picking reviewers ([triage.md](triage.md)) |

Templates: [assets/project-rules/](../assets/project-rules/). Copy the ones the
project needs into `.agents/review/`, then fill them from the project's real
docs. Leave out a file that has nothing to say.

A reviewer whose file is missing still runs, with its general checks, and says
under "Not checked" that the project has no rules file for it.

## Writing them

- Short. A reviewer reads its file on every review.
- Facts, not advice: "Only Admin marks an invoice paid", not "be careful with
  payments".
- Say what not to flag: open questions and decisions still pending are not
  bugs.
- When the code and the rules disagree, the rules win until the user says
  otherwise. Never change a rules file just to match the code.
