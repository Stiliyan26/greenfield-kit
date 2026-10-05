# What can go wrong

Apply **Every entry point** to each server function, plus the section for its
kind. Apply **Changing what exists** whenever the feature touches something
already built. Every item becomes one or more scenarios in the feature file
with an exact outcome, or one line `N/A — <reason>`. Outcomes that are product
choices are interview questions; the rest the plan decides.

This list is a floor. If the design suggests a risk that isn't here, add a
scenario for it too.

## Every entry point

- **Missing and malformed input:** each field missing, `null`, empty, the
  wrong type; unknown extra fields (refused, `.strict()`).
- **Limits:** for every length, count, size and number: min−1, min, max,
  max+1; empty and huge lists.
- **Text:** leading and trailing whitespace, line breaks and control
  characters, emoji and other multi-byte characters, zero-width characters,
  very long strings; HTML and script; SQL-looking text (`' OR 1=1`) wherever
  the value reaches a query, a log line or a path.
- **Ids:** malformed, non-canonical (upper-case UUID), unknown, deleted,
  belonging to someone else.
- **Not signed in; the wrong role; a valid session for a deleted or
  unconfirmed user.**
- **Changing fields the caller must not set** (`id`, `ownerId`, `role`,
  `createdAt`, counters) by sending them in the input.
- **Same call twice:** double click, client retry → the final state is the
  same as once.
- **Two at once:** two writers on one record; a write racing a delete; a check
  followed by a separate write.
- **Each dependency** (database, another service, mail) down, slow past the
  timeout, or answering garbage → the exact outcome, and nothing half-written.
- **Leaks:** error messages carry no stack traces, class names, SQL or other
  users' data; "not found" and "not yours" look the same.
- **Logs:** no secrets, tokens, passwords, personal data or request bodies.
- **Volume:** one call can't start unbounded work (fan-out, list size, emails).
  Otherwise it's an accepted gap with a trigger.

## Lists and paging

- `size` 0, −1, max+1, non-numeric; an unknown sort field; a tampered cursor
  or page.
- Walking every page visits each row exactly once, including when a page
  boundary falls inside equal sort keys.
- Filters never widen what the caller may see; counts match the visible rows.

## Server routes (callers outside the app)

- Missing, malformed, expired or forged token or signature; a replay of an
  old valid one.
- Wrong method (`405`), wrong content type (`415`), broken JSON (`400`), body
  over the size limit (`413`).
- Rate limit on anything anonymous or expensive, or an accepted gap with a
  trigger.
- Uploads, if any: the wrong type behind the right extension, zero bytes,
  oversize, too many files, a file name with a path in it.

## Webhook or inbound callback

- Signature missing, wrong, or a replay (timestamp window).
- The same delivery twice; deliveries out of order; an unknown event type.
- An event for an unknown or deleted record.

## Scheduled job

- A slow run still going when the next tick fires; the job running on two
  instances.
- Running during writes to the same rows.
- Empty input; huge input → works in batches and stops at a short batch.
- A crash halfway → the next run finishes the work, and nothing that matters
  happens twice.
- Time edges: exactly at the cutoff; time zone and daylight saving; a cutoff
  or interval configured as zero or negative → startup refuses.

## Sending email (as a side effect of any entry point)

- The same trigger twice → one email, or a deliberate window.
- Address invalid, over 254 characters, or with a line break in it.
- Template values escaped in the HTML part; line breaks stripped in the
  subject.
- A permanent failure isn't retried; a transient one is retried, then given up
  on and recorded.
- Sent only if the write commits: a rolled-back write sends nothing.

## Changing what exists

- **Every caller** of the changed function, table, field or event, found by
  searching the code now: screens, jobs, scripts, the e2e suite. Each one gets
  a step or an accepted gap.
- **Existing rows** in the old shape: migrated, tolerated or left as they are,
  decided and written down.
- **Tests that assert the old behaviour** are named and changed in the same
  feature, never silently deleted.
- **Docs** describing the old behaviour (`plan.md`, feature files, `DESIGN.md`)
  are updated in the same change.

## Startup and config

- A required env var missing → the app refuses to start, naming it.
- An invalid value (a zero or negative duration, a secret shorter than its
  minimum, a malformed URL) → the app refuses to start.
