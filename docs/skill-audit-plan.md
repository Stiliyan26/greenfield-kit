# Skill audit and improvement plan

Made with `skill-creator-plus` in AUDIT mode across all 14 skills in `plugin/skills/`. **No skill has been changed yet.** This page is the report from AUDIT Step 4; you pick what gets applied.

How it was made:
- Ran `python3 .claude/skills/skill-creator-plus/scripts/validate_skill.py --all plugin/skills`, then once per skill.
- Five read-only agents read each skill in full (SKILL.md, references, scripts) and marked every rule in `references/audit-checklist.md` as pass, fail or N/A, with file:line evidence.
- They also checked the repo's own rules from `CLAUDE.md`: "Done when" on each step, a skill names only its hand-off, neutral domain, every named path exists.
- I re-checked the headline findings by hand: security.md:57, triage.md:43, deliver-feature:34, verify:4 against start:36, setup-project:36-37, greenfield.md:15, promote_variant.py:106, plan-feature:79, visual-quality.md:38. All of them held.

## 1. Where things stand

| Skill | Validator E/W | Rules failed on reading¹ | Worst issue |
|---|---|---|---|
| design-animations | 28 / 0 | 12 rules fail | The same rules sit in up to 6 files and contradict each other |
| review | 3 / 4 | 10 fail | `--security` says "never fix" and "fix mode" at once; gate assets don't fit the kit's stack |
| design-interface | 2 / 4 | 16 fail | `--variant` skips the approval check; promote's re-check can't be re-run |
| start | 1 / 1 | 14 fail | Pipeline hand-offs disagree with each other (explainer timing, promotion timing) |
| interactive-explanation | 2 / 2 | 11 fail | Triggers on `Status: review`, which comes before review's fixes |
| shadcn | 1 / 1 | 12 fail | `allowed-tools: npx shadcn@latest *` pre-approves overwriting the approved theme |
| plan-feature | 1 / 0 | 9 fail | Screen pass reads `src/routes/`, which doesn't exist yet at that point |
| write-code | 4 / 2 | 7 fail | Examples break the skill's own rules; "after every edit" names two different commands |
| verify | 1 / 0 | 6 fail | `disable-model-invocation: true`, yet `start` stage 5 expects an agent to run it |
| deliver-feature | 0 / 0 | 5 fail | `check:fix` after every edit rewrites the other agent's files |
| reflect | 1 / 0 | 4 fail | Writes new skills to `plugin/skills/`, which is wrong in a user project |
| setup-project | 0 / 0 | 4 fail | Its "Done when" can never pass (the template must keep `<...>` placeholders) |
| skill-creator-plus | 0 / 0 | 4 fail | The validator's false positives (about 20 in this library) |
| bro | 0 / 0 | 1 fail | The name doesn't say what it does |

¹ Counts are rough: the five auditors judged DS2 (imperative descriptions) differently, so some skills carry one extra fail (see D12).

Validator triage. False positives, so not real problems:
- SC5 `@/components`, `@/data` (path aliases).
- SC5 eslint plugins (install line is `bun add`, at write-code `assets/eslint.config.mjs:6-8`).
- ST6 orphans for scaffold files: design-interface `assets/studio-app/*`, interactive-explanation `remotion/*`, review `assets/project-rules/*` (linked as templates from `references/project-rules.md:19-21`).
- CT9 in reflect: "a TODO file" uses TODO as a noun.
- HK1 in setup-project: the match is template content.
- interactive-explanation DS3: it does say when, at `SKILL.md:3`.

All 34 ST5 errors (no contents list on files over 100 lines) are real.

## 2. Problems that cross skills (fix these first)

These are bugs in how the pipeline works, not style. Each needs a matching edit in two or more skills.

- **X1** **The explainer is built before the review fixes land.**
   - What happens: `deliver-feature/SKILL.md:64` sets `Status: review`, and `interactive-explanation/SKILL.md:3,21` triggers on that status.
   - Why it's wrong: `start/SKILL.md:70-72` and `review/SKILL.md:143` say review runs in fix mode first, then hands over.
   - Also: `start/references/coordination.md:40-45` skips review altogether.
   - Fix: trigger the explainer on "review hands over", and add review in fix mode to coordination.md.
- **X2** **Three skills put promotion at different points.** *Needs D5.*
   - design-interface step 7 promotes right after approval, into `web/` (`SKILL.md:89-93`).
   - start puts it in stage 5 (`SKILL.md:33,36`).
   - plan-feature's screen pass reads `src/routes/` (`SKILL.md:79`) before either one has happened.
   - Fix: decide one moment. Point plan-feature at `studio/app/src/variants/<id>/screens/` and `DESIGN.md`. This ties into the known gap (CLAUDE.md: promote writes Vite `web/`, not `src/routes/`).
- **X3** **verify can't be started by the pipeline.** *Needs D4.*
   - `verify/SKILL.md:4` is manual-only.
   - `start/SKILL.md:36` and `coordination.md:22` have the foundation agent produce `verify-<app>` with it.
   - Fix: either drop the flag, or have the lead ask the user to run `/verify`.
- **X4** **`check:fix` is unsafe with two agents in one checkout.**
   - `deliver-feature/SKILL.md:34` and `setup-project/templates/CLAUDE.md:20` say to run it after every edit.
   - It fixes the whole tree (`write-code/scripts/install_checks.py:28`), so it rewrites the other agent's files. `deliver-feature/SKILL.md:24-26` forbids that.
   - `write-code/SKILL.md:22` says `bun run check` instead.
   - Fix: one rule. Use `check`, not fix, mid-build. Optionally add a PostToolUse hook that lints only the edited file.
- **X5** **review's gate setup breaks a kit project.**
   - The layers don't match: `review/references/tools.md:18` and `assets/dependency-cruiser.frontend.cjs` use `app → pages → …`; write-code uses `routes → views → widgets → …`.
   - `no-server-code` (`frontend.cjs:58-63`) fails every `*.functions.ts`, which write-code requires (`structure.md:63-64`).
   - The rest assumes another stack: TypeORM, `client/`, `npm`.
   - Fix: drop what `bun run check` covers, align the layers or delete the frontend depcruise file, default `PACKAGES=['.']`, and use `bun`.
- **X6** **Feature-file statuses have no owner.**
   - `start/references/features.md:20` lists `proposed`, `building` and `proven`, but no skill sets them.
   - `coordination.md:63` reads `proven`.
   - Fix: plan-feature writes `proposed`, deliver-feature writes `building`, and the lead writes `proven`. Or drop the states nobody uses.
- **X7** **"No project names" is broken.**
   - `review/references/triage.md:43` has `docs/plans/hrise/...`.
   - Examples use the HR domain: review's config.md, report.md, checklist.md, triage.json; write-code's typescript.md:62-89 and react.md:138-140.
   - Fix: rewrite them with orders, customers and invoices.
- **X8** **Library-wide "Done when" gap (a CLAUDE.md rule).**
   - Missing in: start, plan-feature, review (report.md, reviewer.md), design-interface, design-animations, deliver-feature, reflect, verify (Maintain steps), skill-creator-plus (AUDIT 4-6, REFINE).
   - Already has them: interactive-explanation.
   - Fix: add a checkable "Done when" to each step, plus one go-back line per skill.
- **X9** **Descriptions overlap (LB1).**
   - "new product / new project" is claimed by start, plan-feature and design-interface.
   - "reviewing" is claimed by write-code and review.
   - "set up checks" is claimed by setup-project and review.
   - "review a skill" is claimed by skill-creator-plus and review.
   - "React screens" is claimed by shadcn, design-interface and write-code.
   - Fix: give each description its own job. Only start keeps "new product".

## 3. Per-skill changes, highest impact first

### review
- **review.1** Make security mode follow the target's mode (security.md:57 against SKILL.md:20,24,166).
- **review.2** Rewrite the gate assets for the kit stack (X5).
- **review.3** Remove `hrise` and the HR examples (X7).
- **review.4** Call the output a "review file", not a "feature file", and define "gate command" (or fall back to `bun run check`). Fixes CT4.
- **review.5** Have a fresh subagent check the fix commits in step 6, not the reviewer who made them. Fixes NM5.
- **review.6** "Done when" lines and a step 0-7 checklist. Fixes WF1.
- **review.7** Remove repeats inside the skill: config.md against SKILL.md, report.md:72-89, and triage.md:4 "no cap" against `maxReviewers`. Fixes CT10.
- **review.8** Sharpen the description against the built-in `code-review` and `security-review`. Fixes LB1.
- **review.9** Contents lists on checklist.md, report.md and reviewer.md. Fixes ST5.

### design-interface
- **design-interface.1** Fix the promote re-check: give the `compare_screens.mjs` command in promote.md, and print it at `promote_variant.py:153`. Fixes WF2, SC4.
- **design-interface.2** Close the `--variant` bypass at `promote_variant.py:106`: also require `selection.variant == variant` and `status == approved`. Fixes CT2.
- **design-interface.3** Fix the broken pointers:
   - `greenfield.md:15` points to `start`'s `variant-brief.md`, which doesn't exist. The file is in this skill.
   - `visual-quality.md:38` checks `studio/candidates`; it should be `studio/app/src/variants`.
- **design-interface.4** Parallel models share one build (`tsconfig.app.json:29`, `studio-build.ts`). Build per variant, or say "one at a time". *A guess from reading the code; not run.*
- **design-interface.5** "Done when" on steps 1-7.
- **design-interface.6** Fold `new-project.md` and `greenfield.md` into SKILL.md, so there's one copy of the steps. Fixes CT10.
- **design-interface.7** Use the full MCP name for `search_screens` and `search_flows` (SKILL.md:41). Fixes CT8.
- **design-interface.8** Use one placeholder for the scripts folder (four variants today). Fixes CT4.
- **design-interface.9** Reasons for SKILL.md:77 and :86-87. Scripts print "start the studio" instead of a bare `fetch failed`. Fixes NM3, SC1, SC2.
- **design-interface.10** Contents lists. Move legacy lines under "Old patterns". Fixes ST5, CT3.

### design-animations
- **design-animations.1** Settle the contradictions: two-tap, entry scale, hover duration, stagger, and whether it implements or only advises. Fixes CT10, CT7.
- **design-animations.2** Merge, then link:
   - Fold `animate/framer-motion.md` into motion-react/.
   - Fold `animate/css-techniques.md` into css-animations/.
   - Merge AUDIT.md and STANDARDS.md into one rule catalog.
   - Link svg, PLAN-TEMPLATE and PICKER from SKILL.md.
   - Fixes ST3, ST4, ST5, CT10.
- **design-animations.3** Rewrite SKILL.md as 3-4 steps with "Done when". Split "Audit or review" into its three modes. Fixes WF1, CT7.
- **design-animations.4** Remove "skill" framing from references (Invocation Variants tables, "Related skills"). Fixes CT4, NM1.
- **design-animations.5** Dated lines (CT3); one name, "Motion for React" (CT4).
- **design-animations.6** Candidate cuts of known CSS/perf basics. Test first. Fixes CT1, NM1.
- **design-animations.7** Say how strict PLAN-TEMPLATE and the motion-brief template are. Fixes CT5.

### start
- **start.1** Add review in fix mode to coordination.md, and change the explainer trigger (X1).
- **start.2** One promotion point (X2).
- **start.3** "Done when" on each stage and each "Add a feature" step, as a copyable checklist.
- **start.4** Define `STATUS.md` (SKILL.md:10 points to a "working agreement" that doesn't exist).
- **start.5** Owners for the statuses (X6).
- **start.6** Link `references/features.md` and give it a contents list (or move it; see decisions).
- **start.7** Remove the rules repeated from coordination.md, plan-feature and deliver-feature. Trim rows 3B and 4. Fixes CT10, CT1.
- **start.8** Reasons for "no worktrees" and "pipelining". features.md says "use these headings exactly". Fixes NM3, CT5.
- **start.9** Third-person description. Sharpen the trigger. Fix the "rules.." typo at README:152.

### plan-feature
- **plan-feature.1** The screen pass reads the approved variant, not `src/routes/` (SKILL.md:79).
- **plan-feature.2** "Done when" per step, with a checklist.
- **plan-feature.3** Remove repeats with plan.md and features.md. Fixes CT10.
- **plan-feature.4** New feature files start as `Status: proposed`.
- **plan-feature.5** Default mode is "you propose" (SKILL.md:27). Fixes CT7.
- **plan-feature.6** Rename the `## Start` heading. Stop naming the `start` skill. Fixes CT4 and the repo rule.
- **plan-feature.7** Contents list on misuse.md. Strictness line on plan.md.
- **plan-feature.8** Third-person description. Drop "new project". Fixes DS2, LB1.

### interactive-explanation
- **interactive-explanation.1** Trigger "after review hands over" (X1).
- **interactive-explanation.2** The no-key voice falls back to macOS `say`, which doesn't exist on Linux. Detect the OS or fail with a clear message. Fixes SC1.
- **interactive-explanation.3** One package manager:
   - SKILL.md:47 says `bun install`, but render.mjs:193 runs `npm`.
   - Both lockfiles exist.
   - Add an ffmpeg install line.
   - Fixes SC5.
- **interactive-explanation.4** Task-mode steps "1, 2, (3), 4, 6" plus a go-back line. Fixes WF1.
- **interactive-explanation.5** Remove `<slug>` from the description (DS1, would block an upload). Third person.
- **interactive-explanation.6** Fix the pointers:
   - script-format.md:4 and :12 point to SKILL.md; the content is in writing.md.
   - Add the missing `er` type.
   - Remove the stale page.mjs:1-4 comment.
- **interactive-explanation.7** Link or delete `references/explain.env.example`. Contents list on script-format.md.
- **interactive-explanation.8** Comment the magic constants in render, tts, clips and review. Fixes SC2.

### shadcn
- **shadcn.1** Narrow `allowed-tools` (SKILL.md:5) to `info/docs/search/view/add --dry-run`. Add one override line: "in a project with `DESIGN.md`, the theme is `design/shadcn.css`; no presets, `apply`, or theme edits". Fixes CT2, HK1, LB1.
- **shadcn.2** Remove stale chat-component lines (styling.md:16, :167-171), left over from the earlier trim.
- **shadcn.3** One copy of the CLI facts. Fix the ToggleGroup range that has already drifted ("2-7" against "2-5").
- **shadcn.4** Scope the description to component API and composition.
- **shadcn.5** Candidate trims, test first:
   - the always-fetch-docs rule (:168);
   - the `!npx … info` injection on every load (:17);
   - the capitals.
- **shadcn.6** Contents list on icons.md.

### write-code
- **write-code.1** Make examples follow the skill's own rules:
   - react.md:272 `type Status`;
   - :193 axios + useEffect;
   - :203,207 `handleRating`;
   - :134 `(r) =>`.
- **write-code.2** One command for "after every edit". Fixes CT10.
- **write-code.3** One owner per repeated rule. Delete checks.md:56-69. Fixes CT10.
- **write-code.4** Contents lists and grep hints on react.md, typescript.md, structure.md and backend.md.
- **write-code.5** Neutral domain in the examples.
- **write-code.6** Drop "and when reviewing it" from the description. Fixes LB1.
- **write-code.7** Candidate cuts of general React and TypeScript advice. Test first. Fixes NM1.

### verify
- **verify.1** Settle the invocation conflict (X3).
- **verify.2** Use one name each for `verify` and `verify-<app>` across the library.
- **verify.3** Remove `<app>` from the description. Fixes DS1.
- **verify.4** "Done when" on each Maintain step, plus a go-back line.
- **verify.5** "One map" lives only in features.md.
- **verify.6** Candidate cut of the non-web surfaces (CLI, TUI, mobile). Test first.

### deliver-feature
- **deliver-feature.1** Stop running `check:fix` across the tree mid-build (X4).
- **deliver-feature.2** "Done when" per step. Go-back: "critic under 70 → step 2".
- **deliver-feature.3** Make deliver-feature the owner of the build-agent rules. Start links to them.
- **deliver-feature.4** `src/server/shared/` against `server/shared/`. Add a reason for "green three times".

### reflect
- **reflect.1** New skills go to `.claude/skills/`, or `plugin/skills/` in a plugin repo (SKILL.md:66).
- **reflect.2** Delete step 4, which repeats the synthesizer.
- **reflect.3** Delete :11-13 ("when to invoke" in a manual-only skill) and the Cursor sentence.
- **reflect.4** "Done when" per step.

### setup-project
- **setup-project.1** A Done-when that can pass: "no line wholly in angle brackets"; check only on Bun or Node.
- **setup-project.2** One path for `install_checks.py` (`<plugin>` is undefined at :28).
- **setup-project.3** Make the description clearly different from review's gate setup.
- **setup-project.4** Fold step 1 into step 2.

### bro
- **bro.1** Optional rename (e.g. `plain-words`). Optional "keep every fact, number and decision".

### skill-creator-plus
- **skill-creator-plus.1** Validator fixes. These clear about 20 false findings in this library:
   - SC5: skip `@/`, `~/`, `#` imports.
   - ST6: count a file reachable when its parent folder is named; skip lockfiles, tsconfig, components.json, `*.d.ts`.
   - ST6: skip `.md` under `assets/` and `templates/`.
   - HK1/CT9/NM4: skip `templates/` and `assets/`.
   - CT9: match `TODO:` or `TODO(`, not the noun.
   - Print "No script findings" separately from "Needs a read".
   - Don't flag sibling-skill links inside one plugin.
   - Limit vague-name checks to `.md` and `.txt`.
- **skill-creator-plus.2** One home per rule: authoring-guide.md:164-172 restates NM1-NM5.
- **skill-creator-plus.3** Sharpen the trigger against `review` and `anthropic-skills:skill-creator`.
- **skill-creator-plus.4** Remove model names from the description (CT3).
- **skill-creator-plus.5** Make testing.md match the `claude plugin eval` format (`evals/**/case.yaml`).
- **skill-creator-plus.6** Add the missing "Done when" lines.

## 4. Mechanical batch (low risk, one commit)

- **M1** Add `## Contents` to the 34 files over 100 lines that lack one. For design-animations, do this after the merges.
- **M2** Remove the XML tags from the descriptions of interactive-explanation (`<slug>`) and verify (`<app>`).

## 5. Needs your decision

- **D1** **Vendored skills.**
   - shadcn: vendored from upstream, already trimmed in 7b8cb5b.
   - design-animations: from the animations.dev course; no upstream URL or license record.
   - design-interface: its `choose-a-look.md` is a verbatim copy.
   - Choose: own them and edit freely, or keep them in sync with upstream and put only override lines in SKILL.md.
   - Also: confirm the course content's license before redistributing it.
- **D2** **Hooks (HK1).** Which ones do you want?
   - Stop hook: `bun run check` must be clean.
   - PostToolUse: lint only the edited file.
   - PreToolUse: block `git worktree add` and `git stash` (start).
   - PreToolUse: block push, amend and rebase during review.
   - PreToolUse: block hand edits to `DESIGN.md` and `design/*`.
- **D3** **Is review kit-only, or stack-generic?** If kit-only, about 16 checklist lines become links to write-code. If generic, keep them and mark them "when write-code doesn't apply".
- **D4** **verify invocation:** drop `disable-model-invocation`, or have the lead ask the user to run `/verify`?
- **D5** **Where promotion happens** (X2). This also decides the order for fixing the TanStack gap in `promote_variant.py`.
- **D6** **Where `features.md` lives:** keep it in start and link it, or move it to plan-feature, which writes it. I'd move it.
- **D7** **Renames:** `start`, `bro`, `interactive-explanation`. Each changes its slash command and the README.
- **D8** **Does "names only its hand-off" exempt reference skills?** write-code and design-critic are named across skills on purpose. Is write-code, a reference skill with no steps, exempt from "Done when"?
- **D9** **Should the deliberately flawed `skill-creator-plus/examples/pdf-helper/` ship inside the plugin?** Check whether it loads as a skill once installed.
- **D10** **Every NM1/CT1 cut needs a with- and without-skill test first** (testing.md, "Test before you delete"). Which skills do you rely on most? Test those on all models; test the rest on your main model.
- **D11** **TS1-3 and LB2:** this repo has no evals. Run `/skill-doctor` to see each skill's cost and how often it's used.
- **D12** **Third person or imperative descriptions (DS2)?** Every skill uses the imperative ("Run…", "Plan…"). One auditor passed it as a library convention; another failed it. Decide once for the library; the per-skill "third-person" items follow this.

## 6. Suggested order

1. X1, X4, X5, X6: pipeline bugs. Agents act wrongly today. X2 and X3 once D5 and D4 are decided.
2. The safety fixes: review security mode, design-interface `--variant`, shadcn `allowed-tools`.
3. Neutral domain, and "Done when" across the library.
4. The validator fixes in skill-creator-plus, so the re-run after each step is trustworthy.
5. The mechanical batch (section 4).
6. CT10 duplication clean-up, skill by skill.
7. design-animations restructure, once decision 1 is made.
8. NM1/CT1 cuts, only after the tests.

After each step: run the validator on the changed skills, run both `claude plugin validate ... --strict`, and check that every path the skills name exists (CLAUDE.md "Checks"). After any script change, also run `test_studio.mjs`, plus `test_app.mjs` for promote.

Reply with item IDs to apply, e.g. `X1, X4, review.1, M1`, and answers to the D items. Nothing has been applied yet.

