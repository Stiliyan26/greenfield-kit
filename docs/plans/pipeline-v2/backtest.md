# Backtest: `plan-feature` on a project already built

Not run yet. Adapted from Peter's `BACKTEST.md`; kept here so the idea
survives the `peter-skills/` folder.

Test the skill on a problem we've already solved, and compare. Give
`plan-feature` the same notes a real project started from, on a copy of the
repo from before the feature existed, answer its questions with what the user
said back then, and put its plan next to the real one.

**What it tells you:** whether the skill asks the questions that mattered,
makes the same calls, cuts the same features and writes at least the same
scenarios; and whether it sees in advance what the build only found later.
Every miss becomes a proposed fix to the skill.

**When:** only when the user asks. Once after the first real run (Call OS),
and again after a big change to `plan-feature`.

## Inputs

| What | Where |
| --- | --- |
| The code before the feature | a commit |
| The notes (the spec) | the brief or the notes the plan started from |
| The user's answers last time | the interview record in the real `plan.md` |
| The answer key | the real `plan.md` and `features/*.md` |
| What the build found later | the review folders, accepted gaps, decisions added during the build |

## Who does what

| Role | Sees | Never sees |
| --- | --- | --- |
| Planner (an agent) | the old copy of the repo, the notes, the skill's files | the answers, the answer key, git history |
| Stand-in user (an agent) | each question, the old answers, the notes | the answer key |
| Reviewer (an agent) | the skill's plan-mode review inputs | the interview |
| Judge (an agent) | everything | — |

The session running the backtest only passes messages between the planner
and the stand-in. It never answers a question itself.

## Steps

1. **Set up.** A copy of the repo at the old commit in the scratchpad
   (`git worktree add` is fine here: it's a test copy, not a build); the
   notes inside it; the old answers outside it.
2. **Run the planner.** A general-purpose agent in the copy: follow
   `plan-feature` exactly as if the user had typed it with the notes; never
   read git history; when it needs an answer, end its reply with exactly one
   question and stop.
3. **Relay the interview.** Pass each question to the stand-in (answer only
   from the old answers and the notes; if they don't cover it, answer "you
   decide" and start with `NEW:`), pass the answer back. Log question, answer,
   `NEW` or not.
4. **The review.** The planner runs the `review` skill in plan mode itself;
   product questions go through the stand-in.
5. **Judge.** With the planner's plan, the interview log, the answer key and
   what the build found later, the judge writes the report below.
6. **Clean up.** Save the report as `docs/backtests/plan-feature-<date>.md`,
   remove the copy. Show the verdict and the proposed fixes; apply nothing
   until the user says which.

## The report

```markdown
# Backtest report — <date>

**Verdict:** <better, as good, or worse than the real plan, and the biggest reason>

## Questions
- Asked in both: <n>
- Only in the original (the skill missed them): <list, with what that cost>
- Only new: <list, each marked useful or noise>

## Design calls that differ
| Topic | Original | Skill | Which is better, why |

## Features
<same split and order? if not, which is better>

## Scenarios
- In the original, missing from the skill's plan: <list>
- In the skill's plan, missing from the original: <list>

## Found later by the build
| Finding (review, gap, decision) | Did the skill's plan already cover it? |

## Proposed skill fixes
1. <change to SKILL.md or a reference> — evidence: <which miss above>
```

A question the old answers didn't cover got "you decide" (`NEW`), so the
plan can differ there for that reason alone. Count those separately; they
aren't the skill's fault.
