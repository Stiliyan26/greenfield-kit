# Checks for this workspace

Run checks that match changed files. Commands are in `project.md`. A missing command is not a pass.

## Local studio or workflow skills

1. Validate changed skill frontmatter with the installed `skill-creator` validator if available. Read the skill as a future agent would: links, commands, stage transitions, and output paths must exist.
2. Run `python3 -m py_compile studio/server.py` when the local server changes. Run `node --input-type=module --check < studio/app.js` and `studio/designs.js` when browser scripts change.
3. Start the studio and load it at 1440, 1024, and 390 pixels. Inspect the actual calendar, booking, and animator previews, all concepts, font and color changes, keyboard focus, and phone view. Check the browser console and failed requests.
4. Change a control and verify `studio/selection.json` reflects it after saving. Submit an invalid selection to verify the server refuses it. Confirm approval changes the status, and a later edit returns it to draft.
5. Keep screenshots and test output in `temp/verification/`. Report what each check actually showed and any state not checked.

The current workspace has no React source, package scripts, API, database, CI, or Playwright suite. Checks from another project, including `verify-hrise`, `agents:check`, `gates`, and `check:architecture`, do not apply here.

When application code is added later, update this guide with commands that exist, then verify user flows in the running application. Visual approval remains a user decision; a typecheck or screenshot cannot supply it.
