# Status — greenfield-kit rebuild

Plan: `docs/plans/design-in-shadcn/plan.md`

| Stage | State |
| --- | --- |
| 1 Bloat removed, lag fix merged | done |
| 2 Studio moved into design-interface | done — test_studio 97/0, PartyFox stub finds the engine |
| 3 Design = code (app scaffold, live theme, build, shadcn parts from imports, checks, promote + pixel check) | done — test_app 17/17, test_studio 97/0 |
| 4 Pipeline docs (greenfield-mode, plan-feature, deliver-feature, verify, features, coordination) | now |
| 5 Animations pass in the front-end stage | queued |
| 6 README, PROJECT.md, manifests 0.9.0 | queued |
| 7 First real run: Call OS | queued |

Blocked: nothing. Waiting on you: nothing.

## Trace
- 1: deleted bro, reflect, shadcn extras, .DS_Store → validate/manifests/agnostic all pass → commit 7b8cb5b
- 3b: lang mismatch found by the pixel check (studio pages said en, app bg) → fixed → test_app 17/17 → docs: studio.md, new-project.md, variant-brief.md, promote.md, SKILL.md
- 3: studio-app template (Vite+shadcn, one folder per model) → init_studio.py installs it (79 s) → trial project: build ok, live theme ok (button = token, dark ok), checks 0/0, approve ok, promote → 8/12 pixel matches; phone mismatch = fonts still loading → settle() fixed → test_app.mjs written
- 2: git mv assets+scripts+4 refs → 17 files re-pathed → py_compile + node --check ok → test_studio 97 passed → PartyFox and Call OS `.engine-path` updated
