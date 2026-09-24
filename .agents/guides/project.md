# PartyFox working project

PartyFox is a sales demo of an internal kids-party agency tool. Its supplied specification is working notes, not a signed client brief. Read `PRODUCT.md` before designing product screens. Fake data only. The studio explores a visual identity; no visual direction has been approved yet.

## Current workspace

- `studio/` holds this project's design content only: `project.json`, `candidates/`, `references/`, `data.js`, and the files the page writes (`selection.json`, `comments.json`, `taste.md`). The engine is shared and lives in `.agents/skills/greenfield-mode/assets/studio-engine/`. The format is in `.agents/skills/greenfield-mode/references/studio.md`.
- The user chose the Roster layout in the studio. PartyFox is now in the identity round: three worlds (Rota, Ledger, Playroom) differ in type pair, radius and signature, and the user picks colors from the palette library on top. The neutral world stays for comparison and can't be approved.
- `prototype/` currently contains only a Vite cache. The prior React source and package scripts are absent. Do not assume `npm run dev`, `typecheck`, `build`, or `design:review` exists.
- The workspace has no application API, database, or app test suite. Do not invent migrations, browser suites, or HRise commands.
- The impeccable design hook is on for Claude Code and Codex (`.impeccable/config.json`). It checks UI files after Edit or Write.

## Commands

All from the project root. `G` is `.agents/skills/greenfield-mode`.

| Purpose | Command |
| --- | --- |
| Open the design studio | `python3 studio/server.py --port 4173` |
| Capture every candidate | `node $G/scripts/capture.mjs --url http://127.0.0.1:4173 --out temp/verification/<run> --studio` |
| Check candidates use only tokens | `python3 $G/scripts/check_tokens.py --project studio/project.json studio/candidates studio/data.js` |
| Test the studio engine end to end | `node $G/scripts/test_studio.mjs` |
| Check engine syntax | `python3 -m py_compile $G/assets/studio-engine/*.py` and `node --input-type=module --check < <file>` for each `.js` file in `$G/assets/studio-engine/web/` (`frame.js` with plain `node --check`) |
| Design detector | `.agents/skills/impeccable/scripts/impeccable detect studio/candidates` |
| Compare project and global skills | `python3 .agents/scripts/sync_skills.py` |

## Product rules

Owner approves leave and marks a deposit received. Animator sees only their own party information, own pay, and the missing-deposit warning. Permissions not established by the notes remain open questions. Deposit percentage, animator cut, and bonus formula remain unset until supplied.

Only a missing deposit may be solid red (`status.danger` in `studio/project.json`). A clash, an unassigned party or leave that needs cover uses `status.warning`.

Design exploration belongs in `studio/`; approved design writes `DESIGN.md` and `design/tokens.css`. Accepted product decisions belong in `docs/plans/<project>/` once the user approves them. Preserve screenshots and review evidence in `temp/verification/` until the user has seen them.
