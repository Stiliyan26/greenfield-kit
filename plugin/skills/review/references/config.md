# Project config and the questions

## `.agents/review/config.json`

Written on the first review in a project, read on every later one. The
user changes it by asking ("use Sonnet for fixes from now on") or by editing
the file.

```json
{
  "reviewerModel": "fable",
  "fixModel": "sonnet",
  "mayRunApp": true,
  "depth": "full",
  "maxReviewers": 4,
  "maxFixAgents": 4
}
```

| Key | Asked as | Notes |
| --- | --- | --- |
| `reviewerModel` | "Which model reviews?" | Judgement work. Offer the strongest first. |
| `fixModel` | "Which model fixes?" | Fixes are specified by the review, so a faster model is usually enough. Say so. |
| `mayRunApp` | "May the review start the app, seed data and drive it with Playwright?" | No for projects that can't run locally or need real accounts. Tests and curl against a running server are still allowed. |
| `depth` | "Quick or full by default?" | Quick = correctness and fit, one reviewer, no screenshots. Full = the whole checklist. Overridden per run by `--quick` / `--full`. |
| `maxReviewers` | not asked | Default 4. The plan proposes at most this many; the user can raise it for one run. |
| `maxFixAgents` | not asked | Default 4. |

### Models to offer

List what the current CLI can run, strongest first, with one line each.
Don't invent names; if unsure, run the CLI's own list.

| CLI | How to list | Names to pass |
| --- | --- | --- |
| Claude Code | the Agent tool's `model` values | `fable`, `opus`, `sonnet`, `haiku` |
| Codex | `codex --help` → `--model`; the config's `model` | the names Codex shows |
| Cursor | `cursor-agent --list-models` | the names it prints |

Suggest: reviewers on the strongest model; fixes on the fast model, and the
strongest model for a fix the review marked as needing judgement (a design
change, a data migration).

## Before each run

Ask these two, in one message, unless the user already answered in the
request:

1. **What worries you most here?** Free text. "Nothing" is fine. The
   reviewers start there and mark those problems first; the README repeats
   the answer.
2. **Quick or full?** Only when the config has no `depth`, or the target
   size makes the default a bad fit (a 30-line diff on `full`, a whole app
   on `quick`). Say why you're asking.

Don't ask again what the config answers. Don't ask about known problems;
the user names them under "what worries you" if they want.

## The plan line

After triage, show one block and wait for yes, a number, or a model name:

```
Review: whole app · full · what worries you: balances and permissions
Reviewers (fable), one per feature:
  1. time-off      3,224 lines · 23 files   ← starts with balances
  2. reporting     4,813 lines · 45 files
  3. people        5,216 lines · 28 files
  4. other         1,102 lines · 19 files   (home, invoices, styles, server/test)
May run the app: yes (gates, unit tests, e2e, Playwright)
Files: reviews/2026-09-29-app/

Go? Or: a number of reviewers, features to merge or drop, another model.
```

The user decides the count every run. Fewer reviewers than features means
the smallest features merge into one reviewer, never that a feature is
dropped without the user saying so.
