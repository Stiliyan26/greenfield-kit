---
name: design-interface
description: Designs a product's screens in a local studio - one model (or up to three) builds every screen in React + shadcn with real content at three sizes, the user compares, tunes and approves, and the approved screens are exported as a design pack (rendered HTML, CSS, PNGs). Also adds or changes screens inside an approved design. Use when the user asks to design or redesign screens, a UI or a visual look, or to add or change screens in an approved design.
---

# Design an interface

Read the product brief, the existing code and `DESIGN.md` if it exists.
The client brief wins over every reference file.

The studio is where the user sees, tunes and approves work. This skill owns
the studio engine (`assets/studio-engine/`), the studio app template
(`assets/studio-app/`) and the scripts. `<skill-root>` is the folder of this
`SKILL.md`. Formats, views and scripts are in
[studio.md](references/studio.md); each step names the section it needs.

## Pick the path

| Situation | Path |
|---|---|
| An approved `DESIGN.md` exists, and the user adds or changes screens | Small change |
| No approved design, or the user wants a new look | New look |

## Small change in an approved system

Work in the approved variant, `studio/app/src/variants/<id>/`. Do not invent
a new look.

1. **Reuse.** Add each new screen to `project.json` first. Build each new or
   changed screen from the variant's `parts/` and tokens (studio.md,
   "Screens"). Look outside only for a pattern the product does not have.

   Done when each screen uses only existing parts and tokens, or you have
   named the missing pattern.

2. **Check.** Run `npm run build` in `studio/app`. Run `check_tokens.py` on
   the files you changed and `check_components.mjs --variant <id>`.

   Done when both checks print `0 problems`. If a check fails, return to
   step 1.

3. **Approve and export again.** A change to the approved variant returns the
   design to draft. Show the change in the studio and ask the user to press
   **Approve**. Then export the pack as in New look, step 7.

   The build reads `DESIGN.md` and `design/screens/`. Without a new export,
   they show the old design.

   Done when `selection.json` shows `status: "approved"` and
   `design/screens/README.md` shows every render as ok.

## New look

A visual identity needs visible evidence. A brief with requirements does not
settle palette, type or composition. Permission to build a prototype does
not approve a look.

One model, or up to three, design the whole product on their own, in
React + shadcn. Each design is judged on every real screen at three sizes,
not on a sample page.

Copy this checklist into the reply and tick it off:

```text
New look progress:
- [ ] 1 Brief, screen list and model count written
- [ ] 2 References saved with notes
- [ ] 3 Studio set up, project.json without problems
- [ ] 4 Every model reported, build passes
- [ ] 5 No variant marked "revise first"
- [ ] 6 User approved in the studio
- [ ] 7 Design pack exported and checked
- [ ] 8 Temporary captures deleted
```

1. **Frame the task.** Write a short brief that separates what the client
   said, what you proposed and what is unknown. Name the users, their
   devices and main tasks, and the states that change the screens. List
   every screen the brief names, with its role and requirement. Mark the
   difficult ones: dense data, a conflict, long real-language text. Read
   `studio/taste.md` if it exists. Ask about existing branding and about
   examples the user likes or dislikes. Do not ask for fonts, hex codes or
   spacing. Ask how many models design, and which ones.

   Leave detailed architecture until the user has chosen an experience.
   Check only the facts that limit the design: roles, private data and
   external integrations.

   Done when the brief, the screen list and the model count are written.

2. **Research in two passes.** Use `mobbin:search_screens` and
   `mobbin:search_flows` when the Mobbin MCP server is connected. Retry a
   failed search once, then report it.
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
   copy another project's product files or approved design. Formats:
   studio.md, "project.json" and "The studio app".
   - In `project.json`, set `language`, `scripts`, the three status colors
     with their meanings (and `statusDark`), and the specimen text.
   - Write studio text in English. Only screens and specimen text use the
     product's language. Studio text is for you and the user; the screens
     are for the product's users.
   - Add one screen for each view the confirmed requirements name, with its
     `role` and `requirement`. A requirement that two roles act on gets one
     screen per role. Owner ideas and unknowns get no screen yet.
   - In `studio/app/src/data.ts`, write typed sample data: every record the
     screens need, with the difficult states the brief implies (conflicts,
     missing information, long text, unknown figures left unset).
   - Do not assign structures or styles to the models. The user compares
     how each model designs on its own.

   Done when `check_variant.py studio` shows no problem in `project.json`.

4. **Each model designs.** Fill in [variant-brief.md](references/variant-brief.md)
   once per model. Only the variant id, the model name and the port differ.
   Set `{evidence}` to `temp/verification/<run>`. Start one agent per model,
   in parallel. Each works in its own `studio/app/src/variants/<id>/`. Each
   delivers:
   - every screen as React + shadcn code, at 1920×1080, 1440×900 and
     390×844;
   - its own look: a real typeface pair that covers the product's scripts,
     tokens in `oklch()`, a dark look and one signature detail.

   Every model gets the same brief, screen list, data, taste log and
   reference notes, and designs freely. `npm run build` in `studio/app`
   writes the variant pages. Record the model that actually ran in each
   `variant.json`.

   Done when each model has reported and the build passes.

5. **Quality gate, before the user sees anything.** Follow
   [visual-quality.md](references/visual-quality.md): the captures, the
   mechanical checks, then a score from the `design-critic` agent. Do not
   grade your own work. If a check fails, return to step 4 with the model
   that made the variant.

   Done when no variant is marked "revise first".

6. **User choice.** Run `python3 studio/server.py` and give the studio URL.
   Say what each model made, in one line each, and what you could not
   check. Tell the user how the studio shows the work:
   - Each model has a tab.
   - **Arena** shows every model.
   - A screen in the left rail shows that screen from every model.

   Then:
   - The user picks a model, tunes its colors inside the contrast and status
     limits, pins comments and presses **Approve**.
   - Read `selection.json`, `comments.json` and `taste.md` (studio.md, "What
     the agent reads back"). Handle each open comment, then mark it done.
   - Only `status: "approved"` counts. If the user approves in chat, ask
     them to press **Approve**.
   - Never call the approve API. Never write `DESIGN.md` or the `design/`
     files by hand. The approval is the user's decision, and the studio
     checks contrast and hue before it writes.

   Approve writes `DESIGN.md` (with its Components table),
   `design/fonts.css`, `design/tokens.css` and `design/shadcn.css`. A later
   tune, or a change to the approved variant's files, makes a new draft.
   Tell the user why and ask for a new approval.

   Done when `selection.json` shows `status: "approved"`.

7. **Export the design pack.** Right after approval, with the studio
   running:

   ```
   node <skill-root>/scripts/export_pack.mjs --url <studio url> --project . --check
   ```

   It writes `design/screens/`:
   - one `<id>.html` per screen: rendered structure, copy and classes, no
     scripts;
   - `app.css`;
   - a PNG per screen at 1440 and 390, in light and dark;
   - a `README.md`.

   `--check` proves that each PNG matches the studio within 1%.

   The studio code never goes into the app. The pack is the reference for
   the build, next to `DESIGN.md` and `design/tokens.css`. The studio's
   sample data and interactions are not the product.

   Done when `design/screens/README.md` shows every render as ok.

8. **Clean up.** Delete `temp/verification/<run>/`, with your captures and
   every model's captures, and `temp/verification/design-pack/`. Nothing
   reads them again.

   Done when neither folder exists.

If the browser or Playwright is not available, say that visual quality is
unchecked. Do not present variants as reviewed.

## Rules for every screen

- Follow studio.md, "Screens".
- Use [choose-a-look.md](references/choose-a-look.md) to make deliberate
  visual choices.
- Use the `build-with-shadcn` skill for shadcn parts.
