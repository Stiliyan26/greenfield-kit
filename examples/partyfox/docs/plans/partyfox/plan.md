# PartyFox first release plan

Status: Draft
Design: `DESIGN.md` at studio revision 247 (Opus, "Ticket Stub"), approved 2026-09-26. Needs one more approval once Opus's Components table is in (see Components).

## What it does

The owner sees each day's parties as tickets, one row per animator, with clashes, parties without an animator and missing deposits pinned on top. The owner turns site orders into bookings, assigns animators, marks deposits received and decides on leave. Each animator logs in on a phone and sees only their own parties with a usable address, asks for leave and checks their own list of parties for the month.

All data is fake. Money amounts stay unset everywhere.

## Who can do what

The server checks every rule below. Hiding a button is not access control.

- Owner: can see the day board, every booking, the order inbox, customers and all leave requests, and search parties.
- Owner: can schedule an order into a booking, add an address to an order, create a booking by hand, change a booking's animator, mark a deposit received, approve or decline leave.
- Owner: can't see or change an animator's password. Can't set money amounts (no amounts exist in this release).
- Animator: can see only their own parties, and only these fields: date, start and end, child's name and age, package, guests, address and address note, parent's name and phone, and whether the deposit is missing. Never the family history, other bookings of the family, providers, the message log, or email.
- Animator: can ask for leave, cancel their own pending request, see their own schedule and their own list of parties for a month, and confirm the list or report an error with a note.
- Animator: can't see other animators' bookings, the inbox, customers, other animators' leave or pay. Can't mark a deposit, change an animator or decide leave.
- Anyone without a login: can only send a site order (`POST /api/site-orders`) and log in. Every other endpoint answers 401.

## Done when

Login and access

- D1: the owner logs in → lands on today's day board.
- D2: an animator logs in → lands on "My parties", laid out for a phone.
- D3: an animator calls each owner-only endpoint in the API table → 403 from every one, and the owner screens are not in their menu.
- D4: an animator opens another animator's party by id → 404, the same as a party that doesn't exist.
- D5: a caller without a session calls each endpoint except login and site orders → 401 from every one.

Day board and bookings (`ops-day`, `booking`)

- D6: the owner opens a day → sees one row per animator with that day's tickets, approved leave shown on the row, and the counts of parties, unassigned, missing deposits and clashes.
- D7: two bookings for one animator overlap, or a booking falls in the animator's approved leave → both tickets and the problem strip show a clash in warning amber, with the animators who are free at that time as one-tap choices.
- D8: a booking has no animator → it shows in the problem strip in warning amber, with the free animators as one-tap choices.
- D9: a booking has no deposit → the ticket is solid red, and it is the only solid red on the screen.
- D10: the owner presses "Депозитът е получен" → the ticket turns ok, the missing count drops by one, and the booking records who marked it and when. Pressing it again changes nothing.
- D11: the owner picks a free animator (from the problem strip or "Смени") → the board and the counts update without a reload, and only animators free at that time are offered.
- D12: the owner opens a booking → sees the steps from site order to party day, the providers, the message log, the family card, and the parent's phone and email as tap-to-call and mailto links. "Feedback" and "animator pay" show as not tracked yet.
- D13: the owner presses "Ново парти", fills child, age, date, start, package, guests, address and the parent's name and phone → the booking shows on its day, linked to the existing customer when the phone matches.
- D14: the owner searches "Търси парти" by child, parent or phone → matching bookings, newest first, each opening its booking.

Order inbox (`inbox`)

- D15: a site order arrives through `POST /api/site-orders` → it shows at the top of the inbox as "Нови".
- D16: an order without an address → shows as "Липсва информация" in warning amber and "Насрочи партито" is refused until the owner adds the address.
- D17: no animator is free at an order's time → the order shows as "Няма аниматор" in warning amber. It can still be scheduled without an animator.
- D18: the owner schedules an order → one booking is created with the order's child, age, package, guests and address, the order moves to "Насрочени", and the booking shows on its day. Pressing twice creates one booking.
- D19: a site order's phone is written differently from the customer's ("0888 104 812", "+359888104812") → both match the same customer.
- D20: more than 5 site orders from one address in 10 minutes → the 6th gets 429 and nothing is saved.

Leave (`leave-requests`, `my-leave`)

- D21: an animator asks for whole days or a few hours, with or without a reason → before sending they see their parties inside that time; after sending, the owner sees it as pending, with those parties listed as "needs cover" in amber.
- D22: the owner presses "Одобри и намери заместник" → the leave is approved, and a picker opens for each covered party with the animators free at that time. A party the owner skips keeps its animator and shows a clash until changed.
- D23: the owner declines with a note → the animator sees "declined" and the note. Declining without a note is refused.
- D24: an animator cancels their own pending request → it disappears from the owner's pending list. They can't cancel a decided one.

Customers (`customers`)

- D25: the owner filters customers by repeat (3+ parties), large orders (30+ guests), new (no past party), or birthday in the next 30 days, or searches by name or phone → the list and the counts match.
- D26: the owner opens a family → sees children with birthdays, the age each turns when the birth year is known, and every past party, newest first.

Animator views (`my-parties`, `my-leave`, `my-pay`)

- D27: an animator opens "My parties" → sees their parties for the next 10 days in Sofia time, a navigation link built from the address, a copy-address button, tap-to-call, and a red deposit warning on any party without a deposit.
- D28: a party falls inside the animator's pending leave → it is marked in amber on "My parties".
- D29: an animator opens "Request leave" → sees a 4-week calendar with their parties and leave.
- D30: an animator opens "My pay" for a month → sees each party with date, child, package and hours; every amount shows as "не е зададено". "Списъкът е верен", or "Има грешка" with a note, is saved for that month and can be changed until the month ends in Sofia time.

Look

- D31: every UI file passes `check_tokens.py --tokens design/tokens.css` with `0 problems`.
- D32: each screen is captured at 1440 and 390 next to its approved studio screen, and the `design-critic` agent scores the pair 70 or more with no score of 1.

## Changes

### Where the app lives

A new npm workspace under `examples/partyfox/`:

```
examples/partyfox/
  package.json          workspaces: api, web
  api/                  NestJS server, SQLite through Prisma
  web/                  React + Vite + TypeScript + Tailwind 4 + shadcn/ui (made in the components stage)
  e2e/                  Playwright tests, one file per Done-when group
  design/               fonts.css, tokens.css, shadcn.css: written by the studio, never edited
```

In production mode the NestJS server also serves the built `web/`, so it runs as one app on one port. In development Vite proxies `/api` to the server.

### Dates and times

- Timezone `Europe/Sofia` for everything a person sees. Instants (`starts_at`, `received_at`) are stored in UTC.
- A Sofia day runs from 00:00 Sofia time to the next 00:00, converted to UTC with the time zone database. On the two daylight-saving days it is 23 or 25 hours; the conversion handles it, never "+24h".
- A month runs from the 1st at 00:00 Sofia time to the next 1st. "The month is over" means now is past that end.
- Whole-day leave from date A to date B covers A 00:00 to the day after B 00:00, Sofia time. Hourly leave stores its two instants.
- An order keeps the party date and time as the parent sent them (`2026-10-11`, `11:00`, Sofia). Scheduling turns them into instants.
- "Today" in the seed and on the board is today's Sofia date.
- One server module owns these conversions, with unit tests for both daylight-saving days.

### Database

All tables are new. Nothing exists yet, so no data is lost. The first migration can be undone by deleting `api/prisma/dev.db`. The seed empties the tables and fills them again, so running it twice is safe.

- `users`: id, name, login, password_hash, role (`owner` | `animator`), skill label (for example "Фокусник").
- `customers`: id, family name, parent name, phone (unique, stored as `+359…`), email (nullable).
- `children`: id, customer_id, name, birthday month and day, birth year (nullable; set when an age and a party date give it).
- `orders`: id, received_at, parent, phone (normalised), email (nullable), child, age, party date, start time (Sofia), package, guests, address (nullable), note, customer_id (nullable), scheduled (bool).
- `bookings`: id, order_id (nullable, unique), customer_id, child_id, child_age, starts_at, ends_at, package, guests, address, address_note, animator_id (nullable), animator_set_at, created_at, deposit_received_at (nullable), deposit_marked_by (nullable).
- `booking_providers`: booking_id, what, who, state text.
- `booking_messages`: booking_id, sent_at, channel (`viber` | `email` | `phone`), text.
- `leave_requests`: id, animator_id, starts_at, ends_at, whole_days (bool), reason (nullable), state (`pending` | `approved` | `declined` | `cancelled`), owner_note, decided_by, decided_at.
- `pay_checks`: animator_id, month (`2026-09`), state (`confirmed` | `disputed`), note, updated_at. One row per animator and month.

Worked out when read, never stored, so they can't go stale:

- Order "needs info": no address. Order "no animator": no animator is free at its time.
- Booking flags: `clash` (the animator has an overlapping booking or approved leave), `unassigned`, `deposit_missing`, `in_leave` (inside the animator's pending leave).
- Booking steps: order, scheduled, animator, parent message (first message in the log), providers (all confirmed), deposit, party day. "Feedback" and "animator pay" have no data in this release and show as not tracked.
- Customer tags: repeat (3+ bookings), large (any booking with 30+ guests), new (no past booking).
- A free animator: no overlapping booking and no approved leave at that time.

Scheduling an order creates the booking and marks the order scheduled in one transaction. `bookings.order_id` is unique, so a double click can't make two bookings.

Customer matching, the same for site orders, scheduling and "Ново парти": normalise the phone to `+359…`, then match on it. A match links to that customer even if the parent's name is written differently; the booking screen shows the name the order used.

Indexes, each for a named query:

- `bookings(starts_at)`: the day board and search load by time.
- `bookings(animator_id, starts_at)`: "My parties", clash checks and free animators.
- `leave_requests(animator_id, starts_at)`: leave overlapping a day or a booking.
- `orders(scheduled, received_at)`: the inbox list.

The seed turns `studio/data.js` into rows, with dates relative to today's Sofia date, so "today" always has the six sample parties.

### API

All under `/api`, JSON only. Writes refuse a body that isn't `application/json`. The session cookie is httpOnly and `SameSite=Lax`, so another site's form can't post with it. No session: 401. Owner-only routes answer 403 to animators.

| Endpoint | Who | In | Errors |
| --- | --- | --- | --- |
| `POST /auth/login` | anyone | `{ login, password }` | 401 wrong login |
| `POST /auth/logout` | logged in | | |
| `GET /me` | logged in | | |
| `GET /day?date=YYYY-MM-DD` | owner | | 400 bad date |
| `GET /bookings?q=` | owner | search text, 2+ characters | 400 |
| `POST /bookings` | owner | child, age, date, start, end?, package, guests, address, parent, phone | 400 |
| `GET /bookings/:id` | owner | | 404 |
| `GET /bookings/:id/free-animators` | owner | | 404 |
| `PATCH /bookings/:id/animator` | owner | `{ animatorId \| null }` | 404, 400 unknown animator |
| `POST /bookings/:id/deposit` | owner | | 404 |
| `GET /orders?filter=` | owner | `new \| needs_info \| no_animator \| scheduled` | |
| `PATCH /orders/:id` | owner | `{ address }` | 404, 409 already scheduled |
| `POST /orders/:id/schedule` | owner | `{ animatorId? }` | 404, 409 already scheduled, 422 no address |
| `POST /site-orders` | anyone | the order fields in `studio/data.js`; email optional | 400, 429 |
| `GET /leave?state=` | owner: all, animator: own | | |
| `POST /leave` | animator | `{ startsAt, endsAt, wholeDays, reason? }` | 400 ends before starts |
| `POST /leave/:id/decision` | owner | `{ decision: 'approve' \| 'decline', note? }` | 404, 409 already decided, 400 decline without note |
| `POST /leave/:id/cancel` | own animator | | 404, 409 not pending |
| `GET /customers?filter=&q=` | owner | | |
| `GET /customers/:id` | owner | | 404 |
| `GET /me/parties?from=&to=` | animator | Sofia dates | 400 |
| `GET /me/parties/:id` | animator, own only | | 404 |
| `GET /me/pay?month=YYYY-MM` | animator | | 400 |
| `PUT /me/pay/:month/check` | animator | `{ state, note? }` | 409 month over, 400 disputed without note |

Site orders: text fields have length caps (names 80, address 200, note 500), guests 1–200, age 1–17. The limit is 5 per client address per 10 minutes, then 429.

### Responses

Each endpoint returns its own response type, never a database row. No response carries `password_hash`, `login` or another user's session.

- `GET /me` and login: `{ id, name, role }`.
- `GET /day`: `{ date, lanes: [{ animator: { id, name, skill }, leave: [{ from, to }], tickets: Ticket[] }], problems: [{ kind: 'clash' | 'unassigned', bookingId, free: [{ animatorId, name, freeAfter? }] }], summary: { parties, unassigned, depositsMissing, clashes } }`.
- `Ticket` (owner): `{ id, start, end, child, age, package, deposit, flags }`. `deposit` is `{ kind: 'missing' } | { kind: 'received', at, by }`.
- `GET /bookings/:id` (owner): the ticket plus address, address note, guests, parent, phone, email, steps, providers, messages, and `family: { id, name, tags, children, pastParties }`.
- `GET /me/parties` and `/me/parties/:id` (animator): `{ id, date, start, end, child, age, package, guests, address, addressNote, parent, phone, depositMissing, inLeave }`. Nothing else.
- `GET /leave` (owner): each request with `animator: { id, name }` and `cover: [{ bookingId, child, when }]`. For an animator: their own requests, without other animators.
- `GET /me/pay`: `{ month, parties: [{ date, child, package, hours, state }], amount: null, bonus: null, check: { state, note } | null }`.

Example call from the day board, when the owner presses "Депозитът е получен":

```ts
const ticket = await bookingsApi.markDepositReceived(bookingId);
// POST /api/bookings/b5/deposit → { id: 'b5', …, deposit: { kind: 'received', at: '…', by: 'Owner' }, flags: [] }
```

### Screen actions

Every action and search on the approved screens, and what serves it.

| Screen | Action | Served by | Who |
| --- | --- | --- | --- |
| all owner screens | "Търси парти" | `GET /bookings?q=` | owner |
| `ops-day` | previous, today, next day | `GET /day` | owner |
| `ops-day` | Ден / Седмица | week view is out of this release; the toggle is not shown | |
| `ops-day` | "Ново парти" | `POST /bookings` | owner |
| `ops-day` | free animator buttons in the problem strip | `problems[].free` from `GET /day`, then `PATCH /bookings/:id/animator` | owner |
| `ops-day` | "Депозитът е получен" | `POST /bookings/:id/deposit` | owner |
| `ops-day` | "Отвори" | route `/bookings/:id` | owner |
| `booking` | "Маркирай като получен" | `POST /bookings/:id/deposit` | owner |
| `booking` | "Напомни пак", "Имейл" | `mailto:` with the reminder text; nothing is sent by the app | owner |
| `booking` | "Обади се" | `tel:` | owner |
| `booking` | "Смени" | `GET /bookings/:id/free-animators`, then `PATCH /bookings/:id/animator` | owner |
| `inbox` | filter chips | `GET /orders?filter=` | owner |
| `inbox` | "Обади се" | `tel:` | owner |
| `inbox` | "Отговори" | `mailto:` when the order has an email, otherwise `tel:` | owner |
| `inbox` | add address | `PATCH /orders/:id` | owner |
| `inbox` | "Насрочи партито" (with an optional animator) | `POST /orders/:id/schedule` | owner |
| `leave-requests` | "Одобри", "Одобри и намери заместник" | `POST /leave/:id/decision`, then the free-animator picker per covered party | owner |
| `leave-requests` | "Откажи" | `POST /leave/:id/decision` with a note | owner |
| `customers` | filter chips, search | `GET /customers` | owner |
| `customers` | open a family | `GET /customers/:id` | owner |
| `customers` | "Пиши на родителя" | `mailto:` or `tel:` | owner |
| `customers` | open an order | route `/inbox?order=<id>` | owner |
| `my-parties` | "Навигация" | a Google Maps search link with the address; no API | animator |
| `my-parties` | "Обади се" | `tel:` | animator |
| `my-parties` | copy address | the browser clipboard | animator |
| `my-leave` | Цели дни / Няколко часа, dates, reason | form state | animator |
| `my-leave` | parties inside the chosen time, 4-week calendar | `GET /me/parties?from=&to=`, `GET /leave` | animator |
| `my-leave` | "Изпрати на собственика" | `POST /leave` | animator |
| `my-leave` | "Отмени заявката" | `POST /leave/:id/cancel` | animator |
| `my-pay` | previous, next month | `GET /me/pay?month=` | animator |
| `my-pay` | "Списъкът е верен", "Има грешка" | `PUT /me/pay/:month/check` | animator |

### Screens

Each follows its approved screen in `studio/candidates/opus/`. `DESIGN.md` owns colors, fonts and radius; nothing here restates them.

| Screen | Route | Follows |
| --- | --- | --- |
| Login | `/login` | no studio screen: shadcn card, input and button in the app shell |
| Day board | `/day/:date` | `ops-day.html` |
| Booking | `/bookings/:id` | `booking.html` |
| Order inbox | `/inbox` | `inbox.html` |
| Leave requests | `/leave` | `leave-requests.html` |
| Customers | `/customers` | `customers.html` |
| My parties | `/me/parties` | `my-parties.html` |
| Request leave | `/me/leave` | `my-leave.html` |
| My pay | `/me/pay/:month` | `my-pay.html` |

The "Ново парти" form, the free-animator picker, the decline dialog and the pay-error dialog have no drawn screen. They use the shadcn parts named for them in `DESIGN.md`'s Components table. If one needs more than those parts, it goes back to the studio first.

### Components

Built before this plan is approved, in the components stage (`greenfield-mode/references/components.md`): `web/` with shadcn/ui themed by `design/shadcn.css`, every row of `DESIGN.md`'s Components table (44 rows from Opus), and a gallery at `/_components` that the user accepts. Every screen in the build order uses these components. A screen that needs a part the gallery doesn't have goes back to design first.

## Decisions

All decided by the user on 2026-09-27, each the recommended option unless noted.

- Stack: React + Vite frontend, NestJS server, SQLite through Prisma, one npm workspace. Why: matches the `write-code` rules, so the test covers the whole kit; SQLite needs no database server for fake, small data. Evidence: `plugin/skills/write-code/SKILL.md` ("Defaults for React/TypeScript and NestJS"); `node -v` printed `v24.11.1`. Rejected: Postgres in Docker (one more thing to start), Next.js (leaves the NestJS rules untested).
- Components: shadcn/ui for the parts `DESIGN.md` marks `shadcn`, themed only by `design/shadcn.css`; hand-built parts for the rest. Decided by: user ("use shadcn skills to pull relevant components"). Evidence: the bridge was tested in a throwaway Vite + shadcn 4.21 app; the button, input, card and badge rendered in the approved colors, fonts and radius (`temp/verification/pipeline-test/shadcn-bridge.png`).
- Scope: all eight approved screens, in the build order below. Why: the point is to test the pipeline on the whole design.
- Login: seeded users with a password each, server session in an httpOnly, `SameSite=Lax` cookie. Why: D3–D5 need real sessions to test. Rejected: a "pick who you are" screen, which proves nothing about access.
- Leave that covers bookings (D22): approving keeps the animator and flags a clash until the owner changes it; "Одобри и намери заместник" opens the picker. Why: nothing changes silently. Rejected: removing the animator on approval.
- Site orders (D15): a public `POST /api/site-orders` with the fields from `studio/data.js`, plus seeded orders. Why: the real form fields are unknown (`PRODUCT.md`).
- Party length: a new booking without an end time gets 2 hours; the owner can change it. Why: there is no package length data. Rejected: lengths per package.
- Sending messages: every call, email, reply and reminder opens a `tel:` or `mailto:` link; the app sends nothing. Why: approval doesn't allow writing to outside systems (`plugin/skills/greenfield-mode/SKILL.md`), and Viber's API is an open question.
- Language: Bulgarian only, no translation layer. Sofia time as set out in "Dates and times".
- Out of this release: the week view on the day board, automatic animator choice, Viber sending, AI birthday messages, subcontractor requests, Google Calendar sync, corporate parties, feedback and animator pay tracking, any money amount. All are owner ideas or unknowns in `PRODUCT.md`.

## Build order

1. Workspace around the existing `web/`, database, seed, the Sofia time module, login, and the app shell with the two role menus (D1, D3–D5, D31 for what exists).
2. Day board read-only: lanes, tickets, flags, problem strip with free animators, summary (D6–D9).
3. Deposit, change animator, the booking screen, "Ново парти" and search (D10–D14).
4. "My parties" for animators, reusing the ticket (D2, D27; D28 after step 5).
5. Leave: request with the calendar, cancel, approve with cover, decline (D21–D24, D28, D29).
6. Order inbox: site order endpoint, filters, add address, schedule (D15–D20).
7. Customers: filters, search, family history, birthdays (D25, D26).
8. My pay: month list and check (D30).
9. Look pass: token check, side-by-side captures and the `design-critic` score (D31, D32).

Each step ends with the type check, lint, unit tests, and Playwright driving the step's Done-when lines at 1440 and 390, with screenshots in `temp/verification/partyfox-app/`.

## Open questions

- What has the paid CRM vendor already delivered? (`PRODUCT.md`.) Doesn't block this test build; it blocks any real use.
- Real site form fields and the deposit rule. The plan uses the fields in `studio/data.js`. Blocks nothing now.
- May the owner see each animator's pay check (confirmed or disputed)? No approved screen shows it. Blocks nothing in this release.
- `.agents/PROJECT.md` says this repo has no JavaScript app. After step 1 it will; its Commands and Checks sections need the app's commands.
