# Designing a new product

Design choices need visible evidence. A brief with business requirements does not settle palette, typography, or composition. Permission to build a prototype does not approve a visual identity.

## Before concepts

Write a short brief that separates what the client said, what the operator proposed, and what is unknown. Identify the users, their main tasks, devices, every screen the requirements name, and the one difficult screen that will expose weak layout decisions. Ask about existing branding and examples the user likes or dislikes when that would change the work. Do not require the user to name fonts, hex codes, or spacing values.

Check obvious feasibility constraints with `plan-feature`: roles, private information, important data, and external integrations. Leave detailed architecture until the user has chosen an experience.

## Make a fair comparison

Up to three models each design the whole product, as `design-interface`
describes. Every model gets the same brief, screen list, data, taste log and
reference notes, filled in from greenfield-mode's `variant-brief.md`, and
designs freely: structure and look. The studio shows every screen at
1920×1080, 1440×900 and 390×844, so each design is judged on real screens,
not a swatch board. Record the model that actually ran in each
`variant.json`. Check each result for facts and basic usability before the
critic sees it.

In the studio the user picks a model's design, tunes its colors inside the
contrast and status limits, pins comments, and approves. A saved selection
with `status: "draft"` is work in progress. Only `status: "approved"` from the
studio's **Approve** button locks the design; after an approval in chat, ask
the user to press it. A tune after approval makes a new draft. If you change
an approved candidate or world, tell the user and ask for a new approval.

## After approval

Approval writes `DESIGN.md` (with its Components table), `design/fonts.css`, `design/tokens.css` and `design/shadcn.css`. They record the colors, both typefaces, the type
scale, radius, contrast results, status meanings, the approved screens and
the components to build, each marked shadcn or custom. The next stage builds
those components and shows them on a gallery page
(`references/components.md`), before any planning. Build
later screens with the same tokens and components. Return to the studio when a
new requirement changes the look.

The studio is an exploration tool; its sample data and interactions are not a
product. After approval, the components stage sets the frontend up with
React, Tailwind and shadcn/ui; the approved plan chooses the rest of the
stack. Don't install a framework just to show options.
