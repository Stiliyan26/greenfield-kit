# PartyFox — design brief (studio-free version)

Paste everything below the line into Claude Design, claude.ai, or any other
tool. It carries the same product facts and design constraints the three models
got in the kit's studio, minus the parts that only work inside this repo
(`/_studio/frame.js`, `data.js`, `check_variant.py`, `check_tokens.py`,
`capture.mjs`).

---

You are designing a product on your own. Give me your own best answer — your
own structure and your own look. Design every screen listed below, each at
1920×1080, 1440×900 and 390×844.

## The product

PartyFox runs children's parties in Bulgaria. The owner moves one booking
through: incoming site order → scheduling → animator assignment → parent
message → external providers → deposit check → party day → feedback → month-end
pay. Today all of this is scattered across email, Google Calendar, Viber, bank
checks and paper forms.

Confirmed needs:

- Site orders arrive in one inbox.
- Each animator sees correct party times and a usable address.
- Animators request leave; the owner approves it.
- Owner and animator can see when a deposit is missing, with a clear red warning.
- The owner can find customer history, repeat families, large orders and upcoming birthdays.
- Animators can see their own pay, so month-end checking takes less manual work.

Not confirmed, don't design for them: automatic animator choice, one-click
Viber sending, AI-drafted birthday messages, one-click subcontractor requests.

Unknown, so show them as unset rather than inventing a number: the deposit rule,
the animator's cut, the bonus formula, permission details, Google sync, Viber
API feasibility, corporate party flow. Never show a money figure.

## Screens

| id | Label | Who | What it must answer |
| --- | --- | --- | --- |
| `ops-day` | Оперативен ден | Owner | The owner moves each booking through scheduling and animator assignment. |
| `inbox` | Входящи заявки | Owner | Site orders arrive in one inbox. |
| `booking` | Парти | Owner | Owner and animator see when a deposit is missing, with a clear red warning. The owner marks a deposit received. |
| `leave-requests` | Заявки за отпуск | Owner | Animators request leave; the owner approves it. |
| `customers` | Клиенти | Owner | The owner finds customer history, repeat families, large orders and upcoming birthdays. |
| `my-parties` | Моите партита | Animator | Each animator sees correct party times and a usable address. |
| `my-leave` | Заявка за отпуск | Animator | Animators request leave; the owner approves it. |
| `my-pay` | Моето заплащане | Animator | Animators see their own pay. |

## Product rules

- The owner approves leave and marks a deposit received. Animators can do neither.
- An animator sees only their own parties and their own pay, plus the
  missing-deposit warning.
- Only a missing deposit may be solid red. Nothing else on any screen.
- A clash, an unassigned party, or leave that needs cover uses the warning amber.
- Money figures stay unset until someone supplies the rule.

## Status colours — one meaning each, on every screen

| Token | Meaning | Value |
| --- | --- | --- |
| danger | Only a missing deposit | `oklch(0.52 0.19 27)` |
| warning | Animator clash, unassigned party, or leave needing cover | `oklch(0.52 0.12 70)` |
| ok | Deposit received, party confirmed | `oklch(0.5 0.12 150)` |

Keep your own primary, secondary and accent colours at least **30° of hue** away
from danger and **20°** away from warning, so a status never reads as branding.

## Your look

Pick one and apply it everywhere:

- A real Google Fonts pair that covers **Cyrillic** — check it before you commit.
- Every colour in `oklch()`, defined as CSS custom properties on `:root`.
- A radius scale.
- One signature detail that makes the design yours.

Use only tokens in the screens: `var(--color-…)`, `var(--status-danger|warning|ok)`,
`var(--font-display)`, `var(--font-body)`, `var(--radius-…)`. No raw hex, no
font name written inline. Mix tints with `color-mix(in oklab, …)`.

## Content — all visible text in Bulgarian

Use this data, so the design is judged on the same content. Don't add records.

- Day: **Събота, 27 септември**, hours 9:00–21:00.
- Animators: Ема (клоун / балони), Иван (фокусник), Мая (лицева рисунка), Симо (пират / игри).
- Мая has approved leave 12:00–15:00.
- Bookings:
  - 10:00–12:00 · Алекс, 6 г. · Пирати · ул. "Райна Княгиня" 14, София · Ема · deposit paid · confirmed
  - 15:00 · Давид, 8 г. · Наука · Иван · **clash: Иван is booked twice at once**
  - 16:00 · Софи, 4 г. · Балони · **deposit missing**
  - One party with **no animator assigned**
- Specimen text: display "Оперативен ден", heading "Събота, 27 септември · 6 партита",
  body "Депозитът на Софи не е получен. Иван е насрочен на две партита едновременно.",
  label "Без аниматор · 1", search "Търси парти".
- Status labels: ok "Депозит платен", warning "Застъпване", danger "Депозит липсва".

Show the hard states. Don't hide the clash, the missing deposit or the
unassigned party to make a screen look tidy.

## Layout rules

- Each screen's main job must be visible in the **first screenful** at all three
  sizes, with no scrolling.
- Design the phone as its own arrangement, not a squeezed desktop.
- No sideways scroll. No text under 11px.
- Keyboard focus gets a visible style. Buttons may be mock-ups but must look real.

## Already rejected — don't repeat

- An empty-window row in the day view, like "— празен прозорец 9:00–10:00 —
  Следващо 10:00 до 12:00 Алекс".

## Tell me at the end

- Your look in one line, and its signature detail.
- One line per screen: what it shows and the main design decision.
- Anything in the data you found missing or inconsistent.
