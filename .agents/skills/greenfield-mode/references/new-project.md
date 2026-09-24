# Starting a new product

This skill is a reusable workflow. It holds no product's brand, screens or
sample data. The studio engine lives in this skill and serves any project's
`studio/` content folder.

1. Read the new project's brief and instructions. Don't copy another project's
   product files or approved design.
2. If `studio/` exists, inspect it. Otherwise run
   `python3 <skill-root>/scripts/init_studio.py <project-root> --name "<product name>"`.
   It creates `project.json` with a neutral world, empty `candidates/` and
   `references/`, and the `server.py` stub. It refuses to overwrite.
3. Fill in `project.json` as [studio.md](studio.md) describes: `language`,
   `scripts`, the screens, the three status colors with their meanings, and
   sample text for the specimen. Write studio text in English; only candidate
   pages and specimen samples use the product's language. Put shared fake data in one file, such as
   `studio/data.js`, so every candidate shows the same content.
4. Research with `design-interface` step 2. Save the images to
   `studio/references/` and list them in `project.json`.
5. Round 1: write two or three layout contracts, then build each layout as
   `studio/candidates/<layout>.html` for every screen. Load
   `/_studio/frame.js` first and use only tokens. Keep `"round": "layout"`.
6. Run the quality gate: `capture.mjs`, then `check_tokens.py`, then the
   `design-critic` agent. Revise, then start `python3 studio/server.py` and
   give the user the URL. Wait for **Choose layout** in `selection.json`.
7. Round 2: add two or three worlds for the chosen layout. Set
   `"round": "identity"`. Remove the other layouts from `layouts` or leave
   them for reference; the user decides. Run the quality gate again, including
   each world's specimen.
8. The user tunes and presses **Approve**. Approval writes `DESIGN.md` and
   `design/tokens.css`. A later tune makes a new draft and marks the export
   outdated. If you change an approved candidate or world, tell the user and
   ask for a new approval. Move to architecture only after an approval.

If the browser or Playwright isn't available, say that visual quality is
unchecked. Don't present candidates as reviewed.

Skills installed in `~/.agents/skills/` work in every local project. A copy in
one project's `.agents/skills/` works only there. `server.py` finds the engine
in either place.
