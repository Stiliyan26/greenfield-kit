# Starting a new product

This skill is a reusable workflow. It holds no product's brand, screens or
sample data. The studio engine lives in this skill and serves any project's
`studio/` content folder.

1. Read the new project's brief and instructions. Don't copy another project's
   product files or approved design.
2. If `studio/` exists, inspect it. Otherwise run
   `python3 <skill-root>/scripts/init_studio.py <project-root> --name "<product name>"`.
   It creates `studio/` (project.json, empty `candidates/` and `references/`,
   the `server.py` stub) and `studio/app/`, the shared Vite + shadcn app with
   every shadcn part installed. It refuses to overwrite. npm is required.
3. Fill in `project.json` as [studio.md](studio.md) describes: `language`,
   `scripts`, the three status colors with their meanings (and `statusDark`),
   and sample text for the specimen. Write studio text in English; only
   screens and specimen samples use the product's language.
4. List the screens. Read the brief's confirmed requirements and add one
   screen for every view they name, with its `role` and the `requirement` it
   answers. A requirement that two roles act on (one asks, one approves) gets
   a screen per role. Owner ideas and unknowns get no screen yet.
5. Write the shared sample data in `studio/app/src/data.ts`, typed: every
   record the screens need, with the difficult states the brief implies
   (conflicts, missing information, long text, unknown figures left unset).
   Every model imports the same data.
6. Research with the design step's two passes. Save the images to
   `studio/references/` and list them in `project.json`.
7. Ask the user how many models design and which ones (one is normal, up to
   three). Fill in [variant-brief.md](variant-brief.md) once per model. Only
   the variant id, the model name and the port differ. Start one agent per
   model, in parallel. With one model, one variant is the whole round.
8. When they report, run the quality gate on all variants:
   `check_variant.py`, `check_components.mjs`, `capture.mjs`,
   `check_tokens.py`, then the `design-critic` agent. Send failures back to
   the model that made them.
9. Start `python3 studio/server.py` and give the user the URL. Say what each
   tab shows: one model's screens at three sizes; **Arena** shows every
   model; a screen in the left rail shows that screen from every model.
10. The user picks a model, tunes its colors and presses **Approve**.
    Approval writes `DESIGN.md` (with its Components table), `design/fonts.css`,
    `design/tokens.css` and `design/shadcn.css`. It refuses a variant without
    a `components` list. A later tune makes a new draft and marks the export
    outdated. So does a change to the approved variant's files; tell the user
    why and ask for a new approval.
11. After approval, promote the design into the app:
    [promote.md](promote.md). Planning runs alongside it.

If the browser or Playwright isn't available, say that visual quality is
unchecked. Don't present candidates as reviewed.

Skills installed in `~/.agents/skills/` work in every local project. A copy in
one project's `.agents/skills/` works only there. `server.py` finds the engine
in either place.
