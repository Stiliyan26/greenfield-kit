---
name: design-interface
description: Design a product's screens in the local studio - one model (or up to three) designs every screen in React + shadcn with real content at three sizes, the user compares, tunes and approves, and the approved screens are exported as a design pack (rendered HTML, CSS, PNGs) that the build reads. Also small changes inside an approved design. Use for a new product, a full redesign, or new screens and flows.
---

# Design an interface

Read the product brief, the existing code and `DESIGN.md` if it exists.
The client brief wins over every reference file.

The studio is where the user sees, tunes and approves work. This skill owns
the studio engine (`assets/studio-engine/`), the studio app template
(`assets/studio-app/`) and the scripts (`scripts/`). `<skill-root>` is the folder of this `SKILL.md`; `<scripts>`
is its `scripts/` folder. Formats, views and scripts:
[studio.md](references/studio.md).

## Pick the path

| Situation | Path |
|---|---|
| An approved `DESIGN.md` exists and the screens are new | Small change |
| New product, or full redesign | New look |

## Small change in an approved system

Build new screens from the existing screens, `src/design/parts/` and
`design/tokens.css`. Do not invent a new look.

1. **Reuse.** Look outside only for a pattern the product does not have.

   Done when each new screen uses only existing parts and tokens, or you
   have named the missing pattern.

2. **Show and check.** Show the change in the studio or as a capture. Run
   `check_tokens.py` on the files you changed.

   Done when `check_tokens.py` prints `0 problems`.

## New look

A visual identity needs visible evidence. A brief with requirements does not
settle palette, type or composition. Permission to build a prototype does
not approve a look.

One model, or up to three, design the whole product on their own, in
React + shadcn. Each design is judged on every real screen at three sizes,
not on a sample page. The approved code is the front end, so nothing is
redrawn later.

1. **Frame the task.** Write a short brief that separates what the client
   said, what the operator proposed and what is unknown. Name the users,
   their devices and main tasks, and the states that change the screens.
   List every screen the brief names, with its role and requirement. Mark
   the difficult ones: dense data, a conflict, long real-language text. Read
   `studio/taste.md` if it exists. Ask about existing branding and about
   examples the user likes or dislikes. Do not ask for fonts, hex codes or
   spacing. Ask how many models design, and which ones.

   Leave detailed architecture until the user has chosen an experience.
   Check only the facts that limit the design: roles, private data and
   external integrations.

   Done when the brief, the screen list and the model count are written.

2. **Research in two passes.** Use Mobbin MCP (`search_screens`,
   `search_flows`) when it is connected. Retry a failed search once, then
   report it.
   - Pass 1, the task: find 3 to 5 production screens that solve the same
     job ("staff schedule day view", not "modern dashboard"). Learn
     hierarchy, density and interaction.
   - Pass 2, the finish: find 3 to 5 polished screens from other
     categories. Learn one concrete detail of type, color or surface from
     each.
   - Look at every image, not only the titles. Download each useful
     `image_url` into `studio/references/`. The links expire after 30 days.
   - Add each image to `references` in `project.json`: the result's
     `mobbin_url` in `url`, and a one-line note on what to learn and what
     not to copy.
   - If Mobbin is not available, use the user's examples or other real
     products, and say so. Never invent a citation.

   Done when each image is saved and listed with its note.

3. **Set up the studio with facts, not design.** If `studio/` exists,
   inspect it. Otherwise run:

   ```
   python3 <skill-root>/scripts/init_studio.py <project-root> --name "<product name>"
   ```

   It creates `studio/` and `studio/app/` (a Vite + shadcn app with every
   shadcn part installed). It refuses to overwrite. It needs npm. Do not
   copy another project's product files or approved design.
   - In `project.json`, set `language`, `scripts`, the three status colors
     with their meanings (and `statusDark`), and the specimen text. Write
     studio text in English. Only screens and specimen text use the
     product's language.
   - Add one screen for each view the confirmed requirements name, with its
     `role` and `requirement`. A requirement that two roles act on gets one
     screen per role. Owner ideas and unknowns get no screen yet.
   - In `studio/app/src/data.ts`, write typed sample data: every record the
     screens need, with the difficult states the brief implies (conflicts,
     missing information, long text, unknown figures left unset).
   - Do not assign structures or styles to the models.

   Done when `check_variant.py studio` shows no problem in `project.json`.

4. **Each model designs.** Fill in [variant-brief.md](references/variant-brief.md)
   once per model. Only the variant id, the model name and the port differ.
   Start one agent per model, in parallel. Each works in its own
   `studio/app/src/variants/<id>/`. Each delivers:
   - every screen as React + shadcn code, at 1920×1080, 1440×900 and
     390×844;
   - its own look: a real typeface pair that covers the product's scripts,
     tokens in `oklch()`, a dark look and one signature detail.

   Every model gets the same brief, screen list, data, taste log and
   reference notes, and designs freely. `npm run build` in `studio/app`
   writes the candidate pages. Record the model that actually ran in each
   `variant.json`.

   Done when each model has reported and the build passes.

5. **Quality gate, before the user sees anything.** Follow
   [visual-quality.md](references/visual-quality.md).
   - Capture: `node <scripts>/capture.mjs --url <studio url> --out temp/verification/<run>`.
   - Fix what `capture.md` reports: sideways scroll, clipped text, missing
     fonts, console errors.
   - Run `check_variant.py`, `check_components.mjs` and
     `check_tokens.py --project studio/project.json studio/app/src/variants`.
   - Ask the `design-critic` agent to score the captures. Do not grade your
     own work. Send failures back to the model that made them.

   Done when every check passes and the critic scores each variant 70 or
   more. After two failed passes on one idea, replace the idea.

6. **User choice.** Run `python3 studio/server.py` and give the studio URL.
   Say what each model made, in one line each, and what you could not
   check. In the studio, each model has a tab, **Arena** shows every model,
   and a screen in the left rail shows that screen from every model.
   - The user picks a model, tunes its colors inside the contrast and status
     limits, pins comments and presses **Approve**.
   - Read `selection.json`, `comments.json` and `taste.md`. Handle each
     open comment, then mark it done.
   - Only `status: "approved"` counts. If the user approves in chat, ask
     them to press **Approve**.
   - Never call the approve API. Never write `DESIGN.md` or the `design/`
     files by hand.

   Approve writes `DESIGN.md` (with its Components table),
   `design/fonts.css`, `design/tokens.css` and `design/shadcn.css`. A later
   tune, or a change to the approved variant's files, makes a new draft.
   Tell the user why and ask for a new approval.

   Done when `selection.json` shows `status: "approved"`.

7. **Export the design pack.** Right after approval, with the studio
   running:

   ```
   node <scripts>/export_pack.mjs --url <studio url> --project . --check
   ```

   It writes `design/screens/`: one `<id>.html` per screen (rendered
   structure, copy and classes, no scripts), `app.css`, a PNG per screen at
   1440 and 390 in light and dark, and a `README.md`. `--check` proves each
   PNG matches the studio within 1%.

   The studio code never goes into the app. The pack is the reference the
   build reads, next to `DESIGN.md` and `design/tokens.css`. The studio is an
   exploration tool: its sample data and interactions are not the product.
   Build each screen in the project's stack from the pack, `DESIGN.md` and
   the tokens. Return to the studio when a new requirement changes the look.

   Done when `design/screens/README.md` shows every render as ok.

8. **Clean up.** Delete `temp/verification/<run>/` and
   `temp/verification/design-pack/`. Nothing reads them again.

   Done when neither folder exists.

If the browser or Playwright is not available, say that visual quality is
unchecked. Do not present candidates as reviewed.

## Rules for every screen

- Include loaded, empty, long-content, loading, save or error, and
  permission states where they matter.
- Give keyboard focus a visible style.
- Design the phone layout as its own arrangement, not a squeezed desktop.
- Use [choose-a-look.md](references/choose-a-look.md) to make deliberate
  visual choices.
- Use the `shadcn` skill for shadcn parts.

The skill is reusable. It holds no product's brand, screens or sample data.
`server.py` finds the engine in `~/.claude/skills/` or in a project's
`.claude/skills/`.
