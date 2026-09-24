# Designing a new product

Design choices need visible evidence. A brief with business requirements does not settle palette, typography, or composition. Permission to build a prototype does not approve a visual identity.

## Before concepts

Write a short brief that separates what the client said, what the operator proposed, and what is unknown. Identify the users, their main tasks, devices, and the one difficult screen that will expose weak layout decisions. Ask about existing branding and examples the user likes or dislikes when that would change the work. Do not require the user to name fonts, hex codes, or spacing values.

Check obvious feasibility constraints with `plan-feature`: roles, private information, important data, and external integrations. Leave detailed architecture until the user has chosen an experience.

## Make a fair comparison

Run two rounds in the studio, as `design-interface` describes. Round 1 compares
two or three layouts in the neutral world. Round 2 compares two or three
complete worlds on the chosen layout. Every candidate uses the same content,
roles, tasks and states. A swatch board alone can't show whether a dense
calendar works, so each world is judged on a real screen and on its specimen.

If parallel agents are available, give each its own output file and the same
brief, data, difficult state and reference notes. Ask for different
structures in round 1 and different type, color and surfaces in round 2.
Different models help when they're available; record which models actually
ran. Check each result for facts and basic usability before the critic sees
it.

In the studio the user picks a layout and a world, tunes colors inside the
contrast and status limits, pins comments, and approves. A saved selection
with `status: "draft"` is work in progress. Only `status: "approved"` from the
studio's **Approve** button locks the design; after an approval in chat, ask
the user to press it. A tune after approval makes a new draft. If you change
an approved candidate or world, tell the user and ask for a new approval.

## After approval

Approval writes `DESIGN.md` at the project root and `design/tokens.css`. They
record the colors, both typefaces, the type scale, radius, contrast results,
status meanings and the approved screens. Extract components from those
screens. Build later screens with the same tokens. Return to the studio when a
new requirement changes the look.

The studio is an exploration tool; its sample data and interactions are not a
product. The real app uses the stack chosen in the approved plan. Don't
install a framework just to show options.
