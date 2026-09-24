# Design critique of the PartyFox candidates before migration

Run: 2026-09-24. Critic: the instructions in `.agents/agents/design-critic.md`, run through a general-purpose agent because the `design-critic` agent type only loads in a new session. Read-only.
Captures: `before/roster-*.png`, `before/board-*.png`, `before/agenda-*.png` (taken straight from the HTML files; no `capture.md`, no `taste.md`).

| Candidate | Originality | Design quality | Craft | Function | Total | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| Roster | 2 | 2 | 1 | 2 | 36 | revise first |
| Board | 2 | 3 | 3 | 3 | 52 | revise first |
| Agenda | 3 | 3 | 2 | 3 | 56 | revise first |

## Roster
- Craft 1: in `roster-1440.png`, Иван row, the 14:00–16:00 and 15:00–17:00 bookings are drawn on top of each other. The "застъпване 15:00–16:00" label covers both, so "Гергана" and "Давид" can't be read. The last hour label is cut to "21:". Мая's grid lines stop short under her leave chip.
- `roster-390.png` is the desktop grid squeezed: hour labels run together, Никола's card and Софи's bar are cut at the edge, and Иван's bookings are hidden under the label.
- Design quality 2: saturated blue, purple and orange booking bars outweigh the pale deposit bar. So the deposit is not the loudest thing on the grid, which the contract promised.
- Top fixes: split overlapping bookings into sub-lanes and move the clash label out of the bars; make scheduled bars one quiet style; design the phone view on purpose.

## Board
- A standard kanban look with a green accent. Nothing sticky-note about it. Two of four columns are empty and take half the width.
- Никола's card doesn't say why it is in "Проблем". Мая's leave is missing. The brick stripe on "Нова поръчка" sits close to the deposit red.
- The critic suspected sideways scroll at 390. The capture report later confirmed 14 px.

## Agenda
- The most distinct seed: serif time numerals and "празен прозорец" gap notes read like a call sheet.
- The clash banner sits under both cards instead of bridging them. The next event is barely emphasised.
- `agenda-390.png` keeps the desktop two-column layout: "Партита6" collides, cards shrink to about 165 px, and names break mid-phrase.

## Closing
The user's diagnosis is confirmed. The three differ in layout but share one visual system: system sans, white rounded 1 px cards, the same pills and animator dots, and the same footer sentence. None shows its contract's signature detail.

## What the migration changed (after/)
- Roster: overlapping bookings now sit on separate tracks. The clash label moved into Иван's name cell. The cut "21:00" label, the short grid lines under Мая and the thick left borders are fixed. Animator colors are gone.
- All three: every color, font and radius now comes from the studio world. In the layout round that world is neutral grey. Board's Problem column no longer uses red.
- Board and specimen: sideways scroll at 390 fixed.
- Not changed, left for the next design round: the phone layouts of Roster and Agenda, Board's empty columns, and each layout's missing signature detail.
