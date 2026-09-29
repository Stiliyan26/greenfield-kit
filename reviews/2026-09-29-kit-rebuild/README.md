# Review: kit rebuild (range `8efdbaf..HEAD`) · 2026-09-29

**Target:** range `8efdbaf..HEAD` (11 commits: design = code, studio move, lag fix, pipeline docs, review 0.10.0)
**Tools:** passed (`tools.txt`: manifests agree, no project words, both `plugin validate`, `test_studio.mjs` 97/0, `test_app.mjs` 17/0)
**Depth:** full · **Reviewers:** 4 (opus) · **May run the app:** yes
**What worried you:** the pipeline docs contradicting each other; the design = code flow; the new review skill
**Problems:** 2 critical · 33 important · 22 later · **Fixed:** 0 (1 in progress)

This run's reviewers were started on the agent definition still loaded in the session (0.9.0: Read, Grep, Glob only), so nothing was run and every proof is `read`. Each problem names the command that would prove it; the close step runs them. The agent definition now has Bash, Write and Edit (#301).

## All problems

Ordered by feature, then priority. Numbers are the feature files' numbers.

| # | Problem | Priority | Who is hurt | Feature | Proof | Decision | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 100 | Parallel models break each other's builds | Critical | Every design run with 2–3 models: a type error or a build race in one model fails the others; approvals drop | [studio-scripts](studio-scripts.md#p100) | read | | open |
| 101 | Promotion can ship code edited after approval, and the check still passes | Important | The user: `web/` holds a design they never approved | [studio-scripts](studio-scripts.md#p101) | read | | open |
| 102 | The pixel check can't be re-run on the current code after promotion | Important | The promotion agent after a fix or the motion pass; compares an old build | [studio-scripts](studio-scripts.md#p102) | read | | open |
| 103 | The 1% threshold lets a wrong part pass as "matches" | Important | The user: a wrong button, badge or label passes the proof | [studio-scripts](studio-scripts.md#p103) | read | | open |
| 104 | Importing parts through a folder index crashes the studio build | Important | A model that follows write-code's index.ts rule | [studio-scripts](studio-scripts.md#p104) | read | | open |
| 105 | A model that follows the brief can fail the components check, and overlays are listed twice | Important | Models with open dialogs or a Toaster; DESIGN.md shows duplicates | [studio-scripts](studio-scripts.md#p105) | read | | open |
| 106 | DESIGN.md still tells delivery to rebuild the parts by hand | Important | Feature agents: second copies of parts that already exist | [studio-scripts](studio-scripts.md#p106) | read | | open |
| 107 | A light-only product shows shadcn's dark styles in the promoted app | Important | Users on dark-mode machines of a light-only product | [studio-scripts](studio-scripts.md#p107) | read | | open |
| 108 | The promoted tsconfig still lists the removed build plugin | Later | The next reader of `web/tsconfig.node.json` | [studio-scripts](studio-scripts.md#p108) | read | | open |
| 109 | `@/variants/<id>/…` imports work in the studio and break the promoted app | Later | Promotion fails on a variant that used the alias | [studio-scripts](studio-scripts.md#p109) | read | | open |
| 110 | Some screen ids break or collide in the promoted main.tsx | Later | Promotion of a project with ids like `screen` or `2fa` | [studio-scripts](studio-scripts.md#p110) | read | | open |
| 111 | The promoted package name can be invalid for npm | Later | Products with Cyrillic or punctuated names | [studio-scripts](studio-scripts.md#p111) | read | | open |
| 112 | A failed install leaves a half-made studio that init then refuses to replace | Later | The agent on a bad network | [studio-scripts](studio-scripts.md#p112) | read | | open |
| 113 | Build output piles up in git | Later | The repo: dead bundles after every build; `web/dist` committable | [studio-scripts](studio-scripts.md#p113) | read | | open |
| 114 | Dev mode points at URLs that don't exist | Later | A model using `npm run dev` | [studio-scripts](studio-scripts.md#p114) | read | | open |
| 115 | The "frame script first" test passes when the script is missing | Later | test_app proves less than it says | [studio-scripts](studio-scripts.md#p115) | read | | open |
| 116 | The comparison can leave a preview server running, or measure the wrong server | Later | The promotion agent on a failed launch | [studio-scripts](studio-scripts.md#p116) | read | | open |
| 1 | The components check misses a hand-drawn repeat when its copies differ by a state class | Important | Duplicate markup reaches `web/` unnamed | [studio-web](studio-web.md#p1) | read | | open |
| 2 | A model that excuses a Tailwind repeat by the name the check prints excuses nothing | Important | Models loop on a check that can't pass | [studio-web](studio-web.md#p2) | read | | open |
| 3 | The empty canvas tells models to write files into the build's output folder | Later | An agent on a fresh studio writes into `candidates/` | [studio-web](studio-web.md#p3) | read | | open |
| 4 | No test would catch the canvas dots drifting off the screens during a pan | Later | The next change to the canvas | [studio-web](studio-web.md#p4) | read | | open |
| 200 | A screen change after promotion can't be promoted again, and the pixel check can't be re-run | Important | Stage 3A/7 agents: the only documented command refuses (ships with #102) | [pipeline-docs](pipeline-docs.md#p200) | read | | open |
| 201 | Every feature diff breaks the rule the lead merges by | Important | The lead refuses every feature, or has no rule | [pipeline-docs](pipeline-docs.md#p201) | read | | open |
| 202 | A feature agent's request for a shared helper never reaches the lead | Important | Feature agents in plain worktrees wait forever | [pipeline-docs](pipeline-docs.md#p202) | read | | open |
| 203 | No doc says where `shared/` is or who owns the promoted screens | Important | Feature agents can't own the screen they wire; two leads build two layouts | [pipeline-docs](pipeline-docs.md#p203) | read | | open |
| 204 | The merge review is said to catch duplicate helpers, but the reviewer never reads the shared index | Important | Duplicated helpers pass the merge gate | [pipeline-docs](pipeline-docs.md#p204) | read | | open |
| 205 | The verify example teaches the second feature map the skill forbids | Important | Whoever creates a verify skill from the example | [pipeline-docs](pipeline-docs.md#p205) | read | | open |
| 206 | The design quality gate token-checks the built bundle instead of the models' code | Important | The gate can never pass; agents learn to ignore it | [pipeline-docs](pipeline-docs.md#p206) | read | | open |
| 207 | The shadcn skill tells agents to pull parts and presets the approved design forbids | Important | The approved look drifts in `web/` | [pipeline-docs](pipeline-docs.md#p207) | read | | open |
| 208 | The working agreement tells the agent to tick review decisions the user must tick | Important | You: the decision step is skipped silently | [pipeline-docs](pipeline-docs.md#p208) | read | | open |
| 209 | Codex in this repo still runs the removed lens-and-judge reviewer | Important | Merged into #309 | [pipeline-docs](pipeline-docs.md#p209) | read | | merged into #309 |
| 210 | No stage sets up the project commands, working agreement and e2e suite that later stages run | Important | Wave-1 agents on a fresh repo | [pipeline-docs](pipeline-docs.md#p210) | read | | open |
| 211 | Promotion's pixel check points at a fixed studio address the studio doesn't use | Important | The background promotion agent: connection errors | [pipeline-docs](pipeline-docs.md#p211) | read | | open |
| 212 | Feature agents can't find the token checker in a normal plugin install | Important | Feature agents skip a required check | [pipeline-docs](pipeline-docs.md#p212) | read | | open |
| 213 | The plan template saves to a different folder than every stage that reads it | Later | verify never drives a later-planned feature | [pipeline-docs](pipeline-docs.md#p213) | read | | open |
| 214 | A feature's status never reaches "merged" or "proven" | Later | You and the future Workbench: every feature says "review" | [pipeline-docs](pipeline-docs.md#p214) | read | | open |
| 215 | The new-product design guide points at the old home of the model brief | Later | An agent opens a file that doesn't exist | [pipeline-docs](pipeline-docs.md#p215) | read | | open |
| 216 | README says every agent keeps the root status file current | Later | Merge conflicts on STATUS.md if believed | [pipeline-docs](pipeline-docs.md#p216) | read | | open |
| 217 | The repo profile points at a status file this range deleted | Later | Agents working on the kit | [pipeline-docs](pipeline-docs.md#p217) | read | | open |
| 218 | README's pipeline leaves out the plan review and the whole-app review | Later | A user following the README | [pipeline-docs](pipeline-docs.md#p218) | read | | open |
| 219 | The repo's studio-page check asks for a 1024-wide capture that is never taken | Later | Agents working on the studio page | [pipeline-docs](pipeline-docs.md#p219) | read | | open |
| 300 | Fix agents start from a copy with no ticks, and merging their branches collides with the user's unsaved ticks | Critical | You: the fix loop can't finish as written | [review-skill](review-skill.md#p300) | read | | open |
| 301 | The reviewer is told to write its file but has no tool to write with | Important | This very run: the lead had to save every file | [review-skill](review-skill.md#p301) | read | fix now: A | fixing |
| 302 | Choosing "quick" changes nothing, and the documented flag makes the script fail | Important | You pick quick and get full; a lead following config.md gets an error | [review-skill](review-skill.md#p302) | read | | open |
| 303 | Moved files count as brand-new, so the plan overstates work and the reviewer finds no hunks to read | Important | This run: a 4,519-line "feature" that was 15 renames | [review-skill](review-skill.md#p303) | read | | open |
| 304 | Without feature files, one product feature is split across reviewers and unrelated code is lumped together | Important | HRise-style projects: time off across four reviewers | [review-skill](review-skill.md#p304) | read | | open |
| 305 | A feature file whose Owns paths don't match falls back to folder grouping with no warning | Important | Greenfield projects with `web/src/`: the plan's features are silently ignored | [review-skill](review-skill.md#p305) | read | | open |
| 306 | Deleted files reach no reviewer, so "nothing still uses the deleted code" is never checked | Important | Stale links found only by luck (this range: 62 deleted files) | [review-skill](review-skill.md#p306) | read | | open |
| 307 | Earlier review folders are reviewed as code in later reviews | Important | Every review after the first | [review-skill](review-skill.md#p307) | read | | open |
| 308 | Outside Claude Code, the configured models can't be applied, and fix and close have no fallback | Important | Codex and Cursor users | [review-skill](review-skill.md#p308) | read | | open |
| 309 | Codex in this repo still runs the old lens-and-judge reviewer | Important | Codex reviews in this repo stop at once (also found as #209) | [review-skill](review-skill.md#p309) | read | | open |
| 310 | The feature-stage review can't run as written, and it contradicts who may tick | Important | Feature agents: no sub-agents, no user, and a rule that forbids their ticks | [review-skill](review-skill.md#p310) | read | | open |
| 311 | The lead has to guess what the user ticked, and "later" / "not a problem" never reach Status | Important | You: ticks read differently each run; rows stay "open" forever | [review-skill](review-skill.md#p311) | read | | open |
| 312 | A fix that lives in another feature or in shared code has no agent allowed to make it | Important | Shared-code fixes are blocked forever | [review-skill](review-skill.md#p312) | read | | open |
| 313 | The review folder name is undefined for most targets, and a same-day re-run overwrites the previous one | Later | A second review the same day erases your ticks | [review-skill](review-skill.md#p313) | read | | open |
| 314 | README links to problems don't land on the problem | Later | You, clicking the table (this run's files already carry anchors) | [review-skill](review-skill.md#p314) | read | | open |
| 315 | `--app` silently leaves out config, CI, Docker and Markdown-based code | Later | Whole-app reviews miss CI, Docker and, here, every SKILL.md | [review-skill](review-skill.md#p315) | read | | open |
| 316 | A mistyped plan path gives a 0-line "plan" feature instead of an error | Later | Plan-mode reviews on a typo | [review-skill](review-skill.md#p316) | read | | open |

Proof: `ran` (a command, test or screenshot), `read` (found the line, not run).

## Suggested order

1. **#300, #100**: the two criticals. #300 means the fix loop of this very review can't run until it's fixed, so it goes first, before "fix" is said. #100 breaks every multi-model design run.
2. **The review skill's plumbing, so the fixes below can be reviewed and closed properly:** #311 (parseable ticks), #312 (shared fix agent), #310 (feature-stage variant), #307, #303, #306, #302, #308, #309, #304, #305.
3. **Design = code trust:** #101 (fingerprint at approval), #103 (local pixel rule), #102 + #200 (re-check and re-promote), #105, #104, #106, #107, #1, #2.
4. **Pipeline contradictions that stop a real run:** #201, #202, #203, #210, #211, #212, #204, #206, #207, #208, #205.
5. The rest (Later), mostly one-line doc and script fixes.

## Not run

- Nothing ran in the reviewers: they were started on the 0.9.0 read-only agent definition still loaded in the session. Every problem lists its proof command; the close step runs them after the fixes. To get running reviewers for the next run: restart Claude Code (0.10.0 is installed) and start the reviewers as `code-reviewer` with Bash, Write and Edit.
- `.agents/review/` has only `config.json`: no roles, scope, paging or conventions files, so the checklist's project-rule parts were checked against `goal.md` and `write-code` only.
- The phone-width pixel match: an earlier trial in the scratchpad showed 10.8–18% at 390 px while `tools.txt` says the current test passes all 12. Not confirmed on the current code: `node plugin/skills/design-interface/scripts/test_app.mjs --keep`, then read `<kept>/temp/verification/promote/compare.md`.
- The studio page's own UI and the pan-lag fix were not driven or timed (no Playwright run).
- Whether Codex multi-agent and `cursor-agent` accept a per-agent model (#308).

## Already there

- `component-scan.js:89`: a `notComponents` selector also excuses elements with more classes than it names; an invalid selector is silently ignored.
- `component-scan.js:113-114`: a single-element group is kept when any element is outside every listed part.
- `check_tokens.py:108-111`: with `--project`, allowed token names are the union of every variant's tokens.
- `studio_server.py:333`: the studio shows a world's dark look even when `themes` is `["light"]`.
- `examples/partyfox/docs/plans/partyfox/plan.md:251`: still describes the removed components stage and its `/_components` gallery.
- `shadcn/SKILL.md:16-18`: the `!`npx shadcn info`` injection is Claude Code-only; in Codex and Cursor it is literal text.
- `shadcn/cli.md:238-250`: the registry `build` command survived the trim.
- `review/assets/project-rules/triage.json:2`: the template ships a live `"^server/src/legacy/"` ignore rule.
