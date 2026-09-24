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

The local studio is the place to show and approve work. Its format, rounds and
scripts are in `greenfield-mode`'s [studio.md](../greenfield-mode/references/studio.md).
Below, `<studio-scripts>` means that skill's `scripts/` folder.

## Small change in an approved system

Use the existing screens, components and `design/tokens.css`. Look outside
only for a pattern the product doesn't have yet. Show the change in the
studio or as a capture, then run `check_tokens.py` on the files you touched.

## New look or big redesign: two rounds

Layout and identity are separate decisions. Mixing them lets a nice color
hide a weak arrangement, and a good arrangement hide a default look.

1. **Frame the task.** Name the user, the device, the information that matters
   and the states that change the layout. Pick one difficult screen: dense
   data, a warning or conflict, long real-language text. Read `studio/taste.md`
   if it exists. Ask only about gaps that would change the result a lot.

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

3. **Round 1: layouts.** Write a short contract for two or three layouts:
   the source idea from this product's world, a composition sketch, and the
   generic template it could be mistaken for plus the change that avoids it.
   Build each as a candidate on the same realistic data and difficult state,
   in the `neutral` world, with `"round": "layout"`. Layouts must differ in
   structure, not in color. Run the quality gate (step 5), then let the user
   choose a layout in the studio.

4. **Round 2: identity.** Write a contract for two or three worlds on the
   chosen layout. Each contract names:
   - A real typeface pair from Google Fonts that covers the product's scripts
     (for Bulgarian, `cyrillic`). Never a system font.
   - All ten tokens, with colors in `oklch()`. The quickest honest start is
     a library palette mapped to tokens (see the studio's Palettes section).
     Nothing is "provisional": each world must look finished before the user
     sees it. The user can then swap palettes freely, so type, shape and the
     signature detail carry the difference between worlds.
   - One signature detail you'd recognize without the logo, and the Pass 2
     reference it comes from.
   - What it must avoid: grey rounded cards, a lone blue primary, cream plus
     terracotta, black plus acid green, all-caps labels everywhere.
   Worlds must differ in type, color use and surface, not only in hue. Add
   them to `project.json`, set `"round": "identity"`, and check the specimen
   page for each world.

5. **Quality gate, before the user sees anything.** Follow
   [visual-quality.md](references/visual-quality.md):
   - Capture: `node <studio-scripts>/capture.mjs --url <studio url> --out temp/verification/<run>`.
   - Fix what `capture.md` reports: sideways scroll, clipped text, fonts that
     didn't load, console errors.
   - Run `python3 <studio-scripts>/check_tokens.py --project studio/project.json studio/candidates`.
   - Ask the `design-critic` agent to score the captures. You may not grade
     your own work. Revise anything marked "revise first", capture again, and
     ask again. After two failed passes on one idea, replace the idea.

6. **User choice.** Give the studio URL. Say what each candidate is, in one
   line each, and what you couldn't check. Read `selection.json`,
   `comments.json` and `taste.md` after the user works in the page. Handle
   each open comment, then mark it done. Only `status: "approved"` counts.
   If the user approves in chat, ask them to press **Approve** in the studio.
   Only that button writes `DESIGN.md` and `design/tokens.css`. Never call
   the approve API yourself, and never write those files by hand.

7. **Hand over.** List the components to extract, the data each screen needs,
   and the open questions for `plan-feature` and `deliver-feature`. Link the
   approved revision and `DESIGN.md`.

Include loaded, empty, long-content, loading, save or error, and permission
states where they matter. Give keyboard focus a visible style. Design the
phone layout as its own arrangement, not a squeezed desktop.
