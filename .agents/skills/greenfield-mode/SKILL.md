---
name: greenfield-mode
description: Run a new product from rough brief through competing local designs, user choice, architecture, and verified feature delivery. Use for a new product or a full restart of its design.
mode: true
---

# Greenfield mode

In commands below, `<skill-root>` means the directory containing this `SKILL.md`.

Stay responsible for the whole project across turns. A request to build authorizes preparation and iteration; it does not choose a visual direction for the user. Keep the current stage and next action visible in the conversation. Continue useful work between the user's real product and taste decisions.

## 1. Ground the work

Read the supplied brief and any project instructions or product facts that exist. Separate confirmed requirements, suggestions, and unknowns. Ask only about gaps that would materially change a design or feature. Calibrate taste before building screens: find out whether a brand, visual references, or strong likes and dislikes exist. If none are available, propose distinct directions and label their visual choices as provisional; do not make the user supply hex codes or font names. Do a short feasibility pass on data, privacy, permissions, and integrations before producing visual concepts; leave detailed architecture for after the design choice.

## 2. Explore with real alternatives

Use `design-interface` for the design work and its [visual quality gate](../design-interface/references/visual-quality.md) before presentation. Build two or three substantially different, locally viewable concepts around the _same_ representative tasks and data. Choose those tasks from the current product brief. Change composition, hierarchy, density, and interaction, not only colors. Give each concept a short direction contract: product-specific idea, screen composition, named palette, type roles, and the one detail that makes it recognizable. Use `frontend-design` when available to challenge generic defaults before writing UI code; use `impeccable` or an equivalent critique after rendering. These skills guide judgment; merely installing or naming them is not a quality check. Use separate directories or files for parallel candidates so agents cannot overwrite one another. When independent agents and different models are available, give each the same brief and one isolated candidate; disclose which models actually ran. The coordinator checks factual accuracy and presentation quality on actual desktop and phone captures, revises weak work, then shows every viable candidate to the user. The coordinator never chooses or merges visual directions on the user's behalf.

At the start of a new project, read [references/new-project.md](references/new-project.md). If it has no local comparison interface, run `python3 <skill-root>/scripts/init_studio.py <project-root> --name "<product name>"`. The script creates a neutral `studio/` shell, not product designs. Fill `studio/project.json` with the product's actual representative screens and two or three distinct candidate designs before opening the interface. Run `python3 studio/server.py` from the project root and open the URL printed by the server. Let the user compare the candidates, tune hue, harmony and typography, inspect phone view, and save notes. Read `studio/selection.json` after they edit it; do not guess their choice from chat descriptions. Present revisions in the same interface.

Only treat a design as approved when the user explicitly approves a named revision in chat or presses **Approve this revision** in the studio. A `draft` selection is feedback, not approval. If feedback calls the work generic, revise the concepts' underlying visual systems and composition in the same studio; changing shadows or accent colors alone is insufficient. A later edit returns the revision to draft. The studio's choice is the visual handoff; it does not authorize publishing or external data writes.

## 3. Define the system after the choice

Use `plan-feature` on the approved experience. Define roles and permissions, entities, screen data needs, API contracts, error states, integrations, and a smallest useful release. Mark client requirements, operator ideas, and unanswered questions separately. Ask for the few consequential product decisions; continue writing the independent parts while waiting. Save the agreed plan under `docs/plans/<project>/` with requirement IDs and a link to the approved studio revision. Use a fresh read-only reviewer when the architecture has meaningful risk.

## 4. Deliver without visual drift

Use `deliver-feature` to turn requirement IDs into small, working feature tasks. Each task carries the selected design revision and a browser-visible completion check. Extract reusable tokens and components from the approved screens; do not replace their composition with a default component kit. If a new requirement changes the approved experience, return that part to the studio for another revision. Check real desktop and phone behavior, interaction, and persistence before reporting a slice done.

An existing project may already have a suitable studio; inspect it before running the initializer. Never overwrite an existing `studio/`. A skill or model may help design, but a written prompt alone cannot substitute for viewable alternatives.
