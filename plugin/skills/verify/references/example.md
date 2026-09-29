# A worked example

Copy the **shape**, never the values. Every command, port, selector and path
below belongs to the made-up app it describes. Yours come from your repo.

The example app: **Bookshelf**, a Next.js app with a Postgres database. A
reader browses books, opens one, and adds a review. It runs on port 3000 and
seeds two accounts.

## `.agents/skills/verify-bookshelf/SKILL.md`

````markdown
---
name: verify-bookshelf
description: Start Bookshelf locally, drive a feature in a real browser the way a reader would, and save proof. Use before calling any change to the books, reviews or search screens done.
---

# Verify Bookshelf

Web app, driven with Playwright. The feature map is in
[features/README.md](features/README.md). Read the feature's file before you
drive it.

## Launch

```
npm run db:up && npm run db:seed        # Postgres in Docker, two seeded users
npm run dev -- --port 3100              # 3100, so it never fights a dev server on 3000
```

Ready when `curl -s localhost:3100/api/health` prints `{"status":"ok"}`. It
takes about 15 seconds on a cold database.

Stop with `npm run db:down` and by killing the dev server you started — by its
PID, never by name.

## Doctor

Run this first, and again whenever something looks off. All read-only:

```
node .agents/skills/verify-bookshelf/scripts/doctor.mjs --port 3100
```

It checks: the port answers, `/api/health` is ok, the seed users exist, and the
build is newer than the last `src/` change. Any failure means this copy isn't
worth driving — fix it before you interpret a screenshot.

## Drive

```
node .agents/skills/verify-bookshelf/scripts/drive.mjs \
  --feature reviews --port 3100 --out temp/verification/<task>/
```

Log in through the real form, never by writing a cookie:

```js
await page.goto("http://localhost:3100/login")
await page.getByLabel("Email").fill("reader@example.test")
await page.getByLabel("Password").fill("seed-password")
await page.getByRole("button", { name: "Sign in" }).click()
await page.waitForURL("**/books")
```

Use roles and labels, as above. Never a CSS path or a screen position — both
break on the next restyle and tell you nothing when they do.

## Evidence

Into `temp/verification/<task>/`:

- A screenshot before the action and one after, named for the step.
- The API response for any write, as `.json`.
- The database row the write produced: `npm run db:query -- "select * from reviews order by id desc limit 1"`.

A screenshot of a form is not proof the review saved. Check the row too.

## Cleanup

Stop only what this run started. `npm run db:down` drops the container; the dev
server dies by the PID you recorded. Delete scratch rows, never the evidence
folder.

## Helpers

- `scripts/doctor.mjs` — the read-only check above.
- `scripts/drive.mjs` — launches Chromium, runs one feature, writes evidence.

Both run exactly as written here. If one doesn't, fix the script, not the doc.
````

## `features/reviews.md`

````markdown
# Reviews

A signed-in reader writes one review per book, edits it, and deletes it. The
book's average rating updates on the book page.

## Sub-features

- `review-add`: write a review with a star rating and text.
- `review-edit`: change your own review.
- `review-delete`: remove your own review.
- `review-average`: the book page shows the average across reviews.

## How to get to it (user POV)

- From `/books`, click a book title, then "Write a review".
- Direct: `/books/<slug>#review-form`.
- From `/me/reviews`, "Edit" on any row.

## Driving it with Playwright

Preconditions: logged in as `reader@example.test`, book `dune` seeded, and that
reader has no existing review on it (`npm run db:query -- "delete from reviews
where user_email='reader@example.test'"`).

1. Open the book.
   `await page.goto("http://localhost:3100/books/dune")`
   You should see the title "Dune" and a "Write a review" button.
2. Open the form.
   `await page.getByRole("button", { name: "Write a review" }).click()`
   A dialog appears with a "Rating" group and a "Your review" textarea.
3. Fill and submit.
   `await page.getByRole("radio", { name: "4 stars" }).check()`
   `await page.getByLabel("Your review").fill("Slow start, worth it.")`
   `await page.getByRole("button", { name: "Post review" }).click()`
   The dialog closes and the review appears in the list under the book.
4. Check the side effect.
   `npm run db:query -- "select rating from reviews order by id desc limit 1"`
   should print `4`, and the book page's average should have moved.

## Gotchas

- The average is cached for 60 seconds. Either wait, or hit
  `/api/books/dune?fresh=1`. A stale average is not a bug.
- The rating radios have no visible text; they're labelled by `aria-label`.
  `getByRole("radio", { name: "4 stars" })` works, `getByText("4")` doesn't.
- Seeding twice doesn't clear reviews. Delete the reader's rows first or step 3
  fails on the one-review-per-book rule.
````

## Why this one works

- **The doctor runs before anything is believed.** A screenshot from a stale
  build is worse than no screenshot.
- **It logs in through the form.** Writing a session cookie skips the code you
  probably just changed.
- **Selectors are roles and labels.** They survive a restyle, and when they
  break they name what's missing.
- **It checks the row, not just the screen.** The screen can lie.
- **Cleanup spares the evidence.** The whole point of the run is what's left
  behind.
- **The gotchas are specific.** "The average is cached for 60 seconds" saves
  the next agent an hour of chasing a bug that isn't there.
