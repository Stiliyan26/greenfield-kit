# Checks for this project

Run the checks that match the changed files. Commands are in `project.md`. A check that is missing, skipped or failing is not a pass.

## Code

1. <Type check, lint and unit tests, with the exact commands.>
2. Drive the changed flow in the running app, the way a user would. Save screenshots in `temp/verification/<task>/`.
3. For UI files, run the greenfield-mode token check against `design/tokens.css`. It must print `0 problems`.

## Design studio

1. Capture every candidate with the greenfield-mode `capture.mjs`. Read `capture.md`: no sideways scroll, no console errors, fonts loaded.
2. Ask the `design-critic` agent to score the captures before the user sees a new round.

Keep screenshots and test output in `temp/verification/` until the user has seen them. Report what each check showed and what was not checked. Visual approval is the user's decision.
