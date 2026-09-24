# PartyFox working project

PartyFox is a sales demo of an internal kids-party agency tool. Its supplied specification is working notes, not a signed client brief. Read `PRODUCT.md` before designing product screens. Fake data only. The studio explores a visual identity; no visual direction has been approved yet.

## Current workspace

- `studio/` is a dependency-free local design comparison interface. It uses Python's standard library to serve HTML, CSS, and JavaScript at `http://127.0.0.1:4173/`.
- Run `python3 studio/server.py` from the project root. The browser saves the selected concept, palette, type, density, feedback, revision, and approval to `studio/selection.json`.
- `prototype/` currently contains only a Vite cache. The prior React source and package scripts are absent. Do not assume `npm run dev`, `typecheck`, `build`, or `design:review` exists.
- The workspace currently has no Git checkout, application API, database, or test suite. Do not invent migrations, browser suites, or HRise commands.
- `.agents/skills/greenfield-mode/` coordinates design choice, architecture, and delivery. `.agents/skills/impeccable/` is a local design-quality aid.

## Commands

| Purpose | Command, from project root |
| --- | --- |
| Open the design studio | `python3 studio/server.py` |
| Check server syntax | `python3 -m py_compile studio/server.py` |
| Check browser scripts | `node --input-type=module --check < studio/app.js` and the same for `studio/designs.js` |

## Product rules

Owner approves leave and marks a deposit received. Animator sees only their own party information, own pay, and the missing-deposit warning. Permissions not established by the notes remain open questions. Deposit percentage, animator cut, and bonus formula remain unset until supplied.

Design exploration belongs in `studio/`; accepted design and product decisions belong in `docs/plans/<project>/` once the user approves them. Preserve screenshots and review evidence in `temp/verification/` until the user has seen them.
