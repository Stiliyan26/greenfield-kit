---
name: design-interface
description: Design a screen or flow with real content, responsive states, visual review, and user approval before feature implementation. Use for new screens, flows, or visual-system changes.
---

# Design an interface

Read the product brief, existing code, and `DESIGN.md` if there is one. An
approved `DESIGN.md` wins for ordinary new screens: build them with its tokens
and don't invent a new look. For a new product or a full redesign, follow
[greenfield.md](references/greenfield.md). Use
[choose-a-look.md](references/choose-a-look.md) to make deliberate visual
choices. The client brief wins over both references.

The local studio is the place to show and approve work. Its format, views and
scripts are in `greenfield-mode`'s [studio.md](../greenfield-mode/references/studio.md).
Below, `<studio-scripts>` means that skill's `scripts/` folder.

## Small change in an approved system

Use the existing screens, components and `design/tokens.css`. Look outside
only for a pattern the product doesn't have yet. Show the change in the
studio or as a capture, then run `check_tokens.py` on the files you touched.

## New look or big redesign: models compete

Up to three models each design the whole product on their own, with its look.
The user compares them in the studio and picks one. A structure is judged on
every real screen at three sizes, not on one sample page.

1. **Frame the task.** Name the users, their devices, the information that
   matters and the states that change the screens. List every screen the brief
   names, with its role and requirement. Note the difficult ones: dense data,
   a warning or conflict, long real-language text. Read `studio/taste.md` if
   it exists. Ask only about gaps that would change the result a lot.

2. **Research in two passes.** Use Mobbin MCP (`search_screens`,
   `search_flows`) when it's connected. Retry a failed search once, then report
   it.
   - Pass 1, the task: 3–5 production screens that solve the same job ("staff
     schedule day view", not "modern dashboard"). Learn hierarchy, density and
     interaction.
   - Pass 2, the finish: 3–5 polished screens from other categories whose type,
     color or surfaces show the level of craft you want. Learn one concrete
     detail from each.
   - Look at every image, not just the titles. Download each useful
     `image_url` into `studio/references/` (the links expire after 30 days).
     Add it to `references` in `project.json`: put the result's `mobbin_url`
     in `url`, and write a one-line note on what to learn and what not to copy.
   - If Mobbin isn't available, use the user's examples or other real products
     and say so. Never invent a citation.

3. **Write the facts, not the design.** Put the screens, status colors and
   specimen text in `project.json`, and every record the screens need in one
   shared data file. Don't assign structures or styles to the models.

4. **Each model designs.** Fill in greenfield-mode's `variant-brief.md` once
   per model and start them in parallel. Each delivers every screen at
   1920×1080, 1440×900 and 390×844, and its own look: a real typeface pair
   that covers the product's scripts, all tokens in `oklch()`, and one
   signature detail. The brief tells them what to avoid and how to check.

5. **Quality gate, before the user sees anything.** Follow
   [visual-quality.md](references/visual-quality.md):
   - Capture: `node <studio-scripts>/capture.mjs --url <studio url> --out temp/verification/<run>`.
   - Fix what `capture.md` reports: sideways scroll, clipped text, fonts that
     didn't load, console errors.
   - Run `python3 <studio-scripts>/check_tokens.py --project studio/project.json studio/candidates`.
   - Ask the `design-critic` agent to score the captures. You may not grade
     your own work. Revise anything marked "revise first", capture again, and
     ask again. After two failed passes on one idea, replace the idea.

6. **User choice.** Give the studio URL. Say what each model made, in one
   line each, and what you couldn't check. Read `selection.json`,
   `comments.json` and `taste.md` after the user works in the page. Handle
   each open comment, then mark it done. Only `status: "approved"` counts.
   If the user approves in chat, ask them to press **Approve** in the studio.
   Only that button writes `DESIGN.md` and the `design/` files. Never call
   the approve API yourself, and never write those files by hand.

7. **Hand over.** `DESIGN.md`'s Components table lists the parts to build,
   each marked shadcn or custom. Check it against the approved screens and
   send gaps back to the model that designed them. In `greenfield-mode` the
   components are built next, before planning. List the data each screen
   needs and the open questions for `plan-feature` and `deliver-feature`.
   Link the approved revision and `DESIGN.md`.

Include loaded, empty, long-content, loading, save or error, and permission
states where they matter. Give keyboard focus a visible style. Design the
phone layout as its own arrangement, not a squeezed desktop.
