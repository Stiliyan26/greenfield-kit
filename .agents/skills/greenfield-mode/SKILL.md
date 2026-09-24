---
name: greenfield-mode
description: Run a new product from rough brief through competing local designs, user choice, architecture, and verified feature delivery. Use for a new product or a full restart of its design.
mode: true
---

# Greenfield mode

`<skill-root>` below means the folder that holds this `SKILL.md`.

You own the whole project across turns. A request to build lets you prepare
and iterate. It doesn't choose a look for the user. Keep the current stage and
the next action visible in the conversation. Keep working on independent
parts while the user makes product and taste decisions.

## 1. Ground the work

Read the brief and any project instructions or product facts. Separate
confirmed requirements, suggestions and unknowns. Ask only about gaps that
would change a design or feature a lot. Ask whether a brand, logo, or examples
the user likes or dislikes exist. Don't make the user name fonts or colors;
that is your job in round 2. Read `studio/taste.md` if it exists. Do a short
feasibility pass on data, privacy, permissions and integrations. Leave
detailed architecture until after the design is chosen.

## 2. Design in the studio

Read [references/studio.md](references/studio.md) for the studio's format,
rounds and scripts. In a project without `studio/`, run:

```
python3 <skill-root>/scripts/init_studio.py <project-root> --name "<product name>"
```

It creates only the content folder. The engine stays in this skill and is
shared by every project. Then follow [references/new-project.md](references/new-project.md).

Use `design-interface` for the design work. Its order is required:

1. Research in two passes: the task pattern, then polished products from other
   categories. Save the images and notes in `studio/references/` and
   `project.json`.
2. Round 1: two or three layouts in the neutral world. The user chooses one.
3. Round 2: two or three complete worlds on that layout, each with a real
   typeface pair, full tokens and a signature detail. The user tunes and
   approves.
4. Before each round reaches the user: capture, fix what the capture report
   and token check find, and get a score from the `design-critic` agent.

Use `frontend-design`, where it's installed, to challenge defaults before
writing a world. Use `impeccable` to critique rendered work. Naming a skill is
not a check. Only captures, the checks and the critic count.

For parallel work, give each agent its own candidate file and the same brief,
data, difficult state and reference notes. Say which models actually ran. You
check facts and quality on real captures before showing anything. You never
choose or merge candidates for the user.

Start the page with `python3 studio/server.py` and give the user the URL it
prints. Read `selection.json`, `comments.json` and `taste.md` after they work
in it. Don't guess their choice from chat.

Only **Approve** in the studio counts. If the user approves in chat, ask them
to press it; the button runs the final checks and writes the files. A draft is
feedback. If the user calls the work generic, change the layout or the world
itself; shadows and accents won't fix it. Approval writes `DESIGN.md` and
`design/tokens.css`. It doesn't allow publishing or writing to outside
systems.

## 3. Define the system after the choice

Use `plan-feature` on the approved design. Define roles and permissions, data,
screen data needs, API contracts, error states, integrations and the smallest
useful release. Mark client requirements, operator ideas and open questions
separately. Save the plan under `docs/plans/<project>/`, with requirement IDs
and links to `DESIGN.md` and the approved studio revision. Ask a fresh
`reviewer` agent to check risky architecture.

## 4. Deliver without visual drift

Use `deliver-feature` to turn requirement IDs into small working tasks. Every
task builds with `design/tokens.css` and the approved screens. It doesn't
invent colors, fonts or a component kit. Run `check_tokens.py --tokens
design/tokens.css` on changed UI files. If a new requirement changes the look,
send that part back to the studio for a new revision. Check real desktop and
phone behavior, interaction and saved data before calling a task done.

An existing project may already have a studio. Inspect it before running the
initializer, which refuses to overwrite one.
