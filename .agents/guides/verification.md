# Checks for this workspace

Run the checks that match the changed files. Commands are in `project.md`. A missing command is not a pass.

## Studio engine (`.agents/skills/greenfield-mode/assets/studio-engine/` or its scripts)

1. Check syntax of every changed Python and JavaScript file.
2. Run `node .agents/skills/greenfield-mode/scripts/test_studio.mjs`. It must print `0 failed`. It builds a throwaway project, starts the real server and drives the page in Chromium: empty state, grid, fonts, widths, contrast and hue checks, tuning, comments, approval export, and server refusals.
3. Start the PartyFox studio and capture it with `--studio`. Open the studio captures at 1440 and 390 and look at them.

## Studio content (`studio/`)

1. `check_tokens.py --project studio/project.json studio/candidates studio/data.js` prints `0 problems`.
2. Capture every candidate. Read `capture.md`: no sideways scroll, no console errors, fonts loaded when a world names them. Explain any clipped text that stays on purpose.
3. Run the impeccable detector on `studio/candidates` if the hook didn't run on your edits.
4. Ask the `design-critic` agent to score the captures before the user sees a new round.

## Workflow skills and agents

1. Read each changed skill as a future agent would. Links, commands, stage order and output paths must exist.
2. Validate changed frontmatter with the installed `skill-creator` validator if available.
3. Run `python3 .agents/scripts/sync_skills.py`. After a `--push` it prints `Shared skills and agents match.`

Keep screenshots and test output in `temp/verification/`. Report what each check showed and what was not checked.

The workspace has no React source, package scripts, API, database or CI. Checks from another project, including `verify-hrise`, `agents:check`, `gates` and `check:architecture`, don't apply. Visual approval is the user's decision; no check or screenshot supplies it.
