# Project config and the questions

## `.claude/review/config.json`

The skill writes this file on the first review in a project. It reads the
file on every later review. The user changes it by asking ("use Sonnet for
fixes from now on") or by editing the file.

```json
{
  "reviewerModel": "fable",
  "fixModel": "sonnet",
  "mayRunApp": true,
  "depth": "full",
  "maxReviewers": 4,
  "maxFixAgents": 4,
  "maxRounds": 2
}
```

| Key | Asked as | Notes |
| --- | --- | --- |
| `reviewerModel` | "Which model reviews?" | Judgement work. Offer the strongest first. |
| `fixModel` | "Which model fixes?" | Report mode only; fix agents work from the ticked review, so a faster model is usually enough. In fix mode the reviewer fixes, on `reviewerModel`. |
| `mayRunApp` | "May the review start the app, seed data and drive it with Playwright?" | No for projects that can't run locally or need real accounts. Tests and curl against a running server are still allowed. |
| `depth` | "Quick or full by default?" | Quick = correctness and fit, one reviewer, no screenshots. Full = the whole checklist. Overridden per run by `--quick` / `--full`. |
| `maxReviewers` | not asked | Default 4. The plan proposes at most this many; the user can raise it for one run. |
| `maxFixAgents` | not asked | Default 4. Report mode. |
| `maxRounds` | not asked | Default 2. Fix mode: passes a reviewer makes over its feature (find and fix, then re-read for what the fixes added). |

### Models to offer

The Agent tool's `model` values, strongest first: `fable`, `opus`,
`sonnet`, `haiku`. One line each.

Suggest the strongest model for reviewers. Suggest the fast model for fixes.
Suggest the strongest model for a fix the review marked as needing judgement
(a design change, a data migration).

## Before each run

SKILL.md step 2 asks the two questions. The reviewers start at the worry
and mark those problems first. Ask "quick or full?" also when the target
size makes the default a bad fit (a 30-line diff on `full`, a whole app on
`quick`). Say why you ask. Do not ask about known problems.

## The plan line

After triage, show one block. Wait for a yes, a number, or a model name:

```
Review: whole app · full · what worries you: refunds and permissions
Reviewers (fable), one per feature:
  1. orders        3,224 lines · 23 files   ← starts with refunds
  2. invoices      4,813 lines · 45 files
  3. customers     5,216 lines · 28 files
  4. other         1,102 lines · 19 files   (home, styles, server/test)
May run the app: yes (checks, unit tests, e2e, Playwright)
Files: reviews/2026-09-29-app/

Go? Or: a number of reviewers, features to merge or drop, another model.
```
