---
name: setup-project
description: Set up a project for stistack - copy CLAUDE.md, the .claude/ config that enables the plugin and the stack file, and install the stack's checks. Use when starting a project with the kit, or when asked to "set up the agent rules here".
---

# Set up a project

`<skill-root>` is the folder of this `SKILL.md`.

1. **Look for existing files.** Look for `CLAUDE.md` and `.claude/` in the
   project. The script never overwrites a file. It skips the file and says so.

   Done when you know which files exist.

2. **Copy the templates.** From the project root, run:

   ```
   python3 <skill-root>/scripts/setup_project.py .
   ```

   It copies:
   - `CLAUDE.md`: the working rules and the project's facts, to fill in.
   - `.claude/settings.json`: enables the plugin for everyone who trusts the
     folder.
   - `.claude/stack.json`: the stack, with every tool and command that the
     skills call by role.
   - `.claude/explain.config.json`.

   It adds `temp/` and `.playwright-mcp/` to `.gitignore`.

   Done when the script prints what it copied and what it skipped.

3. **Resolve skipped files.** For each skipped file, show the difference.
   Ask whether to merge by hand.

   Done when each skipped file is merged or the user chose to keep it.

4. **Fill in `CLAUDE.md`.** Write real commands and checks. Write only
   commands that you have run. Leave no line in angle brackets.

   Done when `CLAUDE.md` has no angle brackets and each command ran.

5. **Check the stack file.** If the project uses other tools, change the
   names, commands and paths in `.claude/stack.json` first.

   Done when `stack.json` matches the project's tools.

6. **Install the stack's checks.** Run the install script in
   `write-code/stacks/<name>/`. The `name` is in `stack.json`. The script
   writes the lint, format and dead-code configs, adds the `check` and
   `check:fix` scripts, and prints the packages to install. Keep a file that
   the team already has and likes. Say so.

   Done when the check command runs.

7. **Report.** Say what was copied, what was skipped and what the user still
   fills in.

   Done when the report has all three.
