# Run notes: PartyFox studio from skills alone, one model (Claude Opus 5.5)

Project: `examples/partyfox-opus-solo/`. Evidence: `temp/verification/opus-solo/`.
Lead: Claude Opus 5.5 (this agent). Designer: a separate Claude Opus 5.5 subagent
(Agent tool, `general-purpose`, model `opus`) that got only the filled brief
`variant-brief-opus.md`.

I did not open `examples/partyfox/`, other `examples/` folders, `temp/archive/` or
other evidence folders. Nothing from them appeared in any tool output.

## Steps

| Skill step | Status | Note |
| --- | --- | --- |
| greenfield-mode 1: ground the work (confirmed / ideas / unknowns, list views) | done | See "Grounding" below. |
| greenfield-mode 1: ask about brand, logo, liked examples | skipped | User not available. Assumed: no brand, no logo, no examples. |
| greenfield-mode 1: read `studio/taste.md` | done | Did not exist before init; after init it is the empty template. |
| greenfield-mode 1: feasibility pass | done | See "Feasibility" below. |
| studio.md / new-project.md 2: `init_studio.py` | done | `Created .../examples/partyfox-opus-solo/studio`. |
| new-project.md 3: fill `project.json` (language, scripts, status, specimen, parts) | done | `bg`, `["cyrillic","latin"]`, template status colors kept, specimen in Bulgarian, `/specimen-parts.html`. |
| new-project.md 4: list the screens | done | 7 screens, see below. |
| new-project.md 5: shared data file | done | `studio/data.js` (`window.PARTYFOX`). |
| design-interface 2: research pass 1 (task) | done | Mobbin MCP available. 5 kept: Deputy, Lemni, Shopify, Outlook iOS, DoorDash Dasher. |
| design-interface 2: research pass 2 (finish) | done | 4 kept: Apple Music, Codecademy, Finch, YNAB. |
| design-interface 2: download images into `studio/references/` | done | 9 `.webp` files. |
| new-project.md 7: fill `variant-brief.md` | done | `temp/verification/opus-solo/variant-brief-opus.md`. |
| new-project.md 7: start one agent per model | done | One Opus 5.5 subagent. |
| quality gate: `check_variant.py` | see below | |
| quality gate: `check_tokens.py` | see below | |
| quality gate: `capture.mjs --studio` | see below | |
| quality gate: look at screenshots, fix | see below | |
| quality gate: impeccable detect | see below | |
| quality gate: `design-critic` | see below | |
| new-project.md 9: start server, give URL | done at the end, then stopped as the task asked | |
| new-project.md 10 / SKILL 2.5: user compares, tunes, approves | skipped | Out of scope: stop before approval. |

## Grounding

Confirmed requirements (from PRODUCT.md "Confirmed needs") and the views they name:

1. Site orders arrive in one inbox → `inbox` (Owner).
2. Each animator sees correct party times and a usable address → `my-parties` (Animator).
3. Animators request leave; the owner approves it → `my-leave` (Animator) and `leave-requests` (Owner). Two roles act, so one screen each (new-project.md step 4).
4. Owner and animator can see a missing deposit, with a clear red warning → `bookings` (Owner) and the same warning on `my-parties` (Animator).
5. Owner finds customer history, repeat families, large orders, upcoming birthdays → `customers` (Owner).
6. Animators see their own pay → `my-pay` (Animator).

Owner ideas (no screens): automatic animator choice, one-click Viber, AI birthday messages, one-click subcontractor requests.

Unknowns (shown as unset in data): the paid CRM vendor's delivery, real site form fields, deposit rule, animator cut, bonus formula, permission details, Google sync, Viber API, corporate party flow.

## Feasibility (short)

- Data: bookings, orders, customers with children's names and birthdays, animator pay. Children's birthdays are personal data of minors: keep them owner-only.
- Permissions: two roles, owner and animator. Animator sees only own parties, leave and pay (assumed; "permission details" is an unknown).
- Integrations: website form (fields unknown), Google Calendar (sync unknown), Viber (API feasibility unknown), bank checks for deposits (manual mark for now). The paid CRM vendor may already cover part of this; must be checked before architecture.

## Assumptions

- A1. No brand, logo, or liked/disliked examples exist (user unavailable).
- A2. Scripts are `cyrillic` and `latin` (Latin for emails, a foreign parent, program names).
- A3. Status colors: kept the template's three oklch values. Meanings: danger = only a missing deposit; warning = unassigned party, animator clash, leave overlapping parties, unusable address, unanswered order; ok = confirmed.
- A4. The owner's "bookings" screen covers the brief's scheduling/assignment context. It is one screen; I did not add a separate calendar or booking-detail screen because the confirmed needs don't name one.
- A5. No owner-side pay screen. The confirmed need names only the animator seeing own pay; "month end checking" is the purpose, not a named owner view.
- A6. "Today" in the data is Friday 25 Sep 2026; current animator is Ива Колева (a2), chosen because her data holds a clash, a missing deposit, an unusable address and a pending leave with conflicts.
- A7. Currency EUR (Bulgaria uses the euro from 2026). All money figures are null: program prices, deposit amount, animator cut, bonus, pay totals.
- A8. Site form fields in `orders` are invented (the real fields are unknown).
- A9. Large order = many children (40+) / several animators, since prices are unset.
- A10. The lead added one test-only line to the filled brief (don't open other `examples/` folders or `temp/archive/`, don't edit skills). Otherwise the brief is the template with placeholders filled.

## Skill-doc problems found

(Numbered; most valuable output.)

1. **Placeholders in `variant-brief.md` are not defined.** The header says "only `{variant}`, `{model}` and `{port}` differ", but the template also uses `{brief}`, `{studio}`, `{data}`, `{scripts}`, `{language}`, `{rules}`, `{project}`, `{evidence}` and `{skill-root}`. Only `{skill-root}` is explained. There is no list, and nothing says where `{rules}` (product rules) comes from. I took them from the brief and `statusMeaning`.
2. **The variant brief promises what it doesn't contain.** design-interface step 4 says "The brief tells them what to avoid and how to check". The brief covers checks, but its only "avoid" guidance is `taste.md` (empty in round 1). It never points the designer to `design-interface/references/choose-a-look.md`, where the generic-design tells are listed. SKILL.md says "Use `frontend-design`, where it's installed, to challenge defaults", but nothing in the designer's brief carries that to the designer.
3. **visual-quality.md "Before building" is orphaned.** It says each model writes down its task, references, generic-template check, type pair and signature, but doesn't say where. The variant brief doesn't ask for it, so the designer's plan isn't saved anywhere the critic or lead can read.
4. **"Lead designs nothing" conflicts with `specimen.parts`.** SKILL.md 2.2 says "You write the product facts ... You design nothing yourself." studio.md says the lead writes `specimen-parts.html`, an HTML fragment of the product's own parts, "with tokens only, like a screen". That is design work by the lead, and it shows up in every model's specimen. I kept it deliberately plain.
5. **`check_tokens.py --project` can't check lead files before a variant exists.** With no `candidates/*/variant.json`, the allowed-token set is only status, font and palette tokens, so `specimen-parts.html` gave 16 `unknown-token` errors (`--color-ink`, `--radius-md`, ...). Those required core tokens (`REQUIRED_TOKENS` in `studio_export.py`) aren't in the base set. It passed only after the opus variant existed. The allowed set is also the union of all variants' tokens, so one variant can use a token only another variant defines and still pass. The quality-gate command (`check_tokens ... studio/candidates`) never checks `specimen-parts.html` at all.
6. **Research step order differs.** SKILL.md 2 lists research first, then `project.json` and data. new-project.md puts research at step 6, after `project.json` and data. Harmless, but the "required order" in SKILL.md is not the order in new-project.md.
7. **3–5 references per pass vs 7 screens.** Pass 1 allows 3–5 task references, but the confirmed needs give 7 screens and 5 different jobs (inbox, schedule, leave, CRM, pay). At 5 I had to leave leave-approval without its own reference and share Deputy with it. The docs don't say whether "3–5" is per product or per job.
8. **`project.json` validation is thinner than studio.md claims.** studio.md says "The page lists anything missing or wrong in project.json". `find_problems` only checks `name`, `screens`, `status` and variant fields. A missing `language`, `scripts`, `statusMeaning` or `specimen` produces no problem. The init template also has no `specimen` key and ships `"language": "en"` / `["latin"]`, so a lead can easily leave them wrong.
9. **Mobbin `image_url` is a short redirect link.** A plain `curl -o` without `-L` saves an 85-byte JSON/redirect body, not the image. design-interface says "Download each useful image_url" and gives no command. One line with `curl -L` would help. (My own first attempt also broke on zsh not splitting words in `set -- $pair`; that part is my error, not the docs'.)
10. **`capture.mjs --studio` changes `selection.json`.** After the capture, `selection.json` had `"screen": "inbox"`, `"variant": "opus"`, `"revision": 2` (the template has revision 1 and null screen/variant). Opening the page, even from the capture script, saves a selection and bumps the revision. studio.md presents `selection.json` as what the *user* did ("Read `selection.json` ... after they work in it. Don't guess their choice from chat"), so an agent could misread capture side effects as a user choice.
11. **The studio page itself fails the capture's clipped-text check.** `capture.md` flags the engine's own UI at 1440 and 390 ("Claude Opus 5.5's colors", the variant summary, screen names, "Complementary of #2F5D8A"). It is engine UI, not the candidate, but it is noise in the report the critic reads, and studio.md doesn't say to ignore it.
12. **Candidate folder format vs shared files.** studio.md says the folder "holds `variant.json` and one `<screen id>.html` per screen". The designer added `pf.css` and `pf.js` shared by all its screens. Nothing forbids it and every check passed (`check_tokens` scanned 9 files), but the docs neither allow nor forbid it.
13. **References rail count reads as a total.** The rail says "References 2" while `project.json` has 9. It seems to show only the references tagged with the selected screen, but the label doesn't say so.
14. **The engine's specimen shows a money figure.** The specimen body shows `09:00 14:30 1 284,50`, from engine defaults, not from `project.json`. A product whose rule is "money stays unset" still shows an invented amount on every model's specimen. `project.json` `specimen` has no field to override it.
15. **"Main job in the first screenful" vs full-page captures.** The brief says the studio shows exactly the first screenful. `capture.mjs` saves full-page shots (bookings phone is 2640px tall), so the critic judges below-the-fold content that the studio doesn't show in its frames. The docs don't tell the critic to judge the first 1080/900/844 px.
