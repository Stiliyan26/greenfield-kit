# Status — greenfield-kit rebuild

Plan: `docs/plans/design-in-shadcn/plan.md`

| Stage | State |
| --- | --- |
| 1 Bloat removed, lag fix merged | done |
| 2 Studio moved into design-interface | done — test_studio 97/0, PartyFox stub finds the engine |
| 3 Design = code (app scaffold, live theme, build, data-slot scan, checks, promote) | now |
| 4 Pipeline docs (greenfield-mode, plan-feature, deliver-feature, verify, features, coordination) | next |
| 5 Animations pass in the front-end stage | queued |
| 6 README, PROJECT.md, manifests 0.9.0 | queued |
| 7 First real run: Call OS | queued |

Blocked: nothing. Waiting on you: nothing.

## Trace
- 1: deleted bro, reflect, shadcn extras, .DS_Store → validate/manifests/agnostic all pass → commit 7b8cb5b
- 2: git mv assets+scripts+4 refs → 17 files re-pathed → py_compile + node --check ok → test_studio 97 passed → PartyFox and Call OS `.engine-path` updated
