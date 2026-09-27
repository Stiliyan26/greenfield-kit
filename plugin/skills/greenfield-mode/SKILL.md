---
name: greenfield-mode
description: Run a new product from rough brief through competing local designs, user choice, shadcn components built from the chosen design, architecture, and verified feature delivery. Use for a new product or a full restart of its design.
mode: true
icon: rocket
color: green
---

# Greenfield mode

`<skill-root>` below means the folder that holds this `SKILL.md`.

You own the whole project across turns. A request to build lets you prepare
and iterate. It doesn't choose a look for the user. Keep the current stage and
the next action visible in the conversation. Keep working on independent
parts while the user makes product and taste decisions.

## 1. Ground the work

Read the brief and any project instructions or product facts. Separate
confirmed requirements, suggestions and unknowns. List every view the
confirmed requirements name; each becomes a screen in the studio, so the user
sees the whole product, not one sample page. Ask only about gaps that
would change a design or feature a lot. Ask whether a brand, logo, or examples
the user likes or dislikes exist. Don't make the user name fonts or colors;
the models propose them. Read `studio/taste.md` if it exists. Do a short
feasibility pass on data, privacy, permissions and integrations. Leave
detailed architecture until after the design is chosen.

## 2. Design in the studio

Read [references/studio.md](references/studio.md) for the studio's format,
views and scripts. In a project without `studio/`, run:

```
python3 <skill-root>/scripts/init_studio.py <project-root> --name "<product name>"
```

It creates only the content folder. The engine stays in this skill and is
shared by every project. Then follow [references/new-project.md](references/new-project.md).

Use `design-interface` for the design work. Its order is required:

1. Research in two passes: the task pattern, then polished products from other
   categories. Save the images and notes in `studio/references/` and
   `project.json`.
2. You write the product facts: `project.json` with every screen, and one
   shared data file. You design nothing yourself.
3. Each model that runs, up to three, designs the whole product on its own:
   every screen at 1920×1080, 1440×900 and 390×844, plus its own look. Every
   model gets the same brief, filled in from
   [references/variant-brief.md](references/variant-brief.md). Don't assign
   structures or styles; the user compares how models design.
4. Before the user sees it: capture, fix what the capture report and checks
   find, and get a score from the `design-critic` agent.
5. The user compares the models in the studio, picks one, tunes its colors
   and approves. The **Components** view (`T`) shows how each model builds
   every screen from its parts, and which parts it reuses.

Use `frontend-design`, where it's installed, to challenge defaults. Use
`impeccable` to critique rendered work. Naming a skill is not a check. Only
captures, the checks and the critic count.

One model gives one variant. For two or three, start one agent per model (for
example with the Agent tool's `model` option), each with its own variant id
and folder, `studio/candidates/<variant>/`. Each writes `variant.json` with
the model that actually ran. Say which models ran. You check facts and
quality on real captures before showing anything. You never choose or merge
variants for the user. If a variant fails its checks, send it back to the
model that made it.

Start the page with `python3 studio/server.py` and give the user the URL it
prints. Read `selection.json`, `comments.json` and `taste.md` after they work
in it. Don't guess their choice from chat.

Only **Approve** in the studio counts. If the user approves in chat, ask them
to press it; the button runs the final checks and writes the files. A draft is
feedback. If the user calls the work generic, ask the model to change the
structure or the look itself; shadows and accents won't fix it. Approval writes
`DESIGN.md` (with its Components table), `design/fonts.css`, `design/tokens.css` and `design/shadcn.css`. It doesn't allow publishing or writing to outside systems.

## 3. Build the components

Right after approval, before planning, turn the approved design into real
components with the `shadcn` skill. Follow
[references/components.md](references/components.md): set up shadcn with the
theme from `design/shadcn.css`, add every part the Components table marks
`shadcn`, build the custom parts from the approved screens, and show all of
them on one gallery page. Check the gallery with the token check, captures
and the `design-critic` agent, then give the user its URL. Move on only after
the user accepts it. This fixes the frontend as React, Tailwind and
shadcn/ui; the backend is still open for the plan.

## 4. Define the system after the choice

Use `plan-feature` on the approved design and its components. Define roles and permissions, data,
screen data needs, API contracts, error states, integrations and the smallest
useful release. Mark client requirements, operator ideas and open questions
separately. Save the plan under `docs/plans/<project>/`, with requirement IDs
and links to `DESIGN.md` and the approved studio revision. The plan names
which built components each screen uses. Run the `review` skill in plan mode
on the plan to check risky architecture.

## 5. Deliver without visual drift

Use `deliver-feature` to turn requirement IDs into small working tasks. Every
task builds screens from the components of stage 3, `design/tokens.css` and
the approved screens. It doesn't invent colors, fonts or components. Run `check_tokens.py --tokens
design/tokens.css` on changed UI files. If a new requirement changes the look,
send that part back to the studio for a new revision. Check real desktop and
phone behavior, interaction and saved data before calling a task done.

An existing project may already have a studio. Inspect it before running the
initializer, which refuses to overwrite one.
