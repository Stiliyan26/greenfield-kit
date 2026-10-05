# Status: pipeline v2 (docs/plans/pipeline-v2/plan.md)

| Step | State |
| --- | --- |
| 1 write-code for TanStack Start | done |
| 2 plan-feature + features.md | done |
| 3 deliver-feature | done |
| 4 create-verification-skill | done |
| 5 interactive-explanation into the plugin | done |
| 6 greenfield-mode | done |
| 7 add-feature | done |
| 8 setup-project, README, manifests, version | done |

Dropped the `refactor` skill (folder, symlink, README row) on the user's call; `shadcn` stays.
Also saved before peter-skills/ goes: review/references/security.md (from exploit-hunter, `--security`), docs/plans/pipeline-v2/backtest.md (from BACKTEST.md).

Blocked: nothing. Waiting on you: read the diff; decide on the commit; the `promote_variant.py` follow-up (writes a Vite `web/`, needs `src/routes/` + `src/views/`).

## Trace

- plan: read peter-skills ×6 → 5 question rounds (Q1–Q20) → flow.excalidraw redrawn → plan.md written → approved 2026-10-05
- 1: ran oxlint 1.86 on a sample config → 4 rules missing (naming, import order, blank lines, restricted syntax) → kept for a 4-rule ESLint config → wrote SKILL.md, structure/backend/tests/checks.md, oxlintrc.json, eslint.config.mjs, knip.json, install_checks.py → oxlint sample: 5 layer errors fired, functions.ts import allowed → install script run twice on a throwaway project → claude plugin validate ×2 pass, check_agnostic pass, check_manifests: pre-existing version mismatch (0.10.4 vs 0.11.0), fixed in step 8 → restored .cursor-plugin/marketplace.json (tracked, missing from disk)
- 2: wrote plan-feature SKILL.md, references/misuse.md (from the abuse checklist, orders examples), plan.md template, greenfield-mode features.md; review checklist plan mode gets the fresh-eyes checks → links + agnostic pass
- 3: wrote deliver-feature (BE + FE pair, contract first, stop-and-ask table); removed references/task.md → links + agnostic pass
- 4: rewrote create-verification-skill (.claude/skills/verify-<app>/, feature files as the map) and maintain-verification-skill; removed references/feature-map-example
- 5: rsync peter-skills/interactive-explanation → plugin (41 files, no node_modules); ROOT from cwd/EXPLAIN_ROOT; orders example; node --check on 16 scripts ok; build.mjs from a throwaway root prints usage and the missing-script error → symlink, gitignore
- 6: rewrote greenfield-mode SKILL.md (8 stages, fork after Frame, no worktrees) and coordination.md; review fix agents no longer in worktrees
- 7: wrote add-feature SKILL.md + symlink
- 8: explain.config.json template, setup-project table, README intro/diagram/table/building, PROJECT.md status, bump 0.12.0 → claude plugin validate ×2 pass, check_manifests agree, check_agnostic pass, every skill has a symlink, every named path exists; restored .codex/agents/*.toml (tracked, missing from disk)
