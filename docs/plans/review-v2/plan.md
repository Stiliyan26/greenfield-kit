# Review v2

Status: BUILT 2026-09-29 (0.10.0), decided with the user the same day. Replaces the current
`review` skill (areas × lenses → judge → one report).

## Why

The HRise whole-app review (2026-09-27) ran 3 × 5 agents, each reading
3–8k lines through 6–9 lenses, and produced three 20 KB reports: 5 items
with paraphrased snippets, 16 one-liners, 31 "Noted" lines. It asked
nothing, ran nothing, and the user rewrote it by hand into
`docs/reviews/2026-09-27-whole-app-review.md` (impact, current code copied,
correct code, how to prove, test to add). That file is the target shape.

## Decisions

| Question | Decision |
| --- | --- |
| Agents | One reviewer per feature, end to end (server + client + tests). The skill proposes the count from the target; the user confirms or changes it every run. |
| Models | Asked once per project: reviewer model and fix model, from the models the current CLI offers. Saved in `.agents/review/config.json`. Shown in every plan line; changed on request. |
| Proof | Reviewers may run code: gates, unit tests, curl, e2e, Playwright. Never edit. Each problem carries "Proved by" with the command and output, or "Not run: <command>". |
| Screenshots | Only when the problem changes what the user sees in a way that matters. A one-word label change gets no screenshot. |
| Dialogue | Before: what worries you most; may it start the app and run e2e; quick or full (remembered per project, re-asked only on request). After: the files; the user ticks. During fixes: when a fix has two real ways, the options are in the file, the user picks. |
| Report | `reviews/<date>-<target>/README.md` (summary table across all + suggested order) and one file per feature, problems ordered Critical → Important → Later. Every problem gets the full shape, Later included. Committed. |
| Context | 3–5 lines per problem from the feature file and DESIGN.md: what the part does, who uses it, where the bug sits. |
| Fix options | A / B / (C), each with its own corrected code and a one-line tradeoff, the reviewer's pick marked. One option when there is only one. |
| Choosing | Tick boxes in the file: fix now (+ option letter) / later / not a problem / explain more. Then the user says "fix". |
| Fix agents | One per feature file with ticked problems, capped, models from config; the user confirms. Own worktrees; test first, then fix; the lead merges one at a time and runs all tests. |
| Closing | The reviewer re-checks each fixed problem with the same proof and ticks `[x] fixed`, with the new proof. The file is the record. |
| Priority | Critical = data, money, access, or a user can't finish a task. Important = wrong result or real annoyance with a workaround. Later = cosmetic, cleanup, tests. |
| Pipeline | The same flow everywhere: plan mode (plan files), per feature, at merge, at prove, and on demand. |
| CI / PR | Dropped for now. Local only. |

## Flow

```
/review [target] [--quick|--full]
 0 tools      gates from .agents/PROJECT.md → tools.txt
 1 config     first run: reviewer model, fix model, may it start the app → .agents/review/config.json
 2 before     what worries you most · depth (skipped when remembered and the user doesn't ask)
 3 plan       features in the target (feature files, else top folders) → one reviewer each,
              count + model shown; user confirms or changes
 4 review     reviewers in parallel; read, run, prove; write reviews/<date>-<target>/<feature>.md
 5 summary    lead dedups across features, writes README.md: table + suggested order
 6 decide     user reads, ticks, picks options
 7 "fix"      lead reads ticks → fix agents per feature (capped) + models → user confirms
 8 fix        worktrees; test to add first → fix → green; lead merges one at a time, all tests
 9 close      reviewer re-proves each fixed problem, ticks [x] fixed + proof
```

## Problem shape

```markdown
## 3. Editing a half-day request turns it into full days · Important

**Context.** Time off → Record modal. An employee edits a pending request
(feature: time-off-request). Days are previewed by the server and shown
before Save.
**Impact.** Employee edits only the note of a request with a 0.5 day; Save
sends full days; the balance is charged more after approval.
**Why.** The server preview wins over the saved per-day amounts, and the
preview is called without them.
**Current code** (`client/src/features/time-off/request/ui/RecordModal.tsx:137-139`)
```tsx
…copied…
```
**Proved by.** `npx playwright test e2e/…` → PATCH body shows `amount: 1`.
(or a screenshot path, or "Not run: <command>")
**Fix options**
- **A (recommended).** Keep saved amounts when the range is unchanged. <code> · cost: 6 lines, no API change.
- **B.** Pass `perDayAmounts` to the preview. <code> · cost: server change, preview stays the single source.
**Test to add.** "Editing a pending half-day request keeps the half day".
**Decision.** [ ] fix now: A / B  [ ] later  [ ] not a problem  [ ] explain more
**Status.** open
```

## What changes in the kit

| Keep | Change | Remove |
| --- | --- | --- |
| tools.md + assets/gates, project-rules (roles, scope, conventions) | SKILL.md rewritten to the flow above; lenses folded into one `checklist.md` the reviewer applies per file (blind spot last); `code-reviewer` agent gets Bash (run only) and the problem shape; `triage.mjs` keeps collecting files and diff, groups by feature file instead of packing areas; `report.md` → README + feature file templates | judge lens, `finding.md`, `review.yml` (CI), PR comment, `--only` area runs, the 5-agent cap wording |

New: `.agents/review/config.json` (models, may run app, default depth),
`reviews/` folder convention, `review fix` entry (reads ticks, starts fix
agents), `review close` (re-prove).

Callers to update: `greenfield-mode` (review table), `plan-feature`,
`deliver-feature`, `README.md`, `DIRECTION.md`, `.agents/PROJECT.md`,
manifests (0.10.0).
