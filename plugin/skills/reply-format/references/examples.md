# Example replies

One full reply for each template. Copy the shape, not the content.

## Quick answer

```
**The rule comes from the chat panel, not from your files.**
- Your CLAUDE.md files and memory do not contain it.
- The panel adds its own rules to each session.
Your move: add a line to `~/.claude/CLAUDE.md` to turn it off.
```

## Task done

```
![Before and after](<home>/.claude/diagrams/<project>/invoice-reminders.png)

**Done: overdue invoices now send one reminder a day.**

| File | Change |
|---|---|
| `src/server/invoices/remind.ts` | New: finds overdue invoices, sends one email each |
| `src/server/invoices/remind.test.ts` | New: 6 tests |

The job runs once a day — > "Cron Jobs ... run at the schedule you define" ([provider docs](https://example.com/docs/cron))

Cleanup: deleted the temporary sketch spec
Your move: nothing

**Sources**
- [provider docs](https://example.com/docs/cron) — fetched <YYYY-MM-DD>

## What changed
- **Before:** customers got no reminder for an overdue invoice.
- **After:** each overdue invoice sends one reminder a day.
- **What I did:** added the reminder job and its tests.
- **Impact:** customers see a reminder email the day after the due date.

**Skills used:** none
**Evidence:**
- `<test command> remind` → 6 passed, 0 failed
- Not verified: no real email sent, the mail key is not set
```

## Options

```
**Go with provider A** — free tier, and the flow already works end to end.
| Option | Good | Bad |
|---|---|---|
| Provider A | Free, tested | Delivery speed unknown |
| Provider B | Fast delivery | Needs prepaid credits |
Your move: reply "A" or "B".
```

## Problem

```
**⚠️ The build fails on the database client import.**
- Cause: the package is not installed.
- Fix: run the package manager's install for that client.
Your move: nothing
```
